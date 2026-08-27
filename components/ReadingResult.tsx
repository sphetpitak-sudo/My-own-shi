"use client";

import { useState, useEffect, useRef } from "react";
import TarotCard from "./TarotCard";
import { cn } from "@/lib/cn";
import { SPREADS, type DrawnCard, type SpreadType } from "@/lib/cards";
import { Sparkles, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

interface Props {
  cards: DrawnCard[];
  spreadType: SpreadType;
  question: string;
  onDone: () => void;
}

export default function ReadingResult({ cards, spreadType, question, onDone }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const spread = SPREADS[spreadType];

  const startReading = async () => {
    setText("");
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards, question, spreadType }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Not enough points") {
          setError(`คะแนนไม่พอ (ต้องการ ${data.needed} มี ${data.current})`);
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
                setText((prev) => prev + parsed.content);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
      setDone(true);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      setLoading(false);
    }
  };

  useEffect(() => {
    startReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onDone}
          className="flex items-center gap-2 mb-6 transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          <span className="text-sm">กลับ</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {spread?.nameTh}
          </h2>
          {question && (
            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
              &ldquo;{question}&rdquo;
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex gap-3 justify-center mb-8 flex-wrap",
            spreadType === "celtic" && "gap-2"
          )}
        >
          {cards.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <TarotCard
                card={c.card}
                reversed={c.reversed}
                flipped={true}
                size={spreadType === "celtic" ? "sm" : "md"}
              />
              <span className="text-[10px] text-center max-w-[80px]" style={{ color: "var(--text-muted)" }}>
                {c.card.nameTh}
              </span>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} style={{ color: "var(--primary)" }} />
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>คำทำนาย</h3>
          </div>

          {error ? (
            <div className="text-center py-8">
              <p className="mb-4" style={{ color: "var(--red)" }}>{error}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={startReading} className="btn btn-primary">
                  <RefreshCw size={14} />
                  ลองใหม่
                </button>
                <button onClick={onDone} className="btn btn-ghost">
                  กลับ
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={textRef}
                className="leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto"
                style={{ color: "var(--text)" }}
              >
                {text}
                {loading && !text && (
                  <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>กำลังทำนาย...</span>
                  </div>
                )}
                {loading && text && (
                  <span className="inline-block w-2 h-4 animate-pulse ml-0.5" style={{ background: "var(--primary)" }} />
                )}
              </div>

              {done && (
                <div className="mt-6 text-center">
                  <button onClick={onDone} className="btn btn-primary">
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
