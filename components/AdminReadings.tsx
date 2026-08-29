"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Reading } from "@/lib/types";
import { ALL_CARDS } from "@/lib/cards";
import { Search, BookOpen, ChevronDown, ChevronUp, Filter } from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";

interface ReadingWithUser extends Reading {
  profiles: { display_name: string } | null;
}

export default function AdminReadings() {
  const router = useRouter();
  const [readings, setReadings] = useState<ReadingWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [spreadFilter, setSpreadFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReadings = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { router.push("/dashboard"); return; }

    const { data } = await supabase
      .from("readings")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    setReadings((data as ReadingWithUser[]) || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return readings.filter(r => {
      const matchesSearch = !q || r.question?.toLowerCase().includes(q) || r.profiles?.display_name?.toLowerCase().includes(q);
      const matchesSpread = spreadFilter === "all" || r.spread_type === spreadFilter;
      return matchesSearch && matchesSpread;
    });
  }, [search, spreadFilter, readings]);

  if (loading) return <LoadingSkeleton variant="list" />;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="page-header mb-6">
          <div>
            <h1 className="page-title">ประวัติการทำนาย</h1>
            <p className="page-sub">{readings.length} การทำนายทั้งหมด</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="ค้นหาคำถาม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: "38px" }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <select
              value={spreadFilter}
              onChange={(e) => setSpreadFilter(e.target.value)}
              className="select"
              style={{ paddingLeft: "38px", minWidth: "160px" }}
            >
              <option value="all">ทุก Spread</option>
              <option value="single">ไพ่ใบเดียว</option>
              <option value="three_card">ไพ่สามใบ</option>
              <option value="celtic">กางเขนเคลติก</option>
              <option value="oracle">ไพ่ออราเคิล</option>
            </select>
          </div>
        </div>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><BookOpen size={22} /></div>
              <div className="empty-title">ไม่พบการทำนาย</div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((r) => (
                <div key={r.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="list-item w-full text-left"
                  >
                    <div className="item-icon" style={{ background: "var(--blue-soft)" }}>
                      <BookOpen size={16} style={{ color: "var(--blue)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{r.profiles?.display_name || "ไม่ทราบ"}</div>
                      <div className="text-[12px] text-muted truncate">{r.question || "ไม่มีคำถาม"}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge badge-blue">{r.spread_type}</span>
                      <span className="text-[12px] text-muted">{r.points_spent} pts</span>
                      {expandedId === r.id ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>
                  </button>

                  {expandedId === r.id && (
                      <div className="px-5 pb-4 pt-1 animate-in">
                      <div className="p-4 rounded-xl text-[13px]" style={{ background: "var(--bg)" }}>
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold text-muted">คำถาม</span>
                          <p className="mt-1">{r.question || "ไม่มีคำถาม"}</p>
                        </div>
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold text-muted">คำทำนาย</span>
                          <p className="mt-1 whitespace-pre-wrap">{r.interpretation || "ไม่มีคำทำนาย"}</p>
                        </div>
                        {r.cards && Array.isArray(r.cards) && (
                          <div>
                            <span className="text-[11px] font-semibold text-muted">ไพ่</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(r.cards as Array<{ cardId?: number; card?: { name?: string; nameTh?: string }; positionLabel?: string; position?: { label?: string; labelTh?: string } | string; reversed?: boolean }>).map((c, i) => {
                                const cardObj = typeof c.cardId === "number" ? ALL_CARDS.find((x) => x.id === c.cardId) : null;
                                const cardName = cardObj ? `${cardObj.nameTh} (${cardObj.name})` : (c.card?.nameTh || c.card?.name || `Card #${c.cardId ?? i + 1}`);
                                const position = c.positionLabel || (typeof c.position === "object" ? (c.position?.labelTh || c.position?.label) : c.position) || "";
                                return (
                                  <span key={i} className="badge badge-neutral">
                                    {position ? `${position}: ` : ""}{cardName}{c.reversed ? " (กลับหัว)" : ""}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 text-[11px] text-muted">
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
