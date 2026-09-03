"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Check,
  Heart,
  Briefcase,
  GraduationCap,
  Wallet,
  Activity,
} from "lucide-react";
import { stripMarkdownMultiline } from "@/lib/text";
import { createClient } from "@/lib/supabase/client";

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

type TopicKey = "love" | "career" | "study" | "finance" | "health" | "general";

const TOPICS: Record<TopicKey, { label: string; icon: LucideIcon; desc: string; color: string; bg: string }> = {
  love: { label: "ความรัก", icon: Heart, desc: "ความสัมพันธ์ ความรัก โสด มารดา", color: "var(--topic-love)", bg: "var(--topic-love-soft)" },
  career: { label: "การงาน", icon: Briefcase, desc: "อาชีพ การตัดสินใจ เส้นทาง", color: "var(--topic-career)", bg: "var(--topic-career-soft)" },
  study: { label: "การเรียน", icon: GraduationCap, desc: "การศึกษา สอบ การพัฒนาตนเอง", color: "var(--topic-study)", bg: "var(--topic-study-soft)" },
  finance: { label: "การเงิน", icon: Wallet, desc: "เงิน ลงทุน โอกาส การใช้จ่าย", color: "var(--topic-finance)", bg: "var(--topic-finance-soft)" },
  health: { label: "สุขภาพ", icon: Activity, desc: "กาย ใจ โยคะ วิถีชีวิต", color: "var(--topic-health)", bg: "var(--topic-health-soft)" },
  general: { label: "ภาพรวม", icon: Sparkles, desc: "คำถามทั่วไป ไม่ระบุหัวข้อ", color: "var(--primary)", bg: "var(--primary-soft)" },
};

interface Props {
  cards: DrawnCard[];
  spreadType: SpreadType;
  topic?: TopicKey;
  question: string;
  onDone: () => void;
  onPointsSpent?: (cost: number) => void;
  actualCost?: number;
  readingId?: string;
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
    /^(การอ่านไพ่|รายละเอียด|รายละเอียดการอ่าน|อ่านไพ่|ภาพรวม|การตีความ|แต่ละใบ|รายใบ|ดวงของคุณ|ดวงชะตา|อธิบายไพ่|ความหมายของไพ่|สิ่งที่ควรสังเกต|ไพ่ใบที่|ตำแหน่ง\s*\d|การเชื่อมโยง|ความเชื่อมโยง|ภาพรวมของสถานการณ์)/i.test(
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

export default function ReadingResult({ cards, spreadType, topic, question, onDone, onPointsSpent, actualCost }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [followQ, setFollowQ] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [followAnswer, setFollowAnswer] = useState("");
  const [followError, setFollowError] = useState("");
  const [followCount, setFollowCount] = useState(0);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const detailedRef = useRef<HTMLElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const spread = SPREADS[spreadType];
  const effectiveCost = actualCost ?? spread.cost;
  const readingDate = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const topicKey = topic ?? "general";
  const topicData = TOPICS[topicKey];

  const fetchReadingId = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Prefer reading matching current spread + recent (5min) to avoid picking unrelated latest
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase.from("readings").select("id, created_at").eq("user_id", user.id).eq("spread_type", spreadType).gte("created_at", since).order("created_at", { ascending: false }).limit(1).single();
      if (data?.id) { setReadingId(data.id); return; }
      const { data: fallback } = await supabase.from("readings").select("id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();
      if (fallback?.id) setReadingId(fallback.id);
    } catch {}
  };

  const handleCopyLink = async () => {
    const id = readingId || "";
    const url = id ? `${window.location.origin}/dashboard/history?r=${id}` : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareCopied(true);
      setTimeout(() => setShowShareCopied(false), 1800);
    } catch {}
  };

  const handleShareImage = async () => {
    const canvas = shareCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Simple journal image: gradient bg + title + cards + first 600 chars
    ctx.fillStyle = "#0e0a19";
    ctx.fillRect(0, 0, 1080, 1350);
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, "#1a1025");
    grad.addColorStop(1, "#0e0a19");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 400);
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 32px K2D, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sealo — บันทึกการอ่านไพ่", 540, 90);
    ctx.fillStyle = "#eae6df";
    ctx.font = "800 44px K2D, sans-serif";
    ctx.fillText(spread.nameTh, 540, 150);
    ctx.fillStyle = "#8e877c";
    ctx.font = "14px K2D, sans-serif";
    ctx.fillText(readingDate + " · " + cards.map(c=>c.card.nameTh).join(" · ").slice(0, 60), 540, 190);
    if (question) {
      ctx.fillStyle = "#f6c944";
      ctx.font = "italic 26px K2D, sans-serif";
      const q = `"${question.slice(0, 80)}"`;
      ctx.fillText(q, 540, 250, 900);
    }
    // Cards names
    ctx.fillStyle = "#a78bfa";
    ctx.font = "12px K2D, sans-serif";
    ctx.fillText(cards.map(c=> c.card.nameTh + (c.reversed ? " (กลับหัว)" : "")).join("  ·  ").slice(0, 90), 540, 310, 900);
    // Interpretation snippet
    const snippet = stripMarkdownMultiline(text).replace(/\s+/g, " ").slice(0, 520);
    ctx.fillStyle = "#eae6df";
    ctx.font = "18px K2D, sans-serif";
    ctx.textAlign = "left";
    const lines: string[] = [];
    let cur = "";
    for (const word of snippet.split(" ")) {
      const test = cur ? cur + " " + word : word;
      if (ctx.measureText(test).width > 900) { lines.push(cur); cur = word; } else cur = test;
    }
    if (cur) lines.push(cur);
    let y = 380;
    for (let i = 0; i < Math.min(lines.length, 18); i++) {
      ctx.fillText(lines[i], 90, y);
      y += 30;
    }
    // Footer
    ctx.fillStyle = "#645e58";
    ctx.font = "12px K2D, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("catarot.love — การทำนายเพื่อไตร่ตรอง ไม่ใช่คำทำนายที่การันตี", 540, 1320);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `sealo-${spreadType}-${Date.now()}.png`;
    a.click();
  };

  const handleFollow = async () => {
    if (!followQ.trim() || followCount >= 2) return;
    if (followQ.trim().length > 200) { setFollowError("คำถามยาวเกิน 200 อักษร"); return; }
    setFollowLoading(true);
    setFollowError("");
    setFollowAnswer("");
    try {
      const res = await fetch("/api/reading/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readingId: readingId || undefined,
          spreadType,
          cards: cards.map(c => ({ cardId: c.card.id, positionLabel: c.position.labelTh || c.position.label, reversed: c.reversed })),
          question,
          parentInterpretation: text,
          followQuestion: followQ.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        setFollowError(data.error || "ไม่สามารถถามต่อได้");
        setFollowLoading(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) { setFollowLoading(false); return; }
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, "");
          if (line.startsWith("data: ")) {
            const d = line.slice(6);
            if (d === "[DONE]") break;
            try {
              const p = JSON.parse(d);
              if (p.content) { acc += p.content; setFollowAnswer(acc); }
            } catch {}
          }
        }
      }
      setFollowCount(c => c + 1);
      setFollowQ("");
    } catch (e: unknown) {
      setFollowError(e instanceof Error ? e.message : "Network error");
    } finally {
      setFollowLoading(false);
    }
  };

  const startReading = async () => {
    if (startedRef.current && loading) return;
    startedRef.current = true;
    setText("");
    setLoading(true);
    setError("");
    setDone(false);
    setFollowAnswer("");
    setFollowError("");

    const abortController = new AbortController();
    // Must be > server total timeout (celtic 90s) + buffer — generous
    let clientTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => abortController.abort(), 100_000);
    const clearClientTimeout = () => { if (clientTimeout) { clearTimeout(clientTimeout); clientTimeout = null; } };
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
          topic: topicKey,
        }),
        signal: abortController.signal,
      });
      // keep timeout for streaming — do not clear yet

      if (!res.ok) {
        clearClientTimeout();
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
        clearClientTimeout();
        setError("ไม่สามารถอ่านการตอบกลับได้");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let hasContent = false;
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, "");
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              clearClientTimeout();
              // Deduct points only after confirmed persistence (server inserted generating row before stream)
              onPointsSpent?.(effectiveCost);
              setDone(true);
              setLoading(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error && typeof parsed.error === "string") {
                clearClientTimeout();
                setError(parsed.error);
                setLoading(false);
                return;
              }
              if (parsed.readingId && typeof parsed.readingId === "string") {
                setReadingId(parsed.readingId);
                continue;
              }
              if (parsed.content) {
                hasContent = true;
                setText((prev) => prev + parsed.content);
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
      // Fallback if stream ended without explicit [DONE] but we have content
      if (hasContent) {
        onPointsSpent?.(effectiveCost);
        setDone(true);
      } else {
        // No content received — treat as error, server already refunded
        setError("AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว");
      }
      setLoading(false);
      clearClientTimeout();
    } catch (err: unknown) {
      clearClientTimeout();
      if (err instanceof Error && err.name === "AbortError") {
        setError("AI ไม่ตอบสนองภายใน 90 วินาที กรุณาลองใหม่ — แต้มคืนแล้ว");
      } else {
        const message = err instanceof Error ? err.message : "Network error";
        setError(message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done && !readingId) fetchReadingId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, readingId]);

  // Fetch existing followup count for this reading (to enforce 2 limit across refreshes)
  useEffect(() => {
    if (!readingId) return;
    const supabase = createClient();
    supabase.from("reading_followups").select("id, question, answer", { count: "exact" }).eq("reading_id", readingId).then(({ data, count }: { data: { answer: string }[] | null; count: number | null }) => {
      if (typeof count === "number") setFollowCount(Math.min(count, 2));
      // If there are existing answers, show the latest as context (optional)
      if (data && data.length > 0) {
        const latest = data[data.length - 1] as { answer: string };
        if (latest?.answer && !followAnswer) {
          // Do not auto-show, but keep count accurate
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingId]);

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
          {topicData && topicKey !== "general" && (
            <span className={`reading-journal-pill badge-${topicKey}`} style={{ background: topicData.bg, color: topicData.color, borderColor: `${topicData.color}30` }}>
              <topicData.icon size={11} /> {topicData.label}
            </span>
          )}
          {done && !error && (
            <span className="reading-journal-pill" style={{ background: "var(--green-soft)", color: "var(--green)", borderColor: "rgba(45,122,79,0.14)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} aria-hidden />
              บันทึกแล้ว
            </span>
          )}
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
          <button
            key={i}
            role="listitem"
            className={"reading-journal-card-cell" + (done ? " completed" : "")}
            style={{
              animation: done
                ? `cardSettle 0.6s var(--ease) ${i * 0.06}s both`
                : `fadeUp 0.6s var(--ease) ${i * 0.08}s both`,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => detailedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            aria-label={`ดูความหมายของ ${c.card.nameTh} ตำแหน่ง ${c.position.labelTh}`}
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
          </button>
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
            const isDetailed = sec.key === "detailed";
            return (
              <section
                key={sec.key}
                ref={isDetailed ? detailedRef : undefined}
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
          <section ref={detailedRef} className="reading-journal-section reading-journal-section--single">
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

      {/* Disclaimer */}
      {done && !error && (
        <div className="mx-auto max-w-[640px] mt-6 p-3 rounded-xl text-center" style={{ background: "var(--amber-soft)", border: "1px solid rgba(184,148,42,0.14)" }}>
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            การทำนายเพื่อไตร่ตรอง ไม่ใช่คำทำนายที่การันตี โปรดใช้วิจารณญาณในการตัดสินใจเรื่องสำคัญ
          </p>
        </div>
      )}

      {/* Follow-up */}
      {done && !error && (
        <div className="card p-4 mt-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-[13px] font-extrabold" style={{ color: "var(--text)" }}>ถามต่อเกี่ยวกับไพ่นี้</h4>
            <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: followCount >= 2 ? "var(--red-soft)" : "var(--primary-soft)", color: followCount >= 2 ? "var(--red)" : "var(--primary)" }}>เหลือ {Math.max(0, 2 - followCount)} ครั้งฟรี</span>
          </div>
          {!readingId ? (
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>กำลังซิงค์บันทึก... รอสักครู่ก่อนถามต่อ</p>
          ) : followCount < 2 ? (
            <div className="flex gap-2">
              <input
                value={followQ}
                onChange={(e) => setFollowQ(e.target.value.slice(0, 200))}
                placeholder="เช่น ไพ่ใบนี้เตือนเรื่องอะไรเป็นพิเศษ?"
                className="input flex-1 text-[13px]"
                disabled={followLoading || !readingId}
                onKeyDown={(e) => { if (e.key === "Enter" && followQ.trim() && !followLoading) handleFollow(); }}
              />
              <button onClick={handleFollow} disabled={!followQ.trim() || followLoading || !readingId} className="btn btn-primary text-[13px] px-5">{followLoading ? "กำลังถาม..." : "ถาม"}</button>
            </div>
          ) : (
            <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>ครบ 2 ครั้งแล้ว — เริ่มพิธีกรรมใหม่เพื่อถามเพิ่มเติม</p>
          )}
          {followError && <p className="text-[12px] mt-2" style={{ color: "var(--red)" }}>{followError}</p>}
          {followAnswer && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{stripMarkdownMultiline(followAnswer)}</p>
            </div>
          )}
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
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <button onClick={handleCopyLink} className="text-[12px] font-semibold hover:underline flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              {showShareCopied ? <><Check size={12} /> คัดลอกลิงก์แล้ว</> : "คัดลอกลิงก์"}
            </button>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <button onClick={handleShareImage} className="text-[12px] font-semibold hover:underline" style={{ color: "var(--text-muted)" }}>แชร์ภาพ</button>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <Link href="/dashboard/history" className="text-[12px] font-semibold hover:underline" style={{ color: "var(--text-muted)" }}>
              ดูประวัติ →
            </Link>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <Link href="/dashboard/daily" className="text-[12px] font-semibold hover:underline" style={{ color: "var(--text-muted)" }}>
              ดูดวงรายวัน
            </Link>
          </div>
          <canvas ref={shareCanvasRef} width={1080} height={1350} style={{ display: "none" }} aria-hidden />
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
