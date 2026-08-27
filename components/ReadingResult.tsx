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

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#+\s/gm, "")
    .replace(/^[-*]\s/gm, "");
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
        body: JSON.stringify({
          cards: cards.map((c) => ({
            cardId: c.card.id,
            positionLabel: c.position.labelTh || c.position.label,
            reversed: c.reversed,
          })),
          question,
          spreadType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Not enough points") {
          setError(`คะแนนไม่พอ (ต้องการ ${data.needed} มี ${data.current})`);
        } else if (data.error === "Unauthorized") {
          setError("กรุณาเข้าสู่ระบบใหม่");
        } else {
          setError("ไม่สามารถทำนายได้ กรุณาลองใหม่");
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
    <div>
      <button
        onClick={() => {
          if (!loading || done) onDone();
        }}
        disabled={loading && !done}
        className="flex items-center gap-2 mb-6 transition-colors group"
        style={{ color: loading && !done ? "var(--text-muted)" : "var(--text-muted)" }}
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        <span className="text-[13px] font-medium">
          {loading && !done ? "กำลังทำนาย..." : "กลับ"}
        </span>
      </button>

      {/* Reading header */}
      <div className="text-center mb-8">
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}
        >
          {spread?.nameTh}
        </h2>
        {question && (
          <p
            className="text-[14px] italic max-w-md mx-auto"
            style={{ color: "var(--text-muted)", lineHeight: 1.6 }}
          >
            &ldquo;{question}&rdquo;
          </p>
        )}
      </div>

      {/* Revealed cards - horizontal strip */}
      <div
        className={cn(
          "flex gap-3 justify-center mb-8 flex-wrap",
          spreadType === "celtic" && "gap-2"
        )}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2"
            style={{
              animation: `fadeUp 0.4s var(--ease) ${i * 0.06}s both`,
            }}
          >
            <TarotCard
              card={c.card}
              reversed={c.reversed}
              flipped={true}
              size={spreadType === "celtic" ? "sm" : "md"}
            />
            <div className="text-center">
              <span
                className="text-[11px] font-semibold block"
                style={{ color: "var(--text-secondary)" }}
              >
                {c.card.nameTh}
              </span>
              {c.reversed && (
                <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
                  กลับ
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--border))" }} />
        <Sparkles size={14} style={{ color: "var(--gold)" }} />
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--border), transparent)" }} />
      </div>

      {/* AI Interpretation */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(109, 40, 217, 0.1), rgba(167, 139, 250, 0.05))",
              border: "1px solid rgba(109, 40, 217, 0.1)",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--primary)" }} />
          </div>
          <h3
            className="font-bold text-[16px]"
            style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
          >
            คำทำนาย
          </h3>
        </div>

        {error ? (
          <div className="text-center py-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--red-soft)" }}
            >
              <RefreshCw size={20} style={{ color: "var(--red)" }} />
            </div>
            <p className="mb-5 text-[14px] font-medium" style={{ color: "var(--red)" }}>{error}</p>
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
              className="reading-text max-h-[500px] overflow-y-auto text-[15px]"
              role="region"
              aria-live="polite"
              aria-label="คำทำนายจาก AI"
              style={{
                color: "var(--text)",
                lineHeight: 1.85,
                letterSpacing: "-0.005em",
              }}
            >
              {stripMarkdown(text)}
              {loading && !text && (
                <div className="flex items-center gap-2.5 py-2" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="text-[13px] font-medium">กำลังทำนาย...</span>
                </div>
              )}
              {loading && text && (
                <span className="reading-cursor" />
              )}
            </div>

            {done && (
              <div className="mt-8 text-center">
                <button onClick={onDone} className="btn btn-primary px-8">
                  กลับหน้าหลัก
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
