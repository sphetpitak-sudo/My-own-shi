"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronDown, ChevronUp, CreditCard, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SPREADS } from "@/lib/cards";
import type { Reading } from "@/lib/types";

interface ReadingHistoryProps {
  userId: string;
}

const PAGE_SIZE = 10;

const spreadLabels: Record<string, string> = {
  single: "ไพ่ใบเดียว",
  three_card: "ไพ่สามใบ",
  celtic: "กางเขนเซลติก",
};

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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-[72px] w-full" />
        ))}
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <BookOpen size={24} />
        </div>
        <div className="empty-title">ยังไม่มีการทำนาย</div>
        <div className="empty-sub">เริ่มทำนายไพ่ทาโรต์เพื่อดูประวัติของคุณ</div>
        <a href="/dashboard" className="btn btn-primary mt-4">
          เริ่มทำนาย
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {readings.map((r) => {
        const isExpanded = expandedId === r.id;
        const spread = SPREADS[r.spread_type];
        const truncatedQ = r.question.length > 60 ? r.question.slice(0, 60) + "..." : r.question;

        return (
          <div key={r.id} className="card card-hover overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full text-left p-4 flex items-start gap-3"
            >
              <div
                className="item-icon flex-shrink-0 mt-0.5"
                style={{ background: "var(--amber-soft)" }}
              >
                <CreditCard size={18} style={{ color: "var(--amber)" }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                    {spreadLabels[r.spread_type] || r.spread_type}
                  </span>
                  <span className="badge badge-amber text-[10px]">-{r.points_spent} pts</span>
                </div>
                {r.question && (
                  <p className="text-[12px] mt-1 truncate" style={{ color: "var(--text-secondary)" }}>
                    {truncatedQ}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={11} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {formatDate(r.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 mt-1">
                {isExpanded ? (
                  <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                ) : (
                  <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
            </button>

            {isExpanded && (
              <div
                className="px-4 pb-4 pt-0 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                {r.question && (
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                      คำถาม
                    </div>
                    <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                      {r.question}
                    </p>
                  </div>
                )}

                <div className="mt-3">
                  <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    การทำนาย
                  </div>
                  <p
                    className="text-[13px] leading-relaxed whitespace-pre-line"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.interpretation}
                  </p>
                </div>

                {spread && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(r.cards as { card: { nameTh: string }; reversed: boolean }[]).map(
                      (c, i) => (
                        <span
                          key={i}
                          className="badge badge-neutral text-[10px]"
                        >
                          {c.card.nameTh}
                          {c.reversed && " (กลับ)"}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn btn-ghost text-[13px]"
          >
            {loadingMore ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
          </button>
        </div>
      )}
    </div>
  );
}
