// ============================================
// Phase 2 — Sweeper + reconcile cron tests
// - Fail-closed auth (no secret -> 503, wrong secret -> 401)
// - Sweep delegates to the atomic RPC once and returns its counts
// - Reconcile is report-only (200 even with drift; RPC owns the math)
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { GET as sweepGET } from "@/app/api/cron/sweep-generating/route";
import { GET as reconcileGET } from "@/app/api/cron/reconcile-ledger/route";

const SECRET = "test-cron-secret";
let savedSecret: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  savedSecret = process.env.CRON_SECRET;
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedSecret;
});

function get(url: string, bearer?: string) {
  return new Request(url, {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
  });
}

describe("cron auth (fail-closed)", () => {
  it("sweep: 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await sweepGET(get("http://localhost/api/cron/sweep-generating"));
    expect(res.status).toBe(503);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("sweep: 401 on wrong secret", async () => {
    process.env.CRON_SECRET = SECRET;
    const res = await sweepGET(get("http://localhost/api/cron/sweep-generating", "nope"));
    expect(res.status).toBe(401);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("reconcile: 401 on wrong secret", async () => {
    process.env.CRON_SECRET = SECRET;
    const res = await reconcileGET(get("http://localhost/api/cron/reconcile-ledger", "nope"));
    expect(res.status).toBe(401);
  });
});

describe("sweep-generating", () => {
  it("calls the atomic RPC once and returns its counts", async () => {
    process.env.CRON_SECRET = SECRET;
    const rpc = vi.fn(async () => ({
      data: { readings_swept: 2, followups_swept: 1, points_refunded: 20 },
      error: null,
    }));
    vi.mocked(createServiceClient).mockReturnValue({ rpc } as never);

    const res = await sweepGET(get("http://localhost/api/cron/sweep-generating", SECRET));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("sweep_expired_generating", { p_limit: 50 });
    expect(await res.json()).toEqual({
      readings_swept: 2,
      followups_swept: 1,
      points_refunded: 20,
    });
  });

  it("500 when the RPC fails", async () => {
    process.env.CRON_SECRET = SECRET;
    const rpc = vi.fn(async () => ({ data: null, error: { message: "boom" } }));
    vi.mocked(createServiceClient).mockReturnValue({ rpc } as never);

    const res = await sweepGET(get("http://localhost/api/cron/sweep-generating", SECRET));
    expect(res.status).toBe(500);
  });
});

describe("reconcile-ledger (report-only)", () => {
  it("200 with drift reported, no auto-fix path", async () => {
    process.env.CRON_SECRET = SECRET;
    const rpc = vi.fn(async () => ({
      data: { checked_users: 100, mismatch_count: 2, sample: [] },
      error: null,
    }));
    vi.mocked(createServiceClient).mockReturnValue({ rpc } as never);

    const res = await reconcileGET(get("http://localhost/api/cron/reconcile-ledger", SECRET));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("reconcile_ledger_mismatches", { p_limit: 20 });
    expect(await res.json()).toMatchObject({ checked_users: 100, mismatch_count: 2 });
  });
});

describe("sentry-tunnel", () => {
  it("dsnToEnvelopeUrl parses EU + US DSNs, rejects garbage", async () => {
    const { dsnToEnvelopeUrl } = await import("@/lib/sentry");
    expect(dsnToEnvelopeUrl("https://abc@o123.ingest.de.sentry.io/456")).toBe(
      "https://o123.ingest.de.sentry.io/api/456/envelope/"
    );
    expect(dsnToEnvelopeUrl("https://abc@o123.ingest.sentry.io/456")).toBe(
      "https://o123.ingest.sentry.io/api/456/envelope/"
    );
    expect(dsnToEnvelopeUrl(undefined)).toBeNull();
    expect(dsnToEnvelopeUrl("not-a-dsn")).toBeNull();
  });

  it("503 when SENTRY_DSN is not configured", async () => {
    const saved = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    try {
      const { POST } = await import("@/app/api/sentry-tunnel/route");
      const res = await POST(new Request("http://localhost/api/sentry-tunnel", { method: "POST" }));
      expect(res.status).toBe(503);
    } finally {
      if (saved !== undefined) process.env.SENTRY_DSN = saved;
    }
  });
});
