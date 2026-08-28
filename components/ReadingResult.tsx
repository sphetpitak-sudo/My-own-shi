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
  CalendarDays,
  Layers,
} from "lucide-react";
import { stripMarkdownMultiline } from "@/lib/text";

interface Props {
  cards: DrawnCard[];
  spreadType: SpreadType;
  question: string;
  onDone: () => void;
  onPointsSpent?: (cost: number) => void;
}

interface ParsedSection {
  key: "overview" | "detailed" | "advice";
  title: string;
  content: string;
}

function parseSections(text: string): ParsedSection[] {
  const stripped = stripMarkdownMultiline(text);
  const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);

  const overview: string[] = [];
  const detailed: string[] = [];
  const advice: string[] = [];
  let bucket: "overview" | "detailed" | "advice" = "overview";

  const isDetailedHeading = (line: string) =>
    /^(การอ่านไพ่|รายละเอียด|รายละเอียดการอ่าน|อ่านไพ่|ภาพรวม|การตีความ|แต่ละใบ|รายใบ|ดวงของคุณ|ดวงชะตา|อธิบายไพ่|ความหมายของไพ่)/i.test(
      line.replace(/^[-•\d.\s]+/, "")
    );
  const isAdviceHeading = (line: string) =>
    /^(คำแนะนำ|สรุป|ข้อแนะนำ|คำแนะนำทิ้งท้าย|ทิ้งท้าย|สิ่งที่ควรทำ|ก้าวต่อไป|บทสรุป|สิ่งที่ไพ่อยากบอก)/i.test(
      line.replace(/^[-•\d.\s]+/, "")
    );

  for (const line of lines) {
    if (isAdviceHeading(line)) {
      bucket = "advice";
      continue;
    }
    if (isDetailedHeading(line)) {
      // Avoid treating the very first "ภาพรวม" as detailed if it's the opening
      if (overview.length === 0 && /ภาพรวม/i.test(line)) {
        continue;
      }
      bucket = "detailed";
      continue;
    }
    if (bucket === "overview") overview.push(line);
    else if (bucket === "detailed") detailed.push(line);
    else advice.push(line);
  }

  const sections: ParsedSection[] = [];
  if (overview.join("\n").trim()) {
    sections.push({ key: "overview", title: "ภาพรวม", content: overview.join("\n") });
  }
  if (detailed.join("\n").trim()) {
    sections.push({ key: "detailed", title: "การอ่านไพ่", content: detailed.join("\n") });
  }
  if (advice.join("\n").trim()) {
    sections.push({ key: "advice", title: "คำแนะนำจากไพ่", content: advice.join("\n") });
  }
  return sections;
}

export default function ReadingResult({ cards, spreadType, question, onDone }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const spread = SPREADS[spreadType];
  const readingDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
        } else if (res.status === 429) {
          setError("ทำนายถี่เกินไป กรุณารอสักครู่แล้วลองใหม่");
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
    if (startedRef.current) return;
    startedRef.current = true;
    startReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = parseSections(text);
  const hasSections = sections.length > 0;

  return (
    <div className="reading-journal">
      {/* Top bar */}
      <div className="reading-journal-top">
        <button
          onClick={() => {
            if (!loading || done) onDone();
          }}
          disabled={loading && !done}
          className="reading-journal-back"
          aria-label="กลับหน้าหลัก"
        >
          <ArrowLeft size={16} />
          <span>{loading && !done ? "กำลังทำนาย..." : "กลับ"}</span>
        </button>
        {done && !error && (
          <button
            onClick={startReading}
            className="reading-journal-retry"
            aria-label="ทำนายอีกครั้ง"
          >
            <RefreshCw size={14} />
            <span>ทำนายอีกครั้ง</span>
          </button>
        )}
      </div>

      {/* Header */}
      <header className="reading-journal-header">
        <div className="reading-journal-eyebrow">
          <Sparkles size={12} />
          <span>บันทึกการอ่านไพ่</span>
          <span aria-hidden className="reading-journal-dot" />
          <span>{readingDate}</span>
        </div>
        <h1 className="reading-journal-title">{spread?.nameTh ?? "การอ่านไพ่"}</h1>
        <p className="reading-journal-spread-en">{spread?.name ?? spreadType}</p>
        <div className="reading-journal-meta">
          <span className="reading-journal-pill">
            <Layers size={12} />
            {spread?.cardCount ?? cards.length} ใบ
          </span>
          <span className="reading-journal-pill muted">
            <CalendarDays size={12} />
            {readingDate}
          </span>
        </div>
      </header>

      {/* Cards - premium centered */}
      <div
        className={
          "reading-journal-cards " + (spreadType === "celtic" ? "reading-journal-cards--celtic" : "")
        }
        role="list"
        aria-label="ไพ่ที่เปิดได้"
      >
        {cards.map((c, i) => (
          <div
            key={i}
            role="listitem"
            className="reading-journal-card-cell"
            style={{
              animation: `fadeUp 0.6s var(--ease) ${i * 0.08}s both`,
            }}
          >
            <div className="reading-journal-card-wrap">
              <TarotCard
                card={c.card}
                reversed={c.reversed}
                flipped={true}
                size={spreadType === "celtic" ? "sm" : cards.length === 1 ? "lg" : "md"}
                showLabel={false}
                ariaLabel={`${c.card.nameTh}${c.reversed ? " กลับหัว" : ""} — ${c.position.labelTh}`}
              />
            </div>
            <div className="reading-journal-card-meta">
              <span className="reading-journal-card-position">{c.position.labelTh}</span>
              <span className="reading-journal-card-name">{c.card.nameTh}</span>
              {c.reversed && <span className="reading-journal-card-reversed">กลับหัว</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Summary line - subtle */}
      <div className="reading-journal-summary" aria-label="สรุปไพ่">
        {cards.map((c, i) => (
          <span key={i} className="reading-journal-summary-pill">
            {c.card.nameTh}
            {c.reversed ? " · กลับหัว" : ""}
          </span>
        ))}
      </div>

      {/* Question - prominent journal quote */}
      <div className="reading-journal-question">
        <div className="reading-journal-question-label">
          <BookOpen size={12} />
          คำถามของคุณ
        </div>
        {question ? (
          <blockquote className="reading-journal-question-text">“{question}”</blockquote>
        ) : (
          <p className="reading-journal-question-empty">ไม่มีคำถามเฉพาะ — ดูภาพรวมทั่วไป</p>
        )}
        <div className="reading-journal-question-spread">{spread?.nameTh} · {spread?.descriptionTh}</div>
      </div>

      {/* Divider */}
      <div className="reading-journal-divider" aria-hidden>
        <div className="reading-journal-divider-line" />
        <div className="reading-journal-divider-glyph">
          <Sparkles size={14} />
        </div>
        <div className="reading-journal-divider-line" />
      </div>

      {/* Content */}
      {error ? (
        <ErrorState error={error} onRetry={startReading} onDone={onDone} hasPartial={!!text.trim()} partialText={text} />
      ) : hasSections ? (
        <div className="reading-journal-sections">
          {sections.map((sec, idx) => {
            const Icon = sec.key === "overview" ? Compass : sec.key === "detailed" ? BookOpen : Lightbulb;
            const isLastStreaming = idx === sections.length - 1 && loading;
            return (
              <section
                key={sec.key}
                className={"reading-journal-section reading-journal-section--" + sec.key}
                style={{ animation: `fadeUp 0.5s var(--ease) ${0.08 * idx}s both` } as React.CSSProperties}
                aria-labelledby={"reading-section-" + sec.key}
              >
                <div className="reading-journal-section-header">
                  <span className="reading-journal-section-icon">
                    <Icon size={14} />
                  </span>
                  <h2 id={"reading-section-" + sec.key} className="reading-journal-section-title">
                    {sec.title}
                  </h2>
                  <span className="reading-journal-section-line" aria-hidden />
                </div>
                <div
                  ref={idx === sections.length - 1 ? textRef : undefined}
                  className="reading-journal-section-body"
                  aria-live={idx === sections.length - 1 ? "polite" : undefined}
                >
                  <SectionContent content={sec.content} />
                  {isLastStreaming && <span className="reading-streaming" aria-hidden />}
                </div>
              </section>
            );
          })}
          {loading && !text.trim() && <TarotLoadingState />}
        </div>
      ) : (
        <div className="reading-journal-sections">
          <section className="reading-journal-section reading-journal-section--single">
            <div className="reading-journal-section-header">
              <span className="reading-journal-section-icon">
                <Compass size={14} />
              </span>
              <h2 className="reading-journal-section-title">คำทำนาย</h2>
              <span className="reading-journal-section-line" aria-hidden />
            </div>
            <div
              ref={textRef}
              className="reading-journal-section-body"
              aria-live="polite"
              aria-busy={loading}
            >
              {text ? (
                <>
                  <SectionContent content={text} />
                  {loading && <span className="reading-streaming" aria-hidden />}
                </>
              ) : (
                <TarotLoadingState />
              )}
            </div>
          </section>
        </div>
      )}

      {/* Footer actions */}
      {done && !error && (
        <div className="reading-journal-footer">
          <p className="reading-journal-footer-note">บันทึกนี้ถูกเก็บไว้ในประวัติของคุณแล้ว</p>
          <div className="reading-journal-footer-actions">
            <button onClick={onDone} className="btn btn-primary px-8 py-3.5 rounded-2xl text-[14px]">
              กลับหน้าหลัก
            </button>
            <button onClick={startReading} className="btn btn-ghost rounded-2xl text-[14px]">
              <RefreshCw size={14} /> อ่านอีกครั้ง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionContent({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-[0.9em]">
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="reading-journal-paragraph"
        >
          {para}
        </p>
      ))}
    </div>
  );
}

function TarotLoadingState() {
  return (
    <div className="reading-journal-loading" role="status" aria-live="polite">
      <div className="reading-journal-loading-cards" aria-hidden>
        <div className="reading-journal-loading-card" style={{ animationDelay: "0s" }} />
        <div className="reading-journal-loading-card" style={{ animationDelay: "0.12s" }} />
        <div className="reading-journal-loading-card" style={{ animationDelay: "0.24s" }} />
      </div>
      <div className="reading-journal-loading-text">
        <span className="reading-journal-loading-title">กำลังอ่านพลังงานของไพ่</span>
        <span className="reading-journal-loading-sub">ไพ่กำลังบอกเล่าเรื่องราวของคุณ</span>
      </div>
      <div className="mystical-loader" aria-hidden>
        <div className="mystical-loader-dot" />
        <div className="mystical-loader-dot" />
        <div className="mystical-loader-dot" />
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
  onDone,
  hasPartial,
  partialText,
}: {
  error: string;
  onRetry: () => void;
  onDone: () => void;
  hasPartial?: boolean;
  partialText?: string;
}) {
  return (
    <div className="reading-journal-error">
      {hasPartial && partialText && (
        <div className="reading-journal-partial">
          <div className="reading-journal-partial-label">เนื้อหาที่ได้รับบางส่วน</div>
          <p className="reading-journal-paragraph" style={{ opacity: 0.85 }}>{stripMarkdownMultiline(partialText).slice(0, 600)}{partialText.length > 600 ? "…" : ""}</p>
        </div>
      )}
      <div className="reading-journal-error-card">
        <div className="reading-journal-error-icon">
          <AlertTriangle size={20} />
        </div>
        <h3 className="reading-journal-error-title">ไม่สามารถทำนายได้ในขณะนี้</h3>
        <p className="reading-journal-error-message">{error}</p>
        <div className="reading-journal-error-actions">
          <button onClick={onRetry} className="btn btn-primary rounded-xl">
            <RefreshCw size={14} /> ลองใหม่
          </button>
          <button onClick={onDone} className="btn btn-ghost rounded-xl">
            กลับ
          </button>
        </div>
        <p className="reading-journal-error-hint">หากคะแนนถูกหักไปแล้ว ระบบจะคืนแต้มให้อัตโนมัติ</p>
      </div>
    </div>
  );
}
