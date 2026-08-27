"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Reading } from "@/lib/types";
import { Search, BookOpen, ChevronDown, ChevronUp, Filter } from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";

interface DrawnCard {
  card: { name: string };
  position: string;
  reversed: boolean;
}

interface ReadingWithUser extends Reading {
  profiles: { display_name: string } | null;
}

export default function AdminReadings() {
  const [readings, setReadings] = useState<ReadingWithUser[]>([]);
  const [search, setSearch] = useState("");
  const [spreadFilter, setSpreadFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadReadings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { window.location.href = "/dashboard"; return; }

    const { data } = await supabase
      .from("readings")
      .select("*, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    setReadings((data as ReadingWithUser[]) || []);
    setLoading(false);
  }, [supabase]);

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
    <div className="tab-content">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Readings</h1>
          <p className="page-sub">{readings.length} total readings</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by question..."
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
            <option value="all">All Spreads</option>
            <option value="single">Single Card</option>
            <option value="three_card">Three Card</option>
            <option value="celtic">Celtic Cross</option>
          </select>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><BookOpen size={22} /></div>
            <div className="empty-title">No readings found</div>
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
                    <div className="text-[13px] font-semibold truncate">{r.profiles?.display_name || "Unknown"}</div>
                    <div className="text-[12px] text-muted truncate">{r.question || "No question"}</div>
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
                        <span className="text-[11px] font-semibold text-muted">QUESTION</span>
                        <p className="mt-1">{r.question || "No question provided"}</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-[11px] font-semibold text-muted">INTERPRETATION</span>
                        <p className="mt-1 whitespace-pre-wrap">{r.interpretation || "No interpretation"}</p>
                      </div>
                      {r.cards && Array.isArray(r.cards) && (
                        <div>
                          <span className="text-[11px] font-semibold text-muted">CARDS</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(r.cards as DrawnCard[]).map((c, i) => (
                              <span key={i} className="badge badge-neutral">
                                {c.card?.name || c.position} {c.reversed ? "(R)" : ""}
                              </span>
                            ))}
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
  );
}
