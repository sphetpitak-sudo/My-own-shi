"use client";

import { useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  onComplete: () => void;
  cardCount?: number;
  reducedMotion?: boolean;
}

interface CinematicCardSpec {
  /** Full per-phase transform tracks (precomputed strings, px wrapped in
      calc(* var(--travel)) so mobile scales travel without touching angles). */
  rest: string;
  split: string;
  cross: string;
  hero: string;
  /** Stagger so cards cross one at a time (ms). */
  delay: number;
}

const px = (v: number) => `calc(${v}px * var(--travel, 1))`;

// lift (-3px) and settle (-2px) are shared constants, not per-card choreography.
const LIFT = `translate3d(0px, ${px(-3)}, 0) rotateX(0deg) rotateY(0deg) rotate(0deg) scale(1)`;
const SETTLE = `translate3d(0px, ${px(-2)}, 0) rotateX(0deg) rotateY(0deg) rotate(0deg) scale(1)`;

function track(
  x: number,
  y: number,
  rot: number,
  opts?: { rx?: number; ry?: number; s?: number }
): string {
  const rx = opts?.rx ?? 0;
  const ry = opts?.ry ?? 0;
  const s = opts?.s ?? 1;
  return `translate3d(${px(x)}, ${px(y)}, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg) scale(${s})`;
}

// Fixed deterministic choreography — identical on every render (no
// Math.random: avoids hydration mismatch, jitter, SSR/client divergence).
// 8 cards read as ONE deck: shared rhythm, tight grouping, asymmetric detail.
const CINEMATIC_CARDS: Array<{
  rest: { x: number; y: number; r: number };
  split: { x: number; y: number; r: number };
  cross: { x: number; y: number; r: number; rx: number; ry: number };
  hero: { x: number; y: number; r: number; s: number; rx: number; ry: number };
  delay: number;
}> = [
  { rest: { x: -2, y: 0, r: -1 },    split: { x: -24, y: -3, r: -6 },   cross: { x: 10, y: -9, r: -4, rx: 4, ry: -5 },   hero: { x: -46, y: 3, r: -9, s: 0.95, rx: 2, ry: -3 },   delay: 0 },
  { rest: { x: 2, y: -1, r: 0.8 },   split: { x: 26, y: -4, r: 7 },     cross: { x: -11, y: 6, r: 5, rx: -3, ry: 6 },    hero: { x: -33, y: -1, r: -6.5, s: 0.97, rx: 2, ry: -2 }, delay: 25 },
  { rest: { x: -1, y: -2, r: -0.5 }, split: { x: -22, y: 3, r: -5 },    cross: { x: 2, y: -2, r: 0.5, rx: 2, ry: -2 },   hero: { x: -20, y: -5, r: -4, s: 0.99, rx: 2, ry: -1 },   delay: 50 },
  { rest: { x: 2.5, y: -3, r: 1 },   split: { x: 24, y: 4, r: 6 },      cross: { x: -9, y: -7, r: -5, rx: 5, ry: 4 },    hero: { x: -7, y: -8, r: -1.5, s: 1.01, rx: 2, ry: 0 },  delay: 75 },
  { rest: { x: -2.5, y: -4, r: -0.8 }, split: { x: -27, y: -1, r: -7 }, cross: { x: 12, y: 7, r: 4.5, rx: -4, ry: -6 }, hero: { x: 7, y: -8, r: 1.5, s: 1.01, rx: 2, ry: 0 },    delay: 100 },
  { rest: { x: 1, y: -5, r: 0.6 },   split: { x: 23, y: 2, r: 5.5 },    cross: { x: -6, y: 10, r: -3, rx: 3, ry: 3 },    hero: { x: 20, y: -5, r: 4, s: 0.99, rx: 2, ry: 1 },     delay: 125 },
  { rest: { x: -1.5, y: -6, r: -0.4 }, split: { x: -21, y: 5, r: -4.5 }, cross: { x: 9, y: -4, r: 3.5, rx: -5, ry: -4 }, hero: { x: 33, y: -1, r: 6.5, s: 0.97, rx: 2, ry: 2 },  delay: 150 },
  { rest: { x: 2, y: -7, r: 0.9 },   split: { x: 27, y: -2, r: 7.5 },   cross: { x: -12, y: 3, r: -4.5, rx: 4, ry: 5 },  hero: { x: 46, y: 3, r: 9, s: 0.95, rx: 2, ry: 3 },     delay: 175 },
];

function buildSpec(c: (typeof CINEMATIC_CARDS)[number]): CinematicCardSpec {
  return {
    rest: track(c.rest.x, c.rest.y, c.rest.r),
    split: track(c.split.x, c.split.y, c.split.r),
    cross: track(c.cross.x, c.cross.y, c.cross.r, { rx: c.cross.rx, ry: c.cross.ry }),
    hero: track(c.hero.x, c.hero.y, c.hero.r, { rx: c.hero.rx, ry: c.hero.ry, s: c.hero.s }),
    delay: c.delay,
  };
}

const DURATION_MS = 2400;
const MAX_DELAY_MS = 175;
// Longest card finishes at 2575ms; fire completion just after.
const COMPLETE_AT_MS = DURATION_MS + MAX_DELAY_MS + 35;
const REDUCED_MS = 260;

export default function ShuffleAnimation({ onComplete, cardCount = CINEMATIC_CARDS.length, reducedMotion: prop }: Props) {
  const prefersReduced = useReducedMotion();
  const reduced = prop ?? prefersReduced;
  const doneRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const shown = CINEMATIC_CARDS.slice(0, Math.max(1, Math.min(cardCount, CINEMATIC_CARDS.length))).map(buildSpec);

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
              ["--t0" as string]: c.rest,
              ["--t1" as string]: LIFT,
              ["--t2" as string]: c.split,
              ["--t3" as string]: c.cross,
              ["--t4" as string]: c.hero,
              ["--t5" as string]: c.rest,
              ["--t6" as string]: SETTLE,
              ["--t7" as string]: c.rest,
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

// Re-exported for tests / tuning docs (values, not behavior).
export const SHUFFLE_TIMING = { DURATION_MS, MAX_DELAY_MS, COMPLETE_AT_MS, REDUCED_MS } as const;
