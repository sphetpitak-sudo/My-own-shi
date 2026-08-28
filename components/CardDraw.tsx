"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import TarotCard from "./TarotCard";
import ShuffleAnimation from "./ShuffleAnimation";
import { drawCards, type Spread, type DrawnCard } from "@/lib/cards";
import { cn } from "@/lib/cn";
import { Sparkles, ChevronRight } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  spread: Spread;
  onComplete: (cards: DrawnCard[]) => void;
  reducedMotion?: boolean;
}

type Phase = "shuffle" | "select";

export default function CardDraw({ spread, onComplete, reducedMotion: reducedMotionProp }: Props) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const drawnCards = useMemo(() => drawCards(spread), [spread]);
  const [phase, setPhase] = useState<Phase>("shuffle");
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const submitRef = useRef<HTMLButtonElement | null>(null);

  const allFlipped = flippedIndices.size === spread.cardCount;

  useEffect(() => {
    if (allFlipped && submitRef.current) {
      const t = setTimeout(() => submitRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [allFlipped]);

  const handleShuffleComplete = useCallback(() => {
    setPhase("select");
  }, []);

  const handleFlip = useCallback(
    (index: number) => {
      if (flippedIndices.has(index)) return;
      setFlippedIndices((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    },
    [flippedIndices]
  );

  if (phase === "shuffle") {
    return <ShuffleAnimation onComplete={handleShuffleComplete} reducedMotion={reducedMotion} />;
  }

  const progressPct = (flippedIndices.size / spread.cardCount) * 100;

  return (
    <div className="flex flex-col items-center gap-6 px-4 pb-6">
      {/* Instruction header */}
      <div className="text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--primary)" }}
        >
          ขั้นตอนที่ 3 / 4
        </p>
        <h3 className="text-[19px] font-bold mt-1" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>
          เลือกไพ่ของคุณ
        </h3>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--text-muted)" }}>
          แตะไพ่เพื่อเปิด ทีละใบ
        </p>
      </div>

      {/* Progress */}
      <div className="draw-progress w-full max-w-[300px]">
        <div className="flex-1 max-w-[200px]">
          <div className="draw-progress-bar">
            <div style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="draw-progress-text">
          {flippedIndices.size}/{spread.cardCount}
        </div>
      </div>

      {/* Cards grid */}
      <div
        className={cn(
          "card-spread-area",
          spread.cardCount > 6 && "card-spread-area--celtic"
        )}
        style={
          spread.cardCount === 10
            ? { maxWidth: 700 }
            : spread.cardCount === 3
              ? { maxWidth: 480 }
              : undefined
        }
      >
        {drawnCards.map((dc, i) => {
          const isFlipped = flippedIndices.has(i);
          return (
            <div
              key={i}
              className="card-slot"
              style={{
                animationDelay: `${i * 0.06}s`,
                animation: "fadeUp 0.5s var(--ease) both",
              }}
            >
              <TarotCard
                card={dc.card}
                reversed={dc.reversed}
                flipped={isFlipped}
                size={spread.cardCount === 10 ? "sm" : spread.cardCount === 1 ? "lg" : "md"}
                onClick={isFlipped ? undefined : () => handleFlip(i)}
                ariaLabel={
                  isFlipped
                    ? `${dc.card.nameTh}${dc.reversed ? " กลับหัว" : ""}`
                    : `ไพ่ใบที่ ${i + 1} - ${dc.position.labelTh}`
                }
              />
              <span
                className={cn(
                  "card-slot-label",
                  isFlipped && "revealed"
                )}
              >
                {dc.position.labelTh}
              </span>
              <span
                className={cn("card-slot-progress", isFlipped && "done")}
                aria-hidden
              />
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="flex flex-col items-center gap-3">
        {!allFlipped ? (
          <p
            className="text-[12px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {flippedIndices.size === 0
              ? "แตะไพ่ใบแรกเพื่อเริ่ม"
              : `เหลืออีก ${spread.cardCount - flippedIndices.size} ใบ`}
          </p>
        ) : (
          <button
            ref={submitRef}
            onClick={() => onComplete(drawnCards)}
            className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-bold rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8942a)",
              color: "#1a0a2e",
              boxShadow:
                "0 6px 20px rgba(212, 175, 55, 0.32), inset 0 1px 0 rgba(255,255,255,0.25)",
              letterSpacing: "0.01em",
            }}
          >
            <Sparkles size={15} />
            ดูคำทำนาย
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
