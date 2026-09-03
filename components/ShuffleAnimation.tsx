"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  onComplete: () => void;
  duration?: number;
  cardCount?: number;
  reducedMotion?: boolean;
}

const DEFAULT_CARD_COUNT = 14;

type Phase = "enter" | "split" | "riffle" | "fan" | "settle" | "done";

export default function ShuffleAnimation({
  onComplete,
  cardCount = DEFAULT_CARD_COUNT,
  reducedMotion: reducedMotionProp,
}: Props) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const [phase, setPhase] = useState<Phase>("enter");

  const cards = useMemo(() => {
    const seed = 1234;
    const rand = (i: number, salt: number) => {
      const x = Math.sin((i + salt) * seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: cardCount }, (_, i) => ({
      id: i,
      rotate: rand(i, 1) * 5 - 2.5,
      xOffset: rand(i, 2) * 6 - 3,
      yOffset: rand(i, 3) * 4 - 2,
      delay: (i % 4) * 0.03,
      depth: i,
      // per-card shuffle variance
      splitX: (rand(i, 7) - 0.5) * 12,
      splitRot: (rand(i, 8) - 0.5) * 6,
      riffleY: (rand(i, 9) - 0.5) * 18,
    }));
  }, [cardCount]);

  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("done");
      const t = window.setTimeout(() => handleComplete(), 280);
      timersRef.current = [t];
      return () => {
        timersRef.current.forEach((id: number) => clearTimeout(id));
      };
    }

    // Guard StrictMode double-invoke
    if (completedRef.current) return;

    // Explicit timeline: enter 480 calm → split 700 curiosity → riffle 800 tactile → fan 700 peak → settle 420 calm
    const schedule = [
      { phase: "split" as Phase, delay: 480 },
      { phase: "riffle" as Phase, delay: 1180 },
      { phase: "fan" as Phase, delay: 1980 },
      { phase: "settle" as Phase, delay: 2680 },
    ];
    schedule.forEach(({ phase: p, delay }) => {
      const id = window.setTimeout(() => setPhase(p), delay);
      timersRef.current.push(id);
    });
    const doneId = window.setTimeout(() => {
      setPhase("done");
      handleComplete();
    }, 3120);
    timersRef.current.push(doneId);

    const onVisibility = () => {
      if (document.hidden) {
        // Pause visual work — keep timers but avoid accumulating frames
        // No-op: CSS animations will pause via will-change optimization
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      timersRef.current.forEach((id: number) => clearTimeout(id));
      timersRef.current = [];
    };
  }, [handleComplete, reducedMotion]);

  if (phase === "done") return null;

  if (reducedMotion) {
    return (
      <div className="shuffle-stage">
        <div className="mystical-loader">
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
        </div>
        <div className="shuffle-status">
          <div className="shuffle-status-title">กำลังเตรียมไพ่...</div>
        </div>
      </div>
    );
  }

  const statusText = (() => {
    switch (phase) {
      case "enter":
        return { title: "กำลังเตรียมสำรับไพ่", sub: "วางไพ่ลงบนโต๊ะ" };
      case "split":
        return { title: "กำลังสับไพ่", sub: "ขอให้จิตใจสงบ" };
      case "riffle":
        return { title: "กำลังสับไพ่", sub: "ไพ่กำลังสอดประสาน" };
      case "fan":
        return { title: "กำลังคลี่ไพ่", sub: "พลังงานกำลังก่อตัว" };
      case "settle":
        return { title: "พร้อมเปิดไพ่", sub: "แตะไพ่เพื่อเปิด" };
      default:
        return { title: "พร้อมเปิดไพ่", sub: "" };
    }
  })();

  const isSplit = phase === "split";
  const isRiffle = phase === "riffle";
  const isFan = phase === "fan";
  const isSettle = phase === "settle";
  const isEnter = phase === "enter";

  return (
    <div className="shuffle-stage">
      <div className="shuffle-stage-glow" />
      {/* Ambient radial light */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 420,
          height: 420,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(167,139,250,0.10) 0%, transparent 68%)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="shuffle-deck-wrap"
        style={{
          transform:
            isSplit || isRiffle
              ? "translateY(-8px) scale(1.02)"
              : isFan
                ? "translateY(-4px) scale(1.01)"
                : "translateY(0) scale(1)",
          transition: "transform 0.7s var(--ease)",
        }}
      >
        {cards.map((c, i) => {
          const isLeft = i % 2 === 0;
          const isEvenGroup = i < Math.floor(cardCount * 0.55);

          let tx = 0;
          let ty = 0;
          let rot = c.rotate;
          let scale = 1;
          let opacity = 1;
          let z = c.depth;

          if (isEnter) {
            tx = c.xOffset * 0.6;
            ty = c.yOffset * 0.6 - i * 0.35;
            rot = c.rotate * 0.5;
            scale = 1;
            opacity = i < cardCount - 4 ? 0.95 : 1;
            z = c.depth;
          } else if (isSplit) {
            // Split into left/right packets with slight fan
            const side = isLeft ? -1 : 1;
            tx = side * (68 + (i % 3) * 6) + c.splitX;
            ty = -6 + (i % 2) * 4 + c.riffleY * 0.15;
            rot = side * 7 + c.splitRot;
            scale = 0.98;
            opacity = 0.95;
            z = isLeft ? i : cardCount - i;
          } else if (isRiffle) {
            // Interleave — packets slide past each other
            const interleave = isLeft ? -1 : 1;
            const stagger = (i % 4) * 2.5;
            tx = interleave * 14 + (isEvenGroup ? -8 : 8) + Math.sin((i * 1.2)) * 6;
            ty = c.riffleY * 0.7 + (isLeft ? -4 : 4) + stagger * 0.6;
            rot = interleave * -5 + c.splitRot * 0.6 + Math.sin(i) * 4;
            scale = 0.985 + (i % 3) * 0.008;
            opacity = 1;
            // alternate z to create interleaving
            z = i % 2 === 0 ? cardCount - i : i;
          } else if (isFan) {
            // Elegant fan spread
            const spread = (i - cardCount / 2 + 0.5) * 11;
            const arc = Math.abs(spread) * 0.18;
            tx = spread + c.splitX * 0.3;
            ty = arc - 18 + c.riffleY * 0.12;
            rot = spread * 0.62 + c.rotate * 0.4;
            scale = 0.96 + (1 - Math.abs(spread) / 80) * 0.04;
            opacity = 0.96;
            z = i;
          } else if (isSettle) {
            tx = c.xOffset * 0.3;
            ty = -i * 0.28;
            rot = c.rotate * 0.3;
            scale = 1;
            opacity = 1;
            z = c.depth;
          }

          // Shadow depth based on elevation
          const elevation = isSplit || isRiffle ? 12 : isFan ? 10 : isSettle ? 4 : 2;
          const shadowOpacity = isSplit || isRiffle ? 0.22 : isFan ? 0.18 : 0.12;

          return (
            <div
              key={c.id}
              className="shuffle-deck-card"
              style={{
                zIndex: z,
                transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg) scale(${scale})`,
                opacity,
                transition: `transform 0.62s cubic-bezier(0.22, 1, 0.36, 1) ${c.delay}s, opacity 0.4s var(--ease) ${c.delay}s, box-shadow 0.5s var(--ease)`,
                boxShadow: `0 ${elevation}px ${elevation * 1.8}px rgba(0,0,0,${shadowOpacity}), 0 1px 3px rgba(0,0,0,0.18)`,
              }}
            >
              <div className="shuffle-card-back-design" />
            </div>
          );
        })}

        {(isSplit || isRiffle) && <SparkleField dense={isRiffle} />}
        {isFan && <SparkleField dense={false} />}
      </div>

      <div className="shuffle-status" aria-live="polite">
        <div className="shuffle-status-title" key={phase}>
          {statusText.title}
        </div>
        <div className="shuffle-status-sub">{statusText.sub}</div>
        {(isSplit || isRiffle) && (
          <div className="mystical-loader" style={{ marginTop: 12 }}>
            <div className="mystical-loader-dot" />
            <div className="mystical-loader-dot" />
            <div className="mystical-loader-dot" />
          </div>
        )}
      </div>
    </div>
  );
}

function SparkleField({ dense = false }: { dense?: boolean }) {
  const sparkles = useMemo(() => {
    const n = dense ? 24 : 16;
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = dense ? 70 + (i % 4) * 18 : 85 + (i % 4) * 22;
      return {
        id: i,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r * 0.48,
        delay: i * 0.035,
        size: 1.5 + (i % 3) * 0.9,
        color: i % 3 === 0 ? "#d4af37" : i % 3 === 1 ? "#a78bfa" : "#f472b6",
      };
    });
  }, [dense]);

  return (
    <>
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="shuffle-sparkle"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: s.color,
            boxShadow: `0 0 ${s.size * 2.2}px ${s.color}`,
            transform: `translate(${s.x}px, ${s.y}px)`,
            opacity: 0,
            animation: `sparkleFloat 1.15s ${s.delay}s ease-out both`,
            zIndex: 100,
          }}
        />
      ))}
    </>
  );
}
