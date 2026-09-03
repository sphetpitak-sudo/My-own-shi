"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import TarotCard from "./TarotCard";
import ShuffleAnimation from "./ShuffleAnimation";
import { ALL_CARDS, drawCards, type Spread, type DrawnCard } from "@/lib/cards";
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

  // Deck for circle — many cards to choose from, like image
  const deck = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    const count = spread.cardCount === 10 ? 20 : spread.cardCount === 3 ? 16 : 12;
    return shuffled.slice(0, count).map((card) => ({
      card,
      // eslint-disable-next-line react-hooks/purity
      reversed: Math.random() < 0.5,
    }));
  }, [spread.cardCount]);

  const [phase, setPhase] = useState<Phase>("shuffle");
  const [selected, setSelected] = useState<Array<{ card: typeof ALL_CARDS[number]; reversed: boolean; deckIndex: number }>>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  const allPicked = selected.length === spread.cardCount;

  useEffect(() => {
    if (allPicked && submitRef.current) {
      const t = setTimeout(() => submitRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [allPicked]);

  const handleShuffleComplete = useCallback(() => setPhase("select"), []);

  const handlePick = useCallback(
    (deckIndex: number) => {
      if (selected.some((s) => s.deckIndex === deckIndex)) return;
      if (selected.length >= spread.cardCount) return;
      const entry = deck[deckIndex];
      if (!entry) return;
      setSelected((prev) => [...prev, { card: entry.card, reversed: entry.reversed, deckIndex }]);
    },
    [selected, deck, spread.cardCount]
  );

  const handleUnpick = useCallback((deckIndex: number) => {
    setSelected((prev) => prev.filter((s) => s.deckIndex !== deckIndex));
  }, []);

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

  const progressPct = (selected.length / spread.cardCount) * 100;

  // Build DrawnCard for onComplete
  const handleComplete = () => {
    const drawn: DrawnCard[] = selected.map((s, idx) => ({
      card: s.card,
      position: spread.positions[idx],
      reversed: s.reversed,
      index: idx,
    }));
    // Fallback: if deck selection somehow not enough, fill with random
    if (drawn.length !== spread.cardCount) {
      const fallback = drawCards(spread);
      onComplete(fallback);
    } else {
      onComplete(drawn);
    }
  };

  const isSelected = (deckIndex: number) => selected.some((s) => s.deckIndex === deckIndex);

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-8 max-w-4xl mx-auto animate-fade">
      <div className="text-center space-y-1.5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">ขั้นตอนที่ 3 / 4</p>
        <h3 className="text-[22px] font-extrabold text-[var(--text)] tracking-tight">ล้อมวงไพ่ — เลือกไพ่ของคุณ</h3>
        <p className="text-[13px] text-[var(--text-secondary)]">เอาเม้าส์ชี้ ไพ่จะยื่นออกมา • แตะเพื่อเก็บไว้ {selected.length}/{spread.cardCount}</p>
      </div>

      <div className="w-full max-w-[280px] flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--gold)] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-[12px] font-bold tabular-nums text-[var(--text-muted)] min-w-[38px] text-right">
          {selected.length}/{spread.cardCount}
        </div>
      </div>

      {/* Circle — ค้างไว้ ไพ่เยอะ โฮเวอร์ยื่น */}
      <div
        className="relative w-full flex justify-center items-center"
        style={{ height: spread.cardCount === 10 ? 380 : spread.cardCount === 3 ? 340 : 300, perspective: "1200px" }}
      >
        {/* Table circle hint */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: "78%",
            maxWidth: 420,
            aspectRatio: "1",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -48%)",
            background: "radial-gradient(ellipse at center, rgba(167,139,250,0.05) 0%, transparent 62%)",
            border: "1px dashed rgba(167,139,250,0.09)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: 140,
            height: 140,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -48%)",
            background: "radial-gradient(circle, rgba(167,139,250,0.08), transparent 70%)",
            filter: "blur(8px)",
            pointerEvents: "none",
          }}
        />

        {deck.map((entry, i) => {
          const total = deck.length;
          const angle = -90 + (i * 360) / total;
          const w = typeof window !== "undefined" ? window.innerWidth : 390;
          const radius = w <= 320 ? 108 : w <= 360 ? 118 : total > 18 ? 132 : 118;
          const picked = isSelected(i);
          const hoveredNow = hovered === i && !picked;
          const extra = hoveredNow ? 14 : 0;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: 0,
                height: 0,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "0 0",
                zIndex: picked ? 1 : hoveredNow ? 20 : 5 + (i % 5),
                pointerEvents: picked ? "none" : "auto",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                style={{
                  transform: `translate(-50%, -50%) translateY(-${radius + extra}px) rotate(${-angle}deg)`,
                  transition: "transform 0.22s var(--ease-magic), filter 0.22s var(--ease)",
                  filter: picked ? "brightness(0.45) grayscale(0.2)" : hoveredNow ? "drop-shadow(0 8px 16px rgba(0,0,0,0.28)) brightness(1.04)" : undefined,
                  opacity: picked ? 0.32 : 1,
                }}
              >
                <div
                  onClick={() => handlePick(i)}
                  role="button"
                  tabIndex={picked ? -1 : 0}
                  aria-label={`ไพ่ ${i + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePick(i);
                    }
                  }}
                  className={cn("cursor-pointer", picked && "pointer-events-none")}
                  style={{ display: "block" }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 112,
                      borderRadius: 8,
                      border: "1px solid #c9a84c",
                      background: "linear-gradient(160deg, #1e0e3a 0%, #2d1548 30%, #1a0a2e 60%, #14082a 100%)",
                      boxShadow: hoveredNow ? "0 10px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.35)" : "0 4px 14px rgba(0,0,0,0.32)",
                      position: "relative",
                      overflow: "hidden",
                      transform: hoveredNow ? "scale(1.04)" : "scale(1)",
                      transition: "transform 0.22s var(--ease-magic), box-shadow 0.22s var(--ease)",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 4, border: "1px solid rgba(201,168,76,0.18)", borderRadius: 4 }} />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 14,
                        height: 14,
                        transform: "translate(-50%, -50%)",
                        background: "rgba(201,168,76,0.18)",
                        clipPath: "polygon(50% 0%, 61% 35%, 100% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 0% 35%, 39% 35%)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* เก็บไว้รอครบ */}
      {selected.length > 0 && (
        <div className="w-full max-w-[560px] card p-3">
          <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            เก็บไว้แล้ว {selected.length}/{spread.cardCount}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {selected.map((s, idx) => (
              <div key={s.deckIndex} className="relative group">
                <TarotCard card={s.card} reversed={s.reversed} flipped size="sm" showLabel={false} />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold grid place-items-center">{idx + 1}</span>
                <button onClick={() => handleUnpick(s.deckIndex)} className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full">
                  เอาออก
                </button>
                <div className="text-[10px] font-bold text-center mt-1" style={{ color: "var(--text-muted)" }}>
                  {spread.positions[idx]?.labelTh}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-1">
        {!allPicked ? (
          <p className="text-[12.5px] font-semibold text-[var(--text-muted)]">แตะไพ่ในวงเพื่อเก็บ • เลือกให้ครบ {spread.cardCount} ใบ</p>
        ) : (
          <button ref={submitRef} onClick={handleComplete} className="btn btn-gold px-8 py-3.5 text-[15px] font-extrabold rounded-2xl shadow-lg animate-in flex items-center gap-2">
            <Sparkles size={16} /> ดูคำทำนายฉบับเต็ม <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
