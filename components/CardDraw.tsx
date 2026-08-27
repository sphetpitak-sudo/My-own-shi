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
      {/* Cards area */}
      <div
        className={cn(
          "relative flex items-center justify-center flex-wrap gap-4",
          spread.cardCount === 10 && "max-w-[700px]"
        )}
      >
        {drawnCards.map((dc, i) => {
          const isFlipped = flippedIndices.has(i);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2"
              style={{
                animationDelay: `${i * 0.05}s`,
                animation: "fadeUp 0.4s ease both",
              }}
            >
              <TarotCard
                card={dc.card}
                reversed={dc.reversed}
                flipped={isFlipped}
                size={spread.cardCount === 10 ? "sm" : spread.cardCount === 1 ? "lg" : "md"}
                onClick={() => handleFlip(i)}
              />
              <span
                className={cn(
                  "text-[10px] font-medium text-center max-w-[100px] leading-tight transition-opacity duration-300",
                  isFlipped ? "text-[var(--text-secondary)] opacity-100" : "text-[var(--text-muted)] opacity-50"
                )}
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
          <p className="text-[13px] text-[var(--text-secondary)] animate-pulse">
            แตะไพ่เพื่อเปิด — {flippedIndices.size}/{spread.cardCount}
          </p>
        ) : (
          <button
            onClick={() => onComplete(drawnCards)}
            className="btn px-6 py-3 text-[14px] font-bold animate-in"
            style={{
              background: "linear-gradient(135deg, #c9a84c, #b8962e)",
              color: "#1a0a2e",
              boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
            }}
          >
            ✦ ดูคำทำนาย
          </button>
        )}
      </div>
    </div>
  );
}
