// ============================================
// Phase 1 — Resilience tests (retry + breaker + CAS)
// - withAiRetry: retries transient pre-stream errors once, never non-retryable
// - Breaker open: 503 + refund, AI create never called (fail-open on RPC error)
// - Retry success: 2nd attempt streams to [DONE] with a single spend
// - CAS lost: sweeper-deleted row -> refund message, no [DONE]
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
import {
  withAiRetry,
  isRetryableAiError,
  isBreakerOpen,
} from "@/lib/ai";
import { POST as readingPOST } from "@/app/api/reading/route";

const USER_ID = "00000000-0000-0000-0000-000000000001";

// Chainable builder: query methods return self; single()/maybeSingle() and
// direct await (then) resolve to per-builder results.
function chain(opts: { singleResult?: unknown; thenResult?: unknown }) {
  const self: Record<string, unknown> = {};
  const chainable = () => self;
  for (const m of ["insert", "select", "update", "delete", "eq", "gte", "ilike"]) {
    self[m] = vi.fn(chainable);
  }
  self.single = vi.fn(async () => opts.singleResult ?? { data: null, error: null });
  self.maybeSingle = vi.fn(async () => opts.singleResult ?? { data: null, error: null });
  (self as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    Promise.resolve(opts.thenResult ?? { data: null, error: null }).then(resolve);
  return self;
}

function makeReadingSupabase(opts: {
  breakerOpen?: boolean;
  breakerRpcFails?: boolean;
  casRows?: { id: string }[];
}) {
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "check_rate_limit") return { data: true };
    if (fn === "spend_for_spread") return { data: 5, error: null };
    if (fn === "check_ai_breaker") {
      if (opts.breakerRpcFails) throw new Error("rpc missing");
      return { data: !!opts.breakerOpen, error: null };
    }
    if (fn === "record_ai_failure") return { data: null, error: null };
    if (fn === "refund_by_reading") return { data: 5, error: null };
    if (fn === "refund_points") return { data: null, error: null };
    throw new Error(`unexpected rpc ${fn}`);
  });
  const insertBuilder = chain({ singleResult: { data: { id: "read-1" }, error: null } });
  const updateBuilder = chain({ thenResult: { data: opts.casRows ?? [{ id: "read-1" }] } });
  const from = vi.fn(() => insertBuilder);
  from.mockReturnValueOnce(insertBuilder).mockReturnValue(updateBuilder);
  return {
    rpc,
    from,
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
  };
}

async function* oneChunk() {
  yield { choices: [{ delta: { content: "สวัสดี" } }] };
}

const VALID_SINGLE = {
  spreadType: "single",
  topic: "general",
  question: "วันนี้ควรโฟกัสอะไร?",
  cards: [{ cardId: 0, positionLabel: "Answer", reversed: false }],
};

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withAiRetry (lib)", () => {
  it("retries a transient AI_CREATE_TIMEOUT once then succeeds", async () => {
    const fn = vi.fn(async (attempt: number) => {
      if (attempt === 1) throw new Error("AI_CREATE_TIMEOUT");
      return "ok";
    });
    await expect(withAiRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("never retries non-retryable errors", async () => {
    const fn = vi.fn(async () => {
      throw new Error("VALIDATION exploded");
    });
    await expect(withAiRetry(fn, { baseDelayMs: 1 })).rejects.toThrow("VALIDATION");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting attempts", async () => {
    const fn = vi.fn(async () => {
      throw new Error("AI_CREATE_TIMEOUT");
    });
    await expect(withAiRetry(fn, { maxAttempts: 2, baseDelayMs: 1 })).rejects.toThrow(
      "AI_CREATE_TIMEOUT"
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("isRetryableAiError (lib)", () => {
  it.each([
    [new Error("AI_CREATE_TIMEOUT"), true],
    [Object.assign(new Error("x"), { name: "AbortError" }), true],
    [Object.assign(new Error("x"), { status: 503 }), true],
    [new Error("ordinary bug"), false],
    ["string", false],
  ])("%s -> %s", (err, expected) => {
    expect(isRetryableAiError(err)).toBe(expected);
  });
});

describe("breaker fail-open (lib)", () => {
  it("returns closed when the RPC is missing/fails", async () => {
    const store = { rpc: vi.fn(async () => { throw new Error("rpc missing"); }) };
    await expect(isBreakerOpen(store, "reading")).resolves.toBe(false);
  });
});

describe("reading route + breaker", () => {
  it("breaker open -> 503 + refund, AI create never called", async () => {
    const sb = makeReadingSupabase({ breakerOpen: true });
    vi.mocked(createClient).mockResolvedValue(sb as never);
    const create = vi.fn();
    vi.mocked(getOpenAI).mockReturnValue({ chat: { completions: { create } } } as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(503);
    expect(create).not.toHaveBeenCalled();
    expect(sb.rpc.mock.calls.some((c) => c[0] === "refund_by_reading")).toBe(true);
  });

  it("transient fail then success -> [DONE] with a single spend, no refund", async () => {
    const sb = makeReadingSupabase({});
    vi.mocked(createClient).mockResolvedValue(sb as never);
    const create = vi.fn(async () => { throw new Error("AI_CREATE_TIMEOUT"); });
    create.mockResolvedValueOnce(oneChunk() as never);
    // First call throws, retry succeeds: mockRejectedValueOnce then default resolve.
    create.mockReset();
    create.mockRejectedValueOnce(new Error("AI_CREATE_TIMEOUT"));
    create.mockResolvedValue(oneChunk() as never);
    vi.mocked(getOpenAI).mockReturnValue({ chat: { completions: { create } } } as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("[DONE]");
    expect(create).toHaveBeenCalledTimes(2);
    expect(sb.rpc.mock.calls.filter((c) => c[0] === "spend_for_spread")).toHaveLength(1);
    expect(sb.rpc.mock.calls.some((c) => c[0] === "refund_by_reading")).toBe(false);
  });

  it("CAS lost to sweeper -> refund message, no [DONE]", async () => {
    const sb = makeReadingSupabase({ casRows: [] });
    vi.mocked(createClient).mockResolvedValue(sb as never);
    const create = vi.fn(async () => oneChunk());
    vi.mocked(getOpenAI).mockReturnValue({ chat: { completions: { create } } } as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    // controller.error() aborts the stream: read manually, tolerating abort.
    let body = "";
    try {
      const reader = res.body!.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        body += new TextDecoder().decode(value);
      }
    } catch {
      // Stream aborted by design after the refund message.
    }
    expect(body).not.toContain("[DONE]");
    expect(body).toContain("แต้มคืนแล้ว");
  });
});
