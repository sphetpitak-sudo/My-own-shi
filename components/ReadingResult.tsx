"use client";

import { useState, useEffect, useRef } from "react";
import TarotCard from "./TarotCard";
import { SPREADS, type DrawnCard, type SpreadType } from "@/lib/cards";
import {
  ArrowLeft,
  RefreshCw,
  BookOpen,
  Compass,
  Lightbulb,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface Props {
  cards: DrawnCard[];
  spreadType: SpreadType;
  question: string;
  onDone: () => void;
  onPointsSpent?: (cost: number) => void;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#+\s/gm, "")
    .replace(/^[-*]\s/gm, "");
}

interface ParsedSections {
  overview: string;
  detailed: string;
  advice: string;
}

function parseSections(text: string): ParsedSections {
  const stripped = stripMarkdown(text);
  // Heuristic: split on common Thai markers
  const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);
  const overview: string[] = [];
  const detailed: string[] = [];
  const advice: string[] = [];
  let bucket: "overview" | "detailed" | "advice" = "overview";

  const switchToDetailed = (line: string) => {
    if (
      /^(การอ่านไพ่|รายละเอียด|รายละเอียดการอ่าน|อ่านไพ่|ภาพรวม|การตีความ|แต่ละใบ|รายใบ|ดวงของคุณ|ดวงชะตา|อธิบายไพ่)/i.test(line)
    ) {
      bucket = "detailed";
      return true;
    }
    return false;
  };
  const switchToAdvice = (line: string) => {
    if (
      /^(คำแนะนำ|สรุป|ข้อแนะนำ|คำแนะนำทิ้งท้าย|ทิ้งท้าย|สิ่งที่ควรทำ|ก้าวต่อไป)/i.test(line)
    ) {
      bucket = "advice";
      return true;
    }
    return false;
  };

  for (const line of lines) {
    if (switchToAdvice(line) || switchToDetailed(line)) continue;
    if (bucket === "overview") overview.push(line);
    else if (bucket === "detailed") detailed.push(line);
    else advice.push(line);
  }
  return {
    overview: overview.join("\n"),
    detailed: detailed.join("\n"),
    advice: advice.join("\n"),
  };
}

export default function ReadingResult({
  cards,
  spreadType,
  question,
  onDone,
}: Props) {
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
        const data = await res.json().catch(() => ({}));
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
              // skip malformed
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

  const sections = parseSections(text);
  const hasSections = sections.overview || sections.detailed || sections.advice;

  return (
    <div className="reading-result">
      {/* Top action */}
      <div className="flex items-center justify-between px-4 pt-4 mb-2">
        <button
          onClick={() => {
            if (!loading || done) onDone();
          }}
          disabled={loading && !done}
          className="flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: loading && !done ? "var(--text-muted)" : "var(--text-secondary)" }}
        >
          <ArrowLeft size={15} />
          {loading && !done ? "กำลังทำนาย..." : "กลับ"}
        </button>
        {done && (
          <button
            onClick={startReading}
            className="flex items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: "var(--text-secondary)" }}
            aria-label="ทำนายอีกครั้ง"
          >
            <RefreshCw size={14} /> ทำนายอีกครั้ง
          </button>
        )}
      </div>

      {/* Question header */}
      {question && (
        <div className="reading-question-card">
          <div className="reading-question-eyebrow">คำถามของคุณ</div>
          <p className="reading-question-text">{question}</p>
          <div className="reading-spread">{spread?.nameTh}</div>
        </div>
      )}

      {!question && (
        <div className="reading-question-card" style={{ textAlign: "center" }}>
          <div className="reading-question-eyebrow">การทำนาย</div>
          <p className="reading-question-text" style={{ fontStyle: "normal" }}>
            {spread?.nameTh}
          </p>
        </div>
      )}

      {/* Cards strip */}
      <div className="reading-cards-strip">
        {cards.map((c, i) => (
          <div
            key={i}
            className="reading-card-cell"
            style={{
              animation: `fadeUp 0.5s var(--ease) ${i * 0.07}s both`,
            }}
          >
            <TarotCard
              card={c.card}
              reversed={c.reversed}
              flipped={true}
              size={spreadType === "celtic" ? "sm" : "md"}
              showLabel
            />
            <div className="text-center">
              <div className="reading-card-name">{c.position.labelTh}</div>
              {c.reversed && <div className="reading-card-reversed">กลับหัว</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Summary pills */}
      <div className="reading-summary">
        {cards.map((c, i) => (
          <span key={i} className="reading-summary-pill">
            <Sparkles size={10} style={{ color: "var(--gold)" }} />
            {c.card.nameTh}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="reading-divider">
        <div className="reading-divider-line" />
        <BookOpen size={14} className="reading-divider-glyph" />
        <div className="reading-divider-line" />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={startReading} onDone={onDone} />
      ) : (
        <ReadingBody
          text={text}
          sections={sections}
          hasSections={!!hasSections}
          loading={loading}
          textRef={textRef}
        />
      )}

      {done && !error && (
        <div className="px-4 mt-6 mb-2 text-center">
          <button onClick={onDone} className="btn btn-primary px-8 py-3 rounded-2xl">
            กลับหน้าหลัก
          </button>
        </div>
      )}
    </div>
  );
}

function ReadingBody({
  text,
  sections,
  hasSections,
  loading,
  textRef,
}: {
  text: string;
  sections: ParsedSections;
  hasSections: boolean;
  loading: boolean;
  textRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!hasSections) {
    return (
      <div className="reading-section-card">
        <div className="reading-section-title">คำทำนาย</div>
        <div
          ref={textRef}
          className="reading-section-text"
          aria-live="polite"
          aria-label="คำทำนายจาก AI"
        >
          {stripMarkdown(text)}
          {loading && text && <span className="reading-streaming" />}
        </div>
        {loading && !text && (
          <div className="reading-empty-stream">
            <div className="mystical-loader">
              <div className="mystical-loader-dot" />
              <div className="mystical-loader-dot" />
              <div className="mystical-loader-dot" />
            </div>
            <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
              กำลังอ่านไพ่...
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {sections.overview && (
        <div
          className="reading-section-card"
          style={{ animation: "fadeUp 0.4s var(--ease) both" }}
        >
          <div className="reading-section-title flex items-center gap-2">
            <Compass size={13} /> ภาพรวม
          </div>
          <div
            ref={!sections.detailed && !sections.advice ? textRef : undefined}
            className="reading-section-text"
            aria-live="polite"
            aria-label="คำทำนายจาก AI"
          >
            {sections.overview}
            {!sections.detailed && !sections.advice && loading && (
              <span className="reading-streaming" />
            )}
          </div>
        </div>
      )}

      {sections.detailed && (
        <div
          className="reading-section-card"
          style={{ animation: "fadeUp 0.4s var(--ease) 0.1s both" }}
        >
          <div className="reading-section-title flex items-center gap-2">
            <BookOpen size={13} /> การอ่านไพ่
          </div>
          <div
            ref={!sections.advice ? textRef : undefined}
            className="reading-section-text"
          >
            {sections.detailed}
            {!sections.advice && loading && <span className="reading-streaming" />}
          </div>
        </div>
      )}

      {sections.advice && (
        <div
          className="reading-section-card"
          style={{ animation: "fadeUp 0.4s var(--ease) 0.15s both" }}
        >
          <div className="reading-section-title flex items-center gap-2">
            <Lightbulb size={13} /> คำแนะนำ
          </div>
          <div ref={textRef} className="reading-section-text">
            {sections.advice}
            {loading && <span className="reading-streaming" />}
          </div>
        </div>
      )}

      {loading && !text && (
        <div className="reading-empty-stream" style={{ paddingTop: 8 }}>
          <div className="mystical-loader">
            <div className="mystical-loader-dot" />
            <div className="mystical-loader-dot" />
            <div className="mystical-loader-dot" />
          </div>
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
            กำลังอ่านไพ่...
          </span>
        </div>
      )}
    </>
  );
}

function ErrorState({
  error,
  onRetry,
  onDone,
}: {
  error: string;
  onRetry: () => void;
  onDone: () => void;
}) {
  return (
    <div className="reading-section-card" style={{ textAlign: "center", padding: "32px 18px" }}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "var(--red-soft)" }}
      >
        <AlertTriangle size={22} style={{ color: "var(--red)" }} />
      </div>
      <p className="mb-5 text-[14px] font-medium" style={{ color: "var(--red)" }}>
        {error}
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={onRetry} className="btn btn-primary rounded-xl">
          <RefreshCw size={14} /> ลองใหม่
        </button>
        <button onClick={onDone} className="btn btn-ghost rounded-xl">
          กลับ
        </button>
      </div>
    </div>
  );
}
