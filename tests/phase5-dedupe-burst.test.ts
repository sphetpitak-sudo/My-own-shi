// ============================================
// Phase 5 — Idempotent retry (dedupe) + followup burst backstop
// - retryAfterError with a matching completed row -> deduped JSON,
//   zero spend, zero rate-limit consumption
// - retryAfterError with no match -> normal spend path
// - fresh attempts ignore existing rows (no behavior change)
// - concurrent followups: trigger backstop turns the loser into 429
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai")>();
  return { ...orig, getOpenAI: vi.fn() };
});

import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/ai";
import { POST as readingPOST } from "@/app/api/reading/route";
import { POST as followupPOST } from "@/app/api/reading/followup/route";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const READING_ID = "00000000-0000-0000-0000-000000000002";

const CARDS = [{ cardId: 0, positionLabel: "Answer", reversed: false }];

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function* oneChunk() {
  yield { choices: [{ delta: { content: "ok" } }] };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- reading dedupe ----

function readingSupabase(completedRows: unknown[]) {
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "check_rate_limit") return { data: true };
    if (fn === "spend_for_spread") return { data: 5, error: null };
    if (fn === "check_ai_breaker") return { data: false, error: null };
    if (fn === "record_ai_failure") return { data: null, error: null };
    if (fn === "refund_by_reading") return { data: 5, error: null };
    throw new Error(`unexpected rpc ${fn}`);
  });
  const selectBuilder = {
    eq: vi.fn(() => selectBuilder),
    neq: vi.fn(() => selectBuilder),
    gte: vi.fn(() => selectBuilder),
    order: vi.fn(() => selectBuilder),
    limit: vi.fn(async () => ({ data: completedRows, error: null })),
  };
  const from = vi.fn(() => ({
    select: vi.fn(() => selectBuilder),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: "read-new" }, error: null })),
      })),
    })),
  }));
  return {
    rpc,
    from,
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
  };
}

const RETRY_BODY = {
  spreadType: "single",
  topic: "general",
  question: "q?",
  cards: CARDS,
  retryAfterError: true,
};

const COMPLETED = [
  { id: "read-old", interpretation: "คำทำนายเดิม", cards: CARDS },
];

describe("reading idempotent retry (dedupe)", () => {
  it("matching completed row -> deduped JSON, no spend, no rate-limit", async () => {
    const sb = readingSupabase(COMPLETED);
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await readingPOST(post("http://localhost/api/reading", RETRY_BODY));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toMatchObject({ deduped: true, readingId: "read-old" });
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it("no match -> normal spend path", async () => {
    const sb = readingSupabase([]);
    vi.mocked(createClient).mockResolvedValue(sb as never);
    vi.mocked(getOpenAI).mockReturnValue({
      chat: { completions: { create: vi.fn(async () => { throw new Error("AI_CREATE_TIMEOUT"); }) } },
    } as never);

    const res = await readingPOST(post("http://localhost/api/reading", RETRY_BODY));
    expect(res.status).toBe(502);
    expect(sb.rpc.mock.calls.some((c) => c[0] === "spend_for_spread")).toBe(true);
  });

  it("fresh attempt ignores existing rows (spends normally)", async () => {
    const sb = readingSupabase(COMPLETED);
    vi.mocked(createClient).mockResolvedValue(sb as never);
    vi.mocked(getOpenAI).mockReturnValue({
      chat: { completions: { create: vi.fn(async () => { throw new Error("AI_CREATE_TIMEOUT"); }) } },
    } as never);

    const fresh = {
      spreadType: RETRY_BODY.spreadType,
      topic: RETRY_BODY.topic,
      question: RETRY_BODY.question,
      cards: RETRY_BODY.cards,
    };
    const res = await readingPOST(post("http://localhost/api/reading", fresh));
    expect(res.status).toBe(502);
    expect(sb.rpc.mock.calls.some((c) => c[0] === "spend_for_spread")).toBe(true);
  });
});

// ---- followup burst ----

function followupSupabase(opts: { count: number; secondInsertFails: boolean }) {
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "check_rate_limit") return { data: true };
    throw new Error(`unexpected rpc ${fn}`);
  });
  let inserts = 0;
  const from = vi.fn((table: string) => {
    if (table === "admin_settings") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { value: { enabled: false } }, error: null })),
          })),
        })),
      };
    }
    if (table === "readings") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: READING_ID,
                user_id: USER_ID,
                cards: CARDS,
                spread_type: "single",
                question: "q?",
                interpretation: "done",
              },
              error: null,
            })),
          })),
        })),
      };
    }
    if (table === "reading_followups") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null, count: opts.count })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              inserts++;
              if (opts.secondInsertFails && inserts > 1) {
                // Real Supabase returns { error }, never throws here.
                return { data: null, error: { message: "Followup limit reached" } };
              }
              return { data: { id: `pending-${inserts}` }, error: null };
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              // CAS guard: .eq("answer", "__generating__").select("id")
              eq: vi.fn(() => ({
                select: vi.fn(async () => ({ data: [{ id: "pending-1" }], error: null })),
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return { rpc, from, auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) } };
}

const FOLLOWUP_BODY = { readingId: READING_ID, followQuestion: "แล้วต่อล่ะ?" };

describe("followup burst backstop", () => {
  it("trigger rejection on the losing reservation -> exactly one 200 + one 429", async () => {
    const sb = followupSupabase({ count: 1, secondInsertFails: true });
    vi.mocked(createClient).mockResolvedValue(sb as never);
    vi.mocked(getOpenAI).mockReturnValue({
      chat: { completions: { create: vi.fn(async () => oneChunk()) } },
    } as never);

    const [r1, r2] = await Promise.all([
      followupPOST(post("http://localhost/api/reading/followup", FOLLOWUP_BODY)),
      followupPOST(post("http://localhost/api/reading/followup", FOLLOWUP_BODY)),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 429]);
    // Winner streams to completion.
    const okRes = r1.status === 200 ? r1 : r2;
    expect(await okRes.text()).toContain("[DONE]");
  });
});
