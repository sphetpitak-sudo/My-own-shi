"use client";

import { useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  onComplete: () => void;
  cardCount?: number;
  reducedMotion?: boolean;
}

interface ShuffleCardSpec {
  /** Resting offset/rotation (also the exact final frame). */
  restX: number;
  restY: number;
  restRot: number;
  /** Split groups: left ≈ −16px / right ≈ +16px, rotation ±3°. */
  splitX: number;
  splitRot: number;
  /** Interleave: short cross-center drift, opposite side, ∓1.5°. */
  crossX: number;
  crossRot: number;
  /** Stagger so cards cross one at a time (ms). */
  delay: number;
}

// Fixed deterministic config — identical on every render (no Math.random:
// avoids hydration mismatch, visual jitter, and SSR/client divergence).
const SHUFFLE_CARDS: ShuffleCardSpec[] = [
  { restX: -3, restY: 0,  restRot: -1.2, splitX: -16, splitRot: -3.0, crossX: 7,  crossRot: 1.4,  delay: 0 },
  { restX: 2,  restY: -1, restRot: 0.8,  splitX: 17,  splitRot: 3.2,  crossX: -8, crossRot: -1.6, delay: 45 },
  { restX: -2, restY: -2, restRot: -0.6, splitX: -15, splitRot: -2.6, crossX: 6,  crossRot: 1.2,  delay: 90 },
  { restX: 3,  restY: -3, restRot: 1.1,  splitX: 16,  splitRot: 2.8,  crossX: -7, crossRot: -1.4, delay: 135 },
  { restX: -1, restY: -4, restRot: -0.5, splitX: -18, splitRot: -3.4, crossX: 8,  crossRot: 1.6,  delay: 180 },
  { restX: 1,  restY: -5, restRot: 0.6,  splitX: 15,  splitRot: 2.4,  crossX: -6, crossRot: -1.2, delay: 225 },
];

const DURATION_MS = 1600;
const MAX_DELAY_MS = 225;
// Longest card finishes at 1825ms; fire completion just after.
const COMPLETE_AT_MS = DURATION_MS + MAX_DELAY_MS + 35;
const REDUCED_MS = 260;

export default function ShuffleAnimation({ onComplete, cardCount = SHUFFLE_CARDS.length, reducedMotion: prop }: Props) {
  const prefersReduced = useReducedMotion();
  const reduced = prop ?? prefersReduced;
  const doneRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const shown = SHUFFLE_CARDS.slice(0, Math.max(1, Math.min(cardCount, SHUFFLE_CARDS.length)));

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (doneRef.current) return;
    const t = window.setTimeout(finish, reduced ? REDUCED_MS : COMPLETE_AT_MS);
    timerRef.current = t;
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [finish, reduced]);

  if (reduced) {
    return (
      <div className="shuffle-stage">
        <div className="mystical-loader"><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /><div className="mystical-loader-dot" /></div>
        <div className="shuffle-status"><div className="shuffle-status-title">กำลังเตรียมไพ่...</div></div>
      </div>
    );
  }

  return (
    <div className="shuffle-stage" style={{ overflow: "visible" }}>
      {/* Static soft table glow (no animation, no blur filter — paint once). */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "78%",
          maxWidth: 520,
          aspectRatio: "1.2",
          top: "54%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at 50% 38%, rgba(167,139,250,0.06) 0%, transparent 62%), radial-gradient(ellipse at 50% 88%, rgba(0,0,0,0.12) 0%, transparent 42%)",
          border: "1px solid rgba(167,139,250,0.07)",
        }}
      />

      <div className="shuffle-deck-wrap is-shuffling" aria-hidden="true">
        {shown.map((c, i) => (
          <div
            key={i}
            className="shuffle-deck-card sealo-shuffle-card"
            style={{
              zIndex: shown.length - i,
              ["--rx" as string]: `${c.restX}px`,
              ["--ry" as string]: `${c.restY}px`,
              ["--rr" as string]: `${c.restRot}deg`,
              ["--sx" as string]: `${c.splitX}px`,
              ["--sr" as string]: `${c.splitRot}deg`,
              ["--cx" as string]: `${c.crossX}px`,
              ["--cr" as string]: `${c.crossRot}deg`,
              ["--delay" as string]: `${c.delay}ms`,
            } as CSSProperties}
          >
            <div className="shuffle-card-back-design">
              <div className="shuffle-card-vignette" />
              <div className="shuffle-card-center">
                <div className="shuffle-card-ring" />
                <div className="shuffle-card-ring inner" />
                <div className="shuffle-card-star" />
                <div className="shuffle-card-dot" />
                <div className="shuffle-card-cross-h" />
                <div className="shuffle-card-cross-v" />
              </div>
              <div className="shuffle-card-corners"><span /><span /><span /><span /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="shuffle-status" aria-live="polite">
        <div className="shuffle-status-title">กำลังเตรียมไพ่...</div>
        <div className="shuffle-status-sub">สำรับกำลังเตรียมคำทำนายของคุณ</div>
      </div>
    </div>
  );
}
