// ============================================
// Phase 3 — Unified rate-limit policy tests
// - Limit BEFORE spend on every paid endpoint (no spend-then-refund on 429)
// - Fail-CLOSED on DB errors (503, never fail-open)
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
import { POST as readingPOST } from "@/app/api/reading/route";
import { POST as birthchartPOST } from "@/app/api/birthchart/route";

const USER_ID = "00000000-0000-0000-0000-000000000001";

function makeSupabase(opts: { rateLimit?: boolean | "throw" }) {
  const rpc = vi.fn(async (fn: string) => {
    if (fn === "check_rate_limit") {
      if (opts.rateLimit === "throw") throw new Error("DB down");
      return { data: opts.rateLimit ?? true };
    }
    if (fn === "spend_for_spread") return { data: 25, error: null };
    throw new Error(`unexpected rpc ${fn}`);
  });
  return {
    rpc,
    from: vi.fn(() => {
      throw new Error("from() should not be called on this path");
    }),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
  };
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
  question: "test?",
  cards: [{ cardId: 0, positionLabel: "Answer", reversed: false }],
};

const VALID_BIRTHCHART = { date: "2000-01-01", time: "12:00", place: "Bangkok" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("limit-before-spend (no spend on 429)", () => {
  it("birthchart: 429 without any spend call (Phase 3 unified order)", async () => {
    const sb = makeSupabase({ rateLimit: false });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await birthchartPOST(post("http://localhost/api/birthchart", VALID_BIRTHCHART));
    expect(res.status).toBe(429);
    expect(sb.rpc).toHaveBeenCalledTimes(1); // only check_rate_limit
    expect(sb.rpc).not.toHaveBeenCalledWith("spend_for_spread", expect.anything());
    expect(sb.rpc).not.toHaveBeenCalledWith("refund_points", expect.anything());
  });

  it("reading: 429 without any spend call", async () => {
    const sb = makeSupabase({ rateLimit: false });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(429);
    expect(sb.rpc).toHaveBeenCalledTimes(1);
    expect(sb.rpc).not.toHaveBeenCalledWith("spend_for_spread", expect.anything());
  });
});

describe("fail-closed on DB errors", () => {
  it("reading: rate-limit DB down -> 503 (never fail-open), no spend", async () => {
    const sb = makeSupabase({ rateLimit: "throw" });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await readingPOST(post("http://localhost/api/reading", VALID_SINGLE));
    expect(res.status).toBe(503);
    expect(sb.rpc).not.toHaveBeenCalledWith("spend_for_spread", expect.anything());
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Database busy/i);
  });

  it("birthchart: rate-limit DB down -> 503, no spend", async () => {
    const sb = makeSupabase({ rateLimit: "throw" });
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await birthchartPOST(post("http://localhost/api/birthchart", VALID_BIRTHCHART));
    expect(res.status).toBe(503);
    expect(sb.rpc).not.toHaveBeenCalledWith("spend_for_spread", expect.anything());
  });
});
