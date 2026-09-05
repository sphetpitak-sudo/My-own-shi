// ============================================
// SEALO-2 regression: PostgREST builders are thenable but have NO .catch.
// A fake builder mimicking postgrest-js exactly (then, no catch) must work
// with the persist helper — the old `builder.catch(()=>{})` pattern throws
// TypeError and silently drops the write.
// ============================================

import { describe, it, expect, vi } from "vitest";
import { persistReadingInterpretation } from "@/lib/supabase/persist";

// Minimal postgrest-js stand-in: thenable WITHOUT .catch.
function fakeBuilder(outcome: { error: unknown }, sent: { values?: unknown } = {}) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: (v: any) => void) => {
      sent.values = true;
      return Promise.resolve(outcome).then(resolve);
    },
  };
}

function fakeClient(outcome: { error: unknown }, sent: { values?: unknown } = {}) {
  return {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => fakeBuilder(outcome, sent)),
      })),
    })),
  };
}

describe("persistReadingInterpretation (SEALO-2)", () => {
  it("persists via await + try/catch without touching .catch", async () => {
    const sent: { values?: unknown } = {};
    const ok = await persistReadingInterpretation(
      fakeClient({ error: null }, sent) as never,
      "read-1",
      "คำทำนาย"
    );
    expect(ok).toBe(true);
    expect(sent.values).toBe(true); // the write was actually sent
  });

  it("returns false (never throws) when the write fails", async () => {
    const ok = await persistReadingInterpretation(
      fakeClient({ error: { message: "db down" } }) as never,
      "read-1",
      "คำทำนาย"
    );
    expect(ok).toBe(false);
  });

  it("documents the bug class: .catch does not exist on builders", () => {
    const builder = fakeBuilder({ error: null });
    expect(typeof (builder as Record<string, unknown>).catch).toBe("undefined");
  });
});
