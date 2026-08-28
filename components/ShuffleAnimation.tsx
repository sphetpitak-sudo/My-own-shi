"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  onComplete: () => void;
  duration?: number;
  cardCount?: number;
  reducedMotion?: boolean;
}

const DEFAULT_CARD_COUNT = 8;

export default function ShuffleAnimation({
  onComplete,
  duration = 2200,
  cardCount = DEFAULT_CARD_COUNT,
  reducedMotion: reducedMotionProp,
}: Props) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const [phase, setPhase] = useState<"enter" | "shuffle" | "settle" | "done">("enter");

  // Deterministic pre-computed seed for nice positions/rotations
  const cards = useMemo(() => {
    const seed = 1234;
    const rand = (i: number, salt: number) => {
      const x = Math.sin((i + salt) * seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: cardCount }, (_, i) => ({
      id: i,
      rotate: rand(i, 1) * 4 - 2,
      xOffset: rand(i, 2) * 8 - 4,
      yOffset: rand(i, 3) * 6 - 3,
      delay: i * 0.04,
      depth: i,
    }));
  }, [cardCount]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("done");
      const t = setTimeout(() => handleComplete(), 350);
      return () => clearTimeout(t);
    }

    const enterEnd = 320;
    const shuffleEnd = enterEnd + duration - 200;
    const settleEnd = shuffleEnd + 360;

    const t1 = setTimeout(() => setPhase("shuffle"), enterEnd);
    const t2 = setTimeout(() => setPhase("settle"), shuffleEnd);
    const t3 = setTimeout(() => {
      setPhase("done");
      handleComplete();
    }, settleEnd);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration, handleComplete, reducedMotion]);

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
        return { title: "กำลังเตรียมสำรับไพ่", sub: "..." };
      case "shuffle":
        return { title: "กำลังสับไพ่", sub: "ขอให้จิตใจสงบ" };
      case "settle":
        return { title: "พร้อมเปิดไพ่", sub: "แตะไพ่เพื่อเปิด" };
    }
  })();

  return (
    <div className="shuffle-stage">
      <div className="shuffle-stage-glow" />

      <div
        className="shuffle-deck-wrap"
        style={{
          transform:
            phase === "shuffle"
              ? "translateY(-6px)"
              : phase === "settle"
                ? "translateY(0)"
                : "translateY(0)",
          transition: "transform 0.6s var(--ease)",
        }}
      >
        {cards.map((c, i) => {
          const isTop = i === cards.length - 1;
          const arc = phase === "shuffle";
          const settle = phase === "settle";

          let tx = 0;
          let ty = 0;
          let rot = 0;
          let scale = 1;
          let opacity = 1;

          if (arc) {
            // Spread each card outward in different directions
            const angle = (i / cards.length) * Math.PI * 2 + Math.PI;
            const radius = 80 + (i % 3) * 12;
            tx = Math.cos(angle) * radius;
            ty = Math.sin(angle) * 0.6 * radius - 30;
            rot = Math.sin(angle) * 18;
            scale = 0.96 + (i % 2) * 0.04;
            opacity = isTop ? 1 : 0.85;
          } else if (settle) {
            // cards snap back to deck
            tx = 0;
            ty = 0;
            rot = c.rotate;
            scale = 1;
            opacity = 1;
          } else {
            // enter - slightly fanned
            tx = c.xOffset;
            ty = c.yOffset;
            rot = c.rotate;
            scale = 1;
            opacity = 1;
          }

          return (
            <div
              key={c.id}
              className="shuffle-deck-card"
              style={{
                zIndex: c.depth,
                transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg) scale(${scale})`,
                opacity,
                transition: `transform ${
                  arc ? 0.55 : 0.45
                }s var(--ease) ${c.delay}s, opacity 0.3s var(--ease) ${c.delay}s`,
              }}
            >
              <div className="shuffle-card-back-design" />
            </div>
          );
        })}

        {phase === "shuffle" && (
          <SparkleField />
        )}
      </div>

      <div className="shuffle-status" aria-live="polite">
        <div className="shuffle-status-title" key={phase}>
          {statusText?.title}
        </div>
        <div className="shuffle-status-sub">{statusText?.sub}</div>
        {phase === "shuffle" && (
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

function SparkleField() {
  const sparkles = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const r = 90 + (i % 3) * 30;
      return {
        id: i,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r * 0.5,
        delay: i * 0.05,
        size: 2 + (i % 3),
        color: i % 2 === 0 ? "#d4af37" : "#a78bfa",
      };
    });
  }, []);

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
            background: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            transform: `translate(${s.x}px, ${s.y}px)`,
            opacity: 0,
            animation: `sparkleFloat 1.1s ${s.delay}s ease-out both`,
            zIndex: 100,
          }}
        />
      ))}
    </>
  );
}
