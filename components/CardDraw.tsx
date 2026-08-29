"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import TarotCard from "./TarotCard";
import ShuffleAnimation from "./ShuffleAnimation";
import { drawCards, type Spread, type DrawnCard } from "@/lib/cards";
import { cn } from "@/lib/cn";
import { Sparkles, ArrowRight } from "lucide-react";
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
      const t = setTimeout(() => submitRef.current?.focus(), 250);
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
    return (
      <div className="relative">
        <ShuffleAnimation onComplete={handleShuffleComplete} reducedMotion={reducedMotion} />
        <button onClick={handleShuffleComplete} className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] font-semibold underline" style={{ color: "var(--text-muted)" }}>
          ข้ามพิธีกรรม →
        </button>
      </div>
    );
  }

  const progressPct = (flippedIndices.size / spread.cardCount) * 100;

  return (
    <div className="flex flex-col items-center gap-6 px-4 pb-8 max-w-4xl mx-auto animate-fade">
      {/* Instruction Header */}
      <div className="text-center space-y-1.5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">
          ขั้นตอนที่ 3 / 4
        </p>
        <h3 className="text-[22px] font-extrabold text-[var(--text)] tracking-tight">
          เลือกและเปิดไพ่ของคุณ
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)]">
          แตะที่ไพ่เพื่อเปิดเผยความหมายทีละใบ
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[280px] flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--gold)] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-[12px] font-bold tabular-nums text-[var(--text-muted)] min-w-[38px] text-right">
          {flippedIndices.size}/{spread.cardCount}
        </div>
      </div>

      {/* Cards Table Spread Area */}
      <div
        className={cn(
          "flex flex-wrap justify-center items-start gap-4 sm:gap-6 p-4 rounded-2xl w-full",
          spread.cardCount === 10 ? "max-w-[760px]" : spread.cardCount === 3 ? "max-w-[560px]" : "max-w-[320px]"
        )}
      >
        {drawnCards.map((dc, i) => {
          const isFlipped = flippedIndices.has(i);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2.5"
              style={{
                animationDelay: `${i * 0.08}s`,
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
                  "text-[11.5px] font-bold text-center transition-colors max-w-[110px] leading-tight",
                  isFlipped ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                )}
              >
                {dc.position.labelTh}
              </span>
            </div>
          );
        })}
      </div>

      {/* Submit / Proceed Action */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {!allFlipped ? (
          <>
            <p className="text-[12.5px] font-semibold text-[var(--text-muted)]">
              {flippedIndices.size === 0
                ? "แตะไพ่ใบแรกเพื่อเปิดคำทำนาย"
                : `เหลืออีก ${spread.cardCount - flippedIndices.size} ใบ`}
            </p>
            {flippedIndices.size > 0 && (
              <button onClick={() => setFlippedIndices(new Set(drawnCards.map((_, i) => i)))} className="btn btn-ghost text-[12.5px] px-4 py-2">
                เปิดทั้งหมด ({spread.cardCount} ใบ)
              </button>
            )}
          </>
        ) : (
          <button
            ref={submitRef}
            onClick={() => onComplete(drawnCards)}
            className="btn btn-gold px-8 py-3.5 text-[15px] font-extrabold rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-[0.98] animate-in flex items-center gap-2"
          >
            <Sparkles size={16} />
            ดูคำทำนายฉบับเต็ม
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
