// ============================================
// Phase 0.5 — Critical-path points tests (must stay green before Phase 1)
// Suite 1: deduct-only-once (one spend per valid request, none on invalid)
// Suite 2: refund-on-timeout (AI fail -> refund_by_reading once + row deleted)
// Suite 3: rate-limit invariant (429 never leaves the user charged)
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
import { POST as birthchartPOST } from "@/app/api/birthchart/route";

const USER_ID = "00000000-0000-0000-0000-000000000001";

// Chainable Supabase query-builder stub (insert/select/single/eq/update/delete).
function qb(singleResult: unknown = { data: null, error: null }) {
  const self: Record<string, unknown> = {};
  const chain = () => self;
  self.insert = vi.fn(chain);
  self.select = vi.fn(chain);
  self.update = vi.fn(chain);
  self.delete = vi.fn(chain);
  self.eq = vi.fn(chain);
  self.gte = vi.fn(chain);
  self.ilike = vi.fn(chain);
  self.single = vi.fn(async () => singleResult);
  self.maybeSingle = vi.fn(async () => singleResult);
  // Awaited directly in a few paths (e.g. delete().eq().eq())
  (self as { then: unknown }).then = (
    resolve: (v: unknown) => void
  ) => Promise.resolve({ data: null, error: null }).then(resolve);
  return self;
}

function makeSupabase(opts: {
  rateLimitOk?: boolean;
  spendResult?: number | null;
  readingId?: string;
}) {
  const rpc = vi.fn(async (fn: string, args?: Record<string, unknown>) => {
    if (fn === "check_rate_limit") return { data: opts.rateLimitOk ?? true };
    if (fn === "spend_for_spread") return { data: opts.spendResult ?? 5, error: null };
    if (fn === "refund_by_reading") return { data: 5, error: null };
    if (fn === "refund_points") return { data: null, error: null };
    throw new Error(`unexpected rpc ${fn} ${JSON.stringify(args)}`);
  });
  const builders: ReturnType<typeof qb>[] = [];
  const from = vi.fn((_table: string) => {
    const b = qb({ data: { id: opts.readingId ?? "read-1" }, error: null });
    builders.push(b);
    return b;
  });
  return {
    rpc,
    from,
    builders,
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
  };
}

function aiThrows(err: Error) {
  vi.mocked(getOpenAI).mockReturnValue({
    chat: { completions: { create: vi.fn(async () => { throw err; }) } },
  } as never);
}

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_SINGLE = {
  spreadType: "single",
  topic: "general",
  question: "วันนี้ควรโฟกัสอะไร?",
  cards: [{ cardId: 0, positionLabel: "Answer", reversed: false }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Suite 1 — deduct-only-once (/api/reading)", () => {
  it("calls spend_for_spread exactly once per valid request", async () => {
    const sb = makeSupabase({});
    vi.mocked(createClient).mockResolvedValue(sb as never);
    aiThrows(new Error("AI_CREATE_TIMEOUT"));

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(502); // AI failed -> refunded path
    // Phase 1 order: rate_limit + spend + breaker_check + failure_record + refund
    expect(sb.rpc).toHaveBeenCalledTimes(5);
    expect(sb.rpc).toHaveBeenNthCalledWith(2, "spend_for_spread", {
      p_spread: "single",
      p_description: "single reading",
    });
    const spends = sb.rpc.mock.calls.filter((c) => c[0] === "spend_for_spread");
    expect(spends).toHaveLength(1); // still exactly one spend despite retry
  });

  it("never spends on validation failure", async () => {
    const sb = makeSupabase({});
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await readingPOST(
      post("http://localhost/api/reading", { ...VALID_SINGLE, cards: [] })
    );
    expect(res.status).toBe(400);
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  // GAP — concurrent double-submit is NOT covered yet (no CAS/idempotency
  // infra exists until Phase 1.1 ships its compare-and-set guard).
  // Target: end of Phase 1.1. Covers both the race (two in-flight POSTs
  // creating two generating rows / double spend) and the retry-after-timeout
  // variant — not just the idempotency-key mechanism.
  it.todo("concurrent double-submit spends only once (blocked on 1.1 CAS guard)");
});

describe("Suite 2 — refund-on-timeout (/api/reading)", () => {
  it("refunds by reading id exactly once and deletes the generating row", async () => {
    const sb = makeSupabase({ readingId: "read-42" });
    vi.mocked(createClient).mockResolvedValue(sb as never);
    aiThrows(new Error("AI_CREATE_TIMEOUT"));

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(502);

    const refunds = sb.rpc.mock.calls.filter((c) => c[0] === "refund_by_reading");
    expect(refunds).toHaveLength(1);
    expect(refunds[0][1]).toEqual({ p_reading_id: "read-42" });

    // A delete on readings for the generating row must have happened.
    const deletes = sb.builders.flatMap((b) => (b.delete as ReturnType<typeof vi.fn>).mock.calls);
    expect(deletes.length).toBeGreaterThan(0);
  });
});

describe("Suite 3 — rate-limit invariant (429 never leaves the user charged)", () => {
  it("reading: rate-limited BEFORE spend (spend never called)", async () => {
    const sb = makeSupabase({ rateLimitOk: false });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(429);
    expect(sb.rpc).toHaveBeenCalledTimes(1); // only check_rate_limit
    expect(sb.rpc).not.toHaveBeenCalledWith(
      "spend_for_spread",
      expect.anything()
    );
  });

  it("birthchart: 429 leaves net balance unchanged (invariant, survives Phase 3)", async () => {
    // PERMANENT INVARIANT — independent of spend/limit ordering. After the
    // Phase 3 refactor (limit-before-spend) this still holds as 0 - 0 == 0.
    const sb = makeSupabase({ rateLimitOk: false, spendResult: 25 });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await birthchartPOST(
      post("http://localhost/api/birthchart", {
        date: "2000-01-01",
        time: "12:00",
        place: "Bangkok",
      })
    );
    expect(res.status).toBe(429);
    const charged = sb.rpc.mock.calls
      .filter((c) => c[0] === "spend_for_spread" || c[0] === "spend_points")
      .length;
    const refunded = sb.rpc.mock.calls.filter((c) => c[0] === "refund_points").length;
    // Mock charges a fixed 25 per spend call; net must be zero either way.
    expect(charged * 25 - refunded * 25).toBe(0);
  });

  it("CURRENT BEHAVIOR — will change in Phase 3: birthchart spends BEFORE rate-limit check", async () => {
    // TEMPORARY contract documenting today's order (spend -> limit -> refund).
    // Phase 3 unifies this to limit-before-spend (like /api/reading); when
    // that lands, DELETE this test — the invariant test above is the keeper.
    const sb = makeSupabase({ rateLimitOk: false, spendResult: 25 });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await birthchartPOST(
      post("http://localhost/api/birthchart", {
        date: "2000-01-01",
        time: "12:00",
        place: "Bangkok",
      })
    );
    expect(res.status).toBe(429);
    const order = sb.rpc.mock.calls.map((c) => c[0]);
    expect(order.indexOf("spend_for_spread")).toBeLessThan(order.indexOf("check_rate_limit"));
    expect(order).toContain("refund_points");
  });
});
