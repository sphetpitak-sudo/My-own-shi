"use client";
import { useState, useCallback, useMemo } from "react";
import TarotCard from "./TarotCard";
import { drawCards, type Spread, type DrawnCard } from "@/lib/cards";
import { cn } from "@/lib/cn";

interface Props {
  spread: Spread;
  onComplete: (cards: DrawnCard[]) => void;
}

export default function CardDraw({ spread, onComplete }: Props) {
  const drawnCards = useMemo(() => drawCards(spread), [spread]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());

  const allFlipped = flippedIndices.size === spread.cardCount;

  const handleFlip = useCallback(
    (index: number) => {
      setFlippedIndices((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Instruction header */}
      {!allFlipped && (
        <div className="text-center animate-in">
          <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>
            เลือกไพ่ของคุณ
          </p>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            แตะไพ่เพื่อเปิดเผยคำตอบ
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {Array.from({ length: spread.cardCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  flippedIndices.has(i)
                    ? "scale-100"
                    : "scale-75 opacity-40"
                )}
                style={{
                  background: flippedIndices.has(i) ? "var(--gold)" : "var(--text-muted)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cards area */}
      <div
        className={cn(
          "relative flex items-center justify-center flex-wrap gap-5",
          spread.cardCount === 10 && "max-w-[700px]"
        )}
      >
        {drawnCards.map((dc, i) => {
          const isFlipped = flippedIndices.has(i);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-3"
              role="button"
              aria-label={isFlipped ? `${dc.card.nameTh}${dc.reversed ? ' กลับหัว' : ''}` : `ไพ่ใบที่ ${i + 1} - ${dc.position.labelTh}`}
              tabIndex={0}
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
                onClick={() => handleFlip(i)}
                aria-label={isFlipped ? `${dc.card.nameTh}${dc.reversed ? ' กลับหัว' : ''}` : `ไพ่ใบที่ ${i + 1} - ${dc.position.labelTh}`}
              />
              <span
                className={cn(
                  "text-[11px] font-medium text-center max-w-[100px] leading-tight transition-all duration-500",
                  isFlipped
                    ? "text-[var(--text-secondary)] opacity-100 translate-y-0"
                    : "text-[var(--text-muted)] opacity-50 translate-y-1"
                )}
                style={{ fontWeight: isFlipped ? 600 : 500 }}
              >
                {dc.position.labelTh}
              </span>
            </div>
          );
        })}
      </div>

      {/* Instruction / button */}
      <div className="flex flex-col items-center gap-3">
        {!allFlipped ? (
          <p className="text-[14px] font-medium animate-pulse" style={{ color: "var(--text-muted)" }}>
            {flippedIndices.size}/{spread.cardCount} ใบ
          </p>
        ) : (
          <div className="animate-in" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={() => onComplete(drawnCards)}
              className="btn px-8 py-3.5 text-[15px] font-bold"
              autoFocus
              style={{
                background: "linear-gradient(135deg, #d4af37, #b8942a)",
                color: "#1a0a2e",
                boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                letterSpacing: "0.02em",
              }}
            >
              ดูคำทำนาย
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
