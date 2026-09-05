"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, ChevronDown, ChevronUp, CreditCard, Sparkles, BookOpen, Compass, Lightbulb, Copy, Check, Star, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";
import type { Reading } from "@/lib/types";
import TarotCard from "./TarotCard";
import { stripMarkdownMultiline } from "@/lib/text";
import { ErrorState } from "./ui/State";

interface ReadingHistoryProps {
  userId: string;
}

const PAGE_SIZE = 10;

const SPREAD_LABELS: Record<string, string> = {
  oracle: "ไพ่ลางสังหรณ์",
};

// Extract a display name from a stored card row, handling both tarot
// ({ cardId, positionLabel, reversed }) and oracle ({ id, nameTh, keywordTh }) shapes.
function cardDisplayName(c: unknown): string {
  if (!c || typeof c !== "object") return "";
  const obj = c as Record<string, unknown>;
  if (typeof obj.cardId === "number") {
    return ALL_CARDS.find((x) => x.id === obj.cardId)?.nameTh ?? "";
  }
  if (obj.card && typeof obj.card === "object") {
    return (obj.card as { nameTh?: string }).nameTh ?? "";
  }
  if (typeof obj.nameTh === "string") return obj.nameTh;
  return "";
}

function resolveTarotCard(c: unknown): { card: typeof ALL_CARDS[number]; reversed: boolean; label: string } | null {
  if (!c || typeof c !== "object") return null;
  const obj = c as Record<string, unknown>;
  if (typeof obj.cardId === "number") {
    const card = ALL_CARDS.find((x) => x.id === obj.cardId);
    if (!card) return null;
    return {
      card,
      reversed: !!obj.reversed,
      label: typeof obj.positionLabel === "string" ? obj.positionLabel : "",
    };
  }
  return null;
}

function parseHistorySections(text: string): { key: string; title: string; content: string }[] {
  const stripped = stripMarkdownMultiline(text);
  const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);
  const overview: string[] = [];
  const detailed: string[] = [];
  const advice: string[] = [];
  let bucket: "overview" | "detailed" | "advice" = "overview";
  for (const line of lines) {
    if (/^(คำแนะนำ|สรุป|ข้อแนะนำ|ทิ้งท้าย|สิ่งที่ควรทำ|ก้าวต่อไป|บทสรุป|สิ่งที่ไพ่อยากบอก)/i.test(line.replace(/^[-•\d.\s]+/, ""))) {
      bucket = "advice";
      continue;
    }
    if (/^(การอ่านไพ่|รายละเอียด|ภาพรวม|การตีความ|แต่ละใบ|ดวงของคุณ|สิ่งที่ควรสังเกต|ไพ่ใบที่|ตำแหน่ง\s*\d|การเชื่อมโยง|ความเชื่อมโยง|ภาพรวมของสถานการณ์)/i.test(line.replace(/^[-•\d.\s]+/, ""))) {
      if (overview.length === 0 && /ภาพรวม/i.test(line)) continue;
      bucket = "detailed";
      continue;
    }
    if (bucket === "overview") overview.push(line);
    else if (bucket === "detailed") detailed.push(line);
    else advice.push(line);
  }
  const out: { key: string; title: string; content: string }[] = [];
  if (overview.join("\n").trim()) out.push({ key: "overview", title: "ภาพรวม", content: overview.join("\n") });
  if (detailed.join("\n").trim()) out.push({ key: "detailed", title: "การอ่านไพ่", content: detailed.join("\n") });
  if (advice.join("\n").trim()) out.push({ key: "advice", title: "คำแนะนำจากไพ่", content: advice.join("\n") });
  return out.length ? out : [{ key: "single", title: "คำทำนาย", content: stripped }];
}

function HistoryCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // ignore
        }
      }}
      className="btn btn-ghost"
      style={{ alignSelf: "center", fontSize: 12, padding: "8px 14px" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "คัดลอกแล้ว" : "คัดลอกคำทำนาย"}
    </button>
  );
}

export default function ReadingHistory({ userId }: ReadingHistoryProps) {
  const searchParams = useSearchParams();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("sealo_favorites") || "[]")); } catch { return new Set(); }
  });

  const fetchReadings = useCallback(
    async (offset = 0, append = false) => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("readings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (fetchError) throw fetchError;
        if (data) {
          setReadings((prev) => {
            const next = append ? [...prev, ...data] : data;
            const rParam = searchParams.get("r");
            if (rParam && next.some((r: { id: string }) => r.id === rParam)) {
              setExpandedId(rParam);
              // scroll after render
              setTimeout(() => document.getElementById(`reading-${rParam}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
            }
            return next;
          });
          setHasMore(data.length === PAGE_SIZE);
        }
        // Successful fetch clears any previous error (e.g. after retry).
        setError("");
      } catch {
        // Stop the shimmer and show an explicit, retryable error instead.
        if (!append) setReadings([]);
        setError("โหลดประวัติไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, searchParams]
  );

  const retryFetch = () => {
    setError("");
    setLoading(true);
    fetchReadings();
  };

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  // Refresh when the tab regains focus so newly created readings appear
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchReadings();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchReadings]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchReadings(readings.length, true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("sealo_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div role="status" aria-label="กำลังโหลดประวัติการทำนาย" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer" style={{ height: 76, width: "100%", borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="โหลดประวัติไม่สำเร็จ"
        message={error}
        onRetry={retryFetch}
      />
    );
  }

  if (readings.length === 0) {
    return (
      <div className="empty" style={{ padding: "40px 16px" }}>
        <div className="empty-icon">
          <Sparkles size={22} />
        </div>
        <div className="empty-title">ยังไม่มีการทำนาย</div>
        <div className="empty-sub">
          เริ่มทำนายไพ่ทาโรต์เพื่อดูประวัติของคุณ
        </div>
        <Link
          href="/dashboard/reading"
          className="btn btn-primary"
          style={{ marginTop: 16, fontSize: 13, padding: "10px 20px" }}
        >
          เริ่มทำนาย
        </Link>
      </div>
    );
  }

  const filteredReadings = readings.filter(r => {
    const matchFilter = filter === "all" ? true : filter === "favorites" ? favorites.has(r.id) : r.spread_type === filter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || r.question.toLowerCase().includes(q) || (r.interpretation && r.interpretation.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {readings.length > 0 && (
        <>
          <div className="relative">
            <input
              type="search"
              placeholder="ค้นหาคำถามหรือคำทำนาย..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pr-10"
              style={{ fontSize: 13 }}
              aria-label="ค้นหาประวัติ"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} aria-hidden>
              <Search size={14} />
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scroll-row-touch" style={{ scrollbarWidth: "none" }}>
            {["all", "favorites", "single", "three_card", "celtic", "oracle"].map((k) => {
              const isFav = k === "favorites";
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  aria-pressed={filter === k}
                  className="chip touch-hit"
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    fontSize: 12,
                    background: filter === k ? "var(--primary)" : "var(--bg-card)",
                    color: filter === k ? "white" : "var(--text-secondary)",
                    borderColor: filter === k ? "var(--primary)" : "var(--border)",
                  }}
                >
                  {isFav && <Star size={11} fill={filter === k ? "white" : "none"} style={{ display: "inline", verticalAlign: "middle" }} />}
                  {k === "all" ? "ทั้งหมด" : isFav ? ` โปรด (${favorites.size})` : SPREAD_LABELS[k] || k}
                </button>
              );
            })}
          </div>
        </>
      )}
      {readings.length >= 2 && (
        <div className="card p-3 grid grid-cols-3 gap-2 text-center" style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.04), rgba(212,175,55,0.04))" }}>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>อ่านทั้งหมด</div>
            <div className="text-[18px] font-extrabold" style={{ letterSpacing: "-0.02em" }}>{readings.length}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)" }}>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>ไพ่ที่เปิด</div>
            <div className="text-[18px] font-extrabold">{readings.reduce((s, r) => s + (Array.isArray(r.cards) ? r.cards.length : 0), 0)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>ใช้แต้ม</div>
            <div className="text-[18px] font-extrabold" style={{ color: "var(--gold)" }}>{readings.reduce((s, r) => s + (r.points_spent || 0), 0)}</div>
          </div>
        </div>
      )}
      {filteredReadings.map((r) => {
        const isExpanded = expandedId === r.id;
        const spread = r.spread_type !== "oracle" ? SPREADS[r.spread_type as SpreadType] : undefined;
        const truncatedQ = r.question.length > 60 ? r.question.slice(0, 60) + "..." : r.question;
        const cardCount = r.cards && Array.isArray(r.cards) ? r.cards.length : 0;

        return (
          <div key={r.id} id={`reading-${r.id}`} className="card" style={{ overflow: "hidden" }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : r.id); } }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s var(--ease)",
              }}
              className="hover:bg-[var(--bg)]"
              aria-expanded={isExpanded}
            >
              <div
                className="item-icon"
                style={{ background: "var(--gold-soft)", marginTop: 1 }}
              >
                <CreditCard size={15} style={{ color: "var(--gold)" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>
                    {SPREAD_LABELS[r.spread_type] || spread?.nameTh || r.spread_type}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--amber-soft)",
                      color: "var(--amber)",
                    }}
                  >
                    -{r.points_spent} แต้ม
                  </span>
                  {cardCount > 0 && (
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                      {cardCount} ใบ
                    </span>
                  )}
                </div>
                {r.question && (
                  <p style={{ fontSize: 12.5, marginTop: 4, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {truncatedQ}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Clock size={11} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {formatDate(r.created_at)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 4 }}>
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(r.id); }}
                  aria-label={favorites.has(r.id) ? "ลบออกจากโปรด" : "เพิ่มโปรด"}
                  className="touch-hit w-7 h-7 grid place-items-center rounded-full"
                  style={{ background: favorites.has(r.id) ? "var(--gold-soft)" : "var(--bg)", border: `1px solid ${favorites.has(r.id) ? "var(--gold)" : "var(--border)"}`, color: favorites.has(r.id) ? "var(--gold)" : "var(--text-muted)" }}
                >
                  <Star size={12} fill={favorites.has(r.id) ? "currentColor" : "none"} />
                </button>
                {isExpanded ? (
                  <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
            </div>

            {isExpanded && (() => {
              const sections = r.interpretation ? parseHistorySections(r.interpretation) : [];
              const tarotCards = (r.cards as unknown[] | null)?.map(resolveTarotCard).filter(Boolean) as { card: typeof ALL_CARDS[number]; reversed: boolean; label: string }[] | null;
              const hasTarotVisual = tarotCards && tarotCards.length > 0;
              return (
                <div style={{ padding: "14px 16px 16px", borderTop: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 55%, transparent)" }}>
                  {r.question ? (
                    <div className="reading-journal-question" style={{ margin: "0 0 14px", padding: "14px 16px" }}>
                      <div className="reading-journal-question-label" style={{ justifyContent: "center" }}>
                        <BookOpen size={11} /> คำถามของคุณ
                      </div>
                      <blockquote className="reading-journal-question-text" style={{ fontSize: 15, marginTop: 4 }}>
                        “{r.question}”
                      </blockquote>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                      ไม่มีคำถามเฉพาะ — ดูภาพรวมทั่วไป
                    </div>
                  )}

                  {hasTarotVisual ? (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                      {tarotCards!.map((tc, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: r.cards.length > 6 ? 86 : 110 }}>
                          <TarotCard card={tc.card} reversed={tc.reversed} flipped={true} size={r.cards.length > 6 ? "xs" as const : "sm" as const} showLabel={false} />
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--primary)", textAlign: "center", lineHeight: 1.2 }}>{tc.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", textAlign: "center", lineHeight: 1.2 }}>{tc.card.nameTh}{tc.reversed ? " · กลับหัว" : ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : r.cards && Array.isArray(r.cards) && r.cards.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                      {r.cards.map((c, i) => (
                        <span key={i} className="badge badge-neutral" style={{ fontSize: 10.5 }}>
                          {cardDisplayName(c)}
                          {(c as { reversed?: boolean })?.reversed ? " (กลับ)" : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {r.interpretation ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
                      {sections.map((sec) => {
                        const Icon = sec.key === "overview" ? Compass : sec.key === "detailed" ? BookOpen : Lightbulb;
                        return (
                          <div key={sec.key} className={"reading-journal-section reading-journal-section--" + sec.key} style={{ padding: "14px 14px" }}>
                            <div className="reading-journal-section-header" style={{ marginBottom: 10, paddingBottom: 10 }}>
                              <span className="reading-journal-section-icon" style={{ width: 26, height: 26 }}><Icon size={12} /></span>
                              <h4 className="reading-journal-section-title" style={{ fontSize: 12 }}>{sec.title}</h4>
                              <span className="reading-journal-section-line" />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.7em" }}>
                              {sec.content.split(/\n+/).map((para, idx) => (
                                <p key={idx} className="reading-journal-paragraph" style={{ fontSize: 13.5, lineHeight: 1.85 }}>{para.trim()}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <HistoryCopyButton text={r.interpretation} />
                    </div>
                  ) : (
                    <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-muted)", fontStyle: "italic" }}>ไม่มีคำทำนายที่บันทึกไว้</p>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}

      {filteredReadings.length === 0 && readings.length > 0 && (
        <div className="empty" style={{ padding: "24px 16px" }}>
          <div className="empty-title" style={{ fontSize: 13 }}>ไม่พบการทำนายประเภทนี้</div>
          <button onClick={() => setFilter("all")} className="btn btn-ghost mt-3 text-[12px]">ล้างตัวกรอง</button>
        </div>
      )}

      {hasMore && filter === "all" && (
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
          >
            {loadingMore ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
          </button>
        </div>
      )}
    </div>
  );
}
