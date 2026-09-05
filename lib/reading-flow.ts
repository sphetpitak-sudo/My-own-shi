// ============================================
// Canonical reading-flow model (Phase C6 — single source of truth).
// The user-visible flow has exactly these 5 stages, in order:
//   spread -> topic -> question -> draw -> result
// Every progress UI (page eyebrows, step indicator, CardDraw header)
// derives its "X / N" from here — no duplicated magic numbers.
// ============================================

export const READING_STEPS = [
  "spread",
  "topic",
  "question",
  "draw",
  "result",
] as const;

export type ReadingStepKey = (typeof READING_STEPS)[number];

export const READING_STEP_COUNT = READING_STEPS.length;

const STEP_LABELS_TH: Record<ReadingStepKey, string> = {
  spread: "เลือกรูปแบบ",
  topic: "เลือกหัวข้อ",
  question: "ตั้งคำถาม",
  draw: "จั่วไพ่",
  result: "คำทำนาย",
};

export function isReadingStepKey(v: unknown): v is ReadingStepKey {
  return (
    typeof v === "string" && (READING_STEPS as readonly string[]).includes(v)
  );
}

/** 1-based position of a stage, e.g. draw -> { position: 4, total: 5 }. */
export function readingStepPosition(step: ReadingStepKey): {
  position: number;
  total: number;
} {
  return { position: READING_STEPS.indexOf(step) + 1, total: READING_STEP_COUNT };
}

/** "ขั้นตอนที่ 4 / 5" — the one canonical eyebrow format. */
export function readingStepEyebrow(step: ReadingStepKey): string {
  const { position, total } = readingStepPosition(step);
  return `ขั้นตอนที่ ${position} / ${total}`;
}

export function readingStepLabelTh(step: ReadingStepKey): string {
  return STEP_LABELS_TH[step];
}

export interface ConfirmSummary {
  spreadNameTh: string;
  cardCount: number;
  cost: number;
  current: number;
  shortage: number;
  insufficient: boolean;
  resulting: number;
}

/**
 * Pure summary for the pre-spend confirmation dialog.
 * Points economics live server-side; this only formats what the user sees.
 */
export function getConfirmSummary(args: {
  spreadNameTh: string;
  cardCount: number;
  cost: number;
  current: number;
}): ConfirmSummary {
  const current = Math.max(0, Math.floor(args.current));
  const cost = Math.max(0, Math.floor(args.cost));
  const insufficient = current < cost;
  return {
    spreadNameTh: args.spreadNameTh,
    cardCount: args.cardCount,
    cost,
    current,
    shortage: insufficient ? cost - current : 0,
    insufficient,
    resulting: insufficient ? current : current - cost,
  };
}
