"use client";

import { useState, useEffect, useRef } from "react";
import TarotCard from "./TarotCard";
import { cn } from "@/lib/cn";
import type { DrawnCard } from "@/lib/types";
import type { SpreadType, TarotCard as CardType, Suit } from "@/lib/cards";
import { SPREADS } from "@/lib/spreads";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
  cards: DrawnCard[];
  spreadType: SpreadType;
  question: string;
  onDone: () => void;
}

function convertToCardType(card: DrawnCard["card"]): CardType {
  const suitMap: Record<string, Suit> = {
    major: "major",
    cups: "cups",
    wands: "wands",
    swords: "swords",
    pents: "pentacles",
    pentacles: "pentacles",
  };
  return {
    id: card.id,
    name: card.name,
    nameTh: card.nameTh,
    suit: suitMap[card.arcana === "major" ? "major" : card.suit!] || "major",
    imageFile: card.imageFile,
    upright: card.meaningUpright,
    uprightTh: card.meaningUpright,
    reversed: card.meaningReversed,
    reversedTh: card.meaningReversed,
  };
}

export default function ReadingResult({ cards, spreadType, question, onDone }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const spread = SPREADS[spreadType];

  useEffect(() => {
    const startReading = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cards,
            question,
            spreadType,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.error === "Not enough points") {
            setError(`points ไม่พอ (ต้องการ ${data.needed} มี ${data.current})`);
          } else {
            setError(data.error || "เกิดข้อผิดพลาด");
          }
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError("ไม่สามารถอ่านการตอบกลับได้");
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setDone(true);
                setLoading(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  setText(prev => prev + parsed.content);
                }
              } catch {}
            }
          }
        }
        setDone(true);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Network error");
        setLoading(false);
      }
    };

    startReading();
  }, []);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onDone}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-[var(--text)] mb-1">
            {spread?.nameTh} ({spread?.name})
          </h2>
          {question && (
            <p className="text-[var(--muted)] text-sm italic">"{question}"</p>
          )}
        </div>

        <div className={cn(
          "flex gap-3 justify-center mb-8 flex-wrap",
          spreadType === "celtic" && "gap-2"
        )}>
          {cards.map((c, i) => {
            const convertedCard = convertToCardType(c.card);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <TarotCard
                  card={convertedCard}
                  reversed={c.reversed}
                  flipped={true}
                  size={spreadType === "celtic" ? "sm" : "md"}
                />
                <span className="text-[10px] text-[var(--muted)] text-center max-w-[80px]">
                  {c.position}
                </span>
              </div>
            );
          })}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-[var(--text)]">คำทำนาย</h3>
          </div>

          {error ? (
            <div className="text-center py-8">
              <p className="text-[var(--red)] mb-4">{error}</p>
              <button onClick={onDone} className="btn bg-[var(--primary)] text-white">
                กลับ
              </button>
            </div>
          ) : (
            <>
              <div
                ref={textRef}
                className="text-[var(--text)] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto"
              >
                {text}
                {loading && !text && (
                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังทำนาย...</span>
                  </div>
                )}
                {loading && text && (
                  <span className="inline-block w-2 h-4 bg-[var(--primary)] animate-pulse ml-0.5" />
                )}
              </div>

              {done && (
                <div className="mt-6 text-center">
                  <button
                    onClick={onDone}
                    className="btn bg-[var(--primary)] text-white"
                  >
                    กลับหน้าหลัก
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
