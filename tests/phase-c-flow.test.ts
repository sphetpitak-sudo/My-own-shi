// ============================================
// Phase C — reading-flow truth + confirm summary (pure logic, node env)
// - canonical 5 stages, no magic numbers
// - eyebrow format shared by page + CardDraw
// - confirm math: shortage / insufficient / resulting balance
// ============================================

import { describe, it, expect } from "vitest";
import {
  READING_STEPS,
  READING_STEP_COUNT,
  isReadingStepKey,
  readingStepPosition,
  readingStepEyebrow,
  getConfirmSummary,
} from "@/lib/reading-flow";

describe("READING_STEPS (single source of truth)", () => {
  it("has exactly the 5 user-visible stages in order", () => {
    expect([...READING_STEPS]).toEqual(["spread", "topic", "question", "draw", "result"]);
    expect(READING_STEP_COUNT).toBe(5);
  });

  it("draw is stage 4 of 5 (kills the 3/4 vs 4/5 mismatch)", () => {
    expect(readingStepPosition("draw")).toEqual({ position: 4, total: 5 });
    expect(readingStepEyebrow("draw")).toBe("ขั้นตอนที่ 4 / 5");
    expect(readingStepEyebrow("spread")).toBe("ขั้นตอนที่ 1 / 5");
    expect(readingStepEyebrow("result")).toBe("ขั้นตอนที่ 5 / 5");
  });

  it("rejects unknown step keys (draft guard)", () => {
    expect(isReadingStepKey("draw")).toBe(true);
    expect(isReadingStepKey("confirm")).toBe(false);
    expect(isReadingStepKey(undefined)).toBe(false);
  });
});

describe("getConfirmSummary (pre-spend dialog math)", () => {
  it("computes shortage + resulting balance when affordable", () => {
    expect(
      getConfirmSummary({ spreadNameTh: "ไพ่สามใบ", cardCount: 3, cost: 15, current: 100 })
    ).toMatchObject({ cost: 15, current: 100, shortage: 0, insufficient: false, resulting: 85 });
  });

  it("flags insufficient without going negative", () => {
    expect(
      getConfirmSummary({ spreadNameTh: "ไพ่สามใบ", cardCount: 3, cost: 15, current: 10 })
    ).toMatchObject({ shortage: 5, insufficient: true, resulting: 10 });
  });

  it("clamps fractional/negative inputs (never claims a false balance)", () => {
    const s = getConfirmSummary({ spreadNameTh: "x", cardCount: 1, cost: 5.7, current: -3 });
    expect(s.cost).toBe(5);
    expect(s.current).toBe(0);
    expect(s.insufficient).toBe(true);
  });
});
