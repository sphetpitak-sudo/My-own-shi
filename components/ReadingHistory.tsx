"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, ChevronDown, ChevronUp, CreditCard, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SPREADS, ALL_CARDS } from "@/lib/cards";
import type { Reading } from "@/lib/types";

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

export default function ReadingHistory({ userId }: ReadingHistoryProps) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReadings = useCallback(
    async (offset = 0, append = false) => {
      const supabase = createClient();
      const { data } = await supabase
        .from("readings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (data) {
        setReadings((prev) => (append ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [userId]
  );

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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer" style={{ height: 76, width: "100%", borderRadius: 14 }} />
        ))}
      </div>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {readings.map((r) => {
        const isExpanded = expandedId === r.id;
        const spread = SPREADS[r.spread_type];
        const truncatedQ = r.question.length > 60 ? r.question.slice(0, 60) + "..." : r.question;
        const cardCount = r.cards && Array.isArray(r.cards) ? r.cards.length : 0;

        return (
          <div key={r.id} className="card" style={{ overflow: "hidden" }}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
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

              <div style={{ flexShrink: 0, marginTop: 4 }}>
                {isExpanded ? (
                  <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
            </button>

            {isExpanded && (
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                {r.question && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--text-muted)" }}>
                      คำถาม
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {r.question}
                    </p>
                  </div>
                )}

                {r.interpretation && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: "var(--text-muted)" }}>
                      การทำนาย
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                      {r.interpretation}
                    </p>
                  </div>
                )}

                {r.cards && Array.isArray(r.cards) && r.cards.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                      ไพ่ที่เปิด
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.cards.map((c, i) => (
                        <span
                          key={i}
                          className="badge badge-neutral"
                          style={{ fontSize: 10.5 }}
                        >
                          {cardDisplayName(c)}
                          {(c as { reversed?: boolean })?.reversed ? " (กลับ)" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
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
