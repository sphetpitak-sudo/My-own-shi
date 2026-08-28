"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  onComplete: () => void;
  duration?: number;
}

const CARD_COUNT = 6;

const SPARKLE_POSITIONS = [
  { left: 35, top: 45, w: 2.5, h: 2.8 },
  { left: 42, top: 52, w: 3.2, h: 2.1 },
  { left: 55, top: 48, w: 2.8, h: 3.5 },
  { left: 38, top: 55, w: 3.0, h: 2.4 },
  { left: 50, top: 42, w: 2.2, h: 3.1 },
  { left: 45, top: 58, w: 3.5, h: 2.6 },
  { left: 58, top: 50, w: 2.6, h: 2.9 },
  { left: 40, top: 44, w: 3.3, h: 2.3 },
];

export default function ShuffleAnimation({ onComplete, duration = 2000 }: Props) {
  const [phase, setPhase] = useState<"enter" | "shuffling" | "exit" | "done">("enter");

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setPhase("shuffling");
    }, 300);

    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 300 + duration);

    const doneTimer = setTimeout(() => {
      setPhase("done");
      handleComplete();
    }, 300 + duration + 400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, handleComplete]);

  if (phase === "done") return null;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Status text */}
      <div className="text-center">
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          {phase === "enter" && "กำลังเตรียมสำรับไพ่..."}
          {phase === "shuffling" && "กำลังสับไพ่..."}
          {phase === "exit" && "เลือกไพ่ของคุณ"}
        </p>
        <div className="mystical-loader mt-3">
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
          <div className="mystical-loader-dot" />
        </div>
      </div>

      {/* Shuffle deck */}
      <div
        className={`shuffle-container ${
          phase === "shuffling" ? "shuffle-active" : ""
        } ${phase === "exit" ? "shuffle-exit" : "shuffle-enter"}`}
      >
        {Array.from({ length: CARD_COUNT }).map((_, i) => {
          const offset = i * 2;
          return (
            <div
              key={i}
              className="shuffle-card"
              style={{
                transform: `translateY(${-offset}px)`,
                zIndex: CARD_COUNT - i,
              }}
            >
              <div className="shuffle-card-inner" />
            </div>
          );
        })}
      </div>

      {/* Subtle sparkle particles during shuffle */}
      {phase === "shuffling" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {SPARKLE_POSITIONS.map((pos, i) => (
            <div
              key={i}
              className="sparkle-particle"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animation: `sparkleFloat 1.2s ${i * 0.15}s ease-out both`,
                width: pos.w,
                height: pos.h,
                background: i % 2 === 0 ? "var(--gold)" : "var(--primary)",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
