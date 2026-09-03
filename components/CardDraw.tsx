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
      // Guard rapid taps — lock after commitment, prevent duplicate
      setFlippedIndices((prev) => {
        if (prev.has(index)) return prev;
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

      {/* Cards — Circle Fan (ล้อมเป็นวงกลมให้เลือก) */}
      <div
        className={cn(
          "relative w-full flex justify-center items-center",
          spread.cardCount === 10 ? "h-[360px] sm:h-[420px]" : spread.cardCount === 3 ? "h-[280px] sm:h-[320px]" : "h-[320px]"
        )}
        style={{ perspective: "1200px" }}
      >
        {/* Subtle circular table hint */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: spread.cardCount === 10 ? "88%" : spread.cardCount === 3 ? "72%" : "52%",
            maxWidth: spread.cardCount === 10 ? 520 : 380,
            aspectRatio: "1",
            top: "52%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(ellipse at center, rgba(167,139,250,0.07) 0%, transparent 62%), radial-gradient(ellipse at center, rgba(212,175,55,0.04) 30%, transparent 72%)",
            border: "1px dashed rgba(167,139,250,0.10)",
            pointerEvents: "none",
          }}
        />
        {drawnCards.map((dc, i) => {
          const isFlipped = flippedIndices.has(i);
          const isSelected = isFlipped;
          // Circle fan math — arc 200° for 10, 68° for 3, single center
          const totalArc = spread.cardCount === 10 ? 200 : spread.cardCount === 3 ? 68 : 0;
          const startAngle = -totalArc / 2;
          const step = spread.cardCount > 1 ? totalArc / (spread.cardCount - 1) : 0;
          const angle = spread.cardCount === 1 ? 0 : startAngle + i * step;
          const w = typeof window !== "undefined" ? window.innerWidth : 390;
          const radius = spread.cardCount === 10 ? (w <= 320 ? 102 : w <= 360 ? 118 : 148) : spread.cardCount === 3 ? (w <= 320 ? 82 : 92) : 0;
          // For 10, use half-circle fan with center at bottom (like hand fan) — translateY -radius then rotate
          const translate = spread.cardCount === 1 ? "translate(-50%, -50%)" : `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`;
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-2"
              style={{
                top: "52%",
                left: "50%",
                transform: spread.cardCount === 1 ? "translate(-50%, -50%)" : `translate(-50%, -50%) ${translate}`,
                transformOrigin: "center center",
                animationDelay: `${i * 0.07}s`,
                animation: "fadeUp 0.48s var(--ease-magic) both",
                willChange: "transform, opacity",
                zIndex: isFlipped ? 20 + i : 10 + i,
              }}
            >
              <div
                className={cn(
                  "rounded-xl transition-all duration-200",
                  !isFlipped && "hover:-translate-y-1.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97]",
                  isSelected && "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg)] shadow-[0_0_18px_rgba(167,139,250,0.22)]"
                )}
                style={{
                  borderRadius: spread.cardCount === 10 ? 8 : 10,
                  transform: isFlipped ? "scale(1.02)" : undefined,
                  transition: "transform 0.22s var(--ease-magic), box-shadow 0.22s var(--ease)",
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
                  selected={isSelected}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-bold text-center leading-tight px-1.5 py-0.5 rounded-full backdrop-blur-sm",
                  isFlipped ? "text-[var(--text)] bg-[var(--bg-card)] border border-[var(--border)] shadow-sm" : "text-white bg-black/55 border border-white/10"
                )}
                style={{ fontSize: spread.cardCount === 10 ? 10 : 11.5, maxWidth: 110 }}
              >
                {dc.position.labelTh}
              </span>
            </div>
          );
        })}
        {/* Center glow */}
        <div
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: "52%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(167,139,250,0.10), transparent 70%)",
            filter: "blur(10px)",
          }}
        />
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
