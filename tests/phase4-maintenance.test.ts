// ============================================
// Phase 4 — Maintenance flags tests
// - isMigrationLocked: true/false, fail-closed on error or missing value
// - Free-write routes (chat/saju/followup) return 503 under lock,
//   BEFORE any spend or insert happens
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
import { isMigrationLocked } from "@/lib/ratelimit";
import { POST as chatPOST } from "@/app/api/chat/route";
import { POST as sajuPOST } from "@/app/api/saju/route";
import { POST as followupPOST } from "@/app/api/reading/followup/route";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const LOCK_MSG = "ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่";

function flagStore(value: { enabled: boolean } | null, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: value ? { value } : null, error })),
        })),
      })),
    })),
  };
}

function authedClient(flagEnabled: boolean) {
  const from = vi.fn((table: string) => {
    if (table === "admin_settings") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { value: { enabled: flagEnabled } },
              error: null,
            })),
          })),
        })),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return {
    from,
    rpc: vi.fn(async () => {
      throw new Error("unexpected rpc");
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isMigrationLocked (fail-closed)", () => {
  it("true when enabled", async () => {
    await expect(isMigrationLocked(flagStore({ enabled: true }))).resolves.toBe(true);
  });

  it("false when disabled", async () => {
    await expect(isMigrationLocked(flagStore({ enabled: false }))).resolves.toBe(false);
  });

  it("true on read error", async () => {
    await expect(isMigrationLocked(flagStore(null, new Error("db down")))).resolves.toBe(true);
  });

  it("true on missing value", async () => {
    await expect(isMigrationLocked(flagStore(null, null))).resolves.toBe(true);
  });
});

describe("free-write routes under migration lock", () => {
  it("chat: 503 before any work", async () => {
    const sb = authedClient(true);
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await chatPOST(post("http://localhost/api/chat", { message: "hi" }));
    expect(res.status).toBe(503);
    expect((await res.json()) as { error: string }).toMatchObject({ error: LOCK_MSG });
    expect(sb.from).toHaveBeenCalledTimes(1); // only the flag read, nothing else
  });

  it("saju: 503 before any work", async () => {
    const sb = authedClient(true);
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await sajuPOST(
      post("http://localhost/api/saju", { date: "2000-01-01", time: "12:00", place: "Bangkok" })
    );
    expect(res.status).toBe(503);
    expect((await res.json()) as { error: string }).toMatchObject({ error: LOCK_MSG });
  });

  it("followup: 503 before reading lookup or reservation", async () => {
    const sb = authedClient(true);
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await followupPOST(
      post("http://localhost/api/reading/followup", {
        readingId: "00000000-0000-0000-0000-000000000002",
        followQuestion: "แล้วต่อล่ะ?",
      })
    );
    expect(res.status).toBe(503);
    expect((await res.json()) as { error: string }).toMatchObject({ error: LOCK_MSG });
    expect(sb.from).toHaveBeenCalledTimes(1);
  });

  it("chat unlocked: passes the guard (fails later, never with lock message)", async () => {
    const sb = authedClient(false);
    vi.mocked(createClient).mockResolvedValue(sb as never);

    const res = await chatPOST(post("http://localhost/api/chat", { message: "hi" }));
    const body = (await res.json()) as { error: string };
    // Guard passed: any downstream failure must NOT be the migration message.
    expect(body.error).not.toBe(LOCK_MSG);
  });
});
