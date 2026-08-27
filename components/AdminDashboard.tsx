"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, BookOpen, Coins, Activity, Clock } from "lucide-react";
import LoadingSkeleton from "./LoadingSkeleton";

interface Stats {
  totalUsers: number;
  totalReadings: number;
  totalPoints: number;
  activeToday: number;
}

interface RecentReading {
  id: string;
  spread_type: string;
  question: string;
  points_spent: number;
  created_at: string;
  profiles: { display_name: string } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReadings, setRecentReadings] = useState<RecentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      window.location.href = "/dashboard";
      return;
    }

    const [usersRes, readingsRes, pointsRes, activeRes, recentRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("readings").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("points"),
      supabase.from("profiles").select("id").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      supabase.from("readings").select("id, spread_type, question, points_spent, created_at, profiles(display_name)").order("created_at", { ascending: false }).limit(10),
    ]);

    const totalPoints = pointsRes.data?.reduce((sum: number, p: { points?: number }) => sum + (p.points || 0), 0) || 0;

    setStats({
      totalUsers: usersRes.count || 0,
      totalReadings: readingsRes.count || 0,
      totalPoints,
      activeToday: activeRes.data?.length || 0,
    });
    setRecentReadings(recentRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) return <LoadingSkeleton variant="stats" />;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "var(--blue-soft)", iconColor: "var(--blue)" },
    { label: "Total Readings", value: stats?.totalReadings ?? 0, icon: BookOpen, color: "var(--green-soft)", iconColor: "var(--green)" },
    { label: "Points Circulation", value: stats?.totalPoints ?? 0, icon: Coins, color: "var(--amber-soft)", iconColor: "var(--amber)" },
    { label: "Active Today", value: stats?.activeToday ?? 0, icon: Activity, color: "var(--red-soft)", iconColor: "var(--red)" },
  ];

  return (
    <div className="tab-content">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">Overview of your tarot platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}>
              <s.icon size={18} style={{ color: s.iconColor }} />
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="sec-title mb-4">Recent Readings</h2>
        {recentReadings.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><BookOpen size={22} /></div>
            <div className="empty-title">No readings yet</div>
          </div>
        ) : (
          <div className="space-y-1">
            {recentReadings.map((r) => (
              <div key={r.id} className="list-item">
                <div className="item-icon" style={{ background: "var(--blue-soft)" }}>
                  <BookOpen size={16} style={{ color: "var(--blue)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{r.profiles?.display_name || "Unknown"}</div>
                  <div className="text-[12px] text-muted truncate">{r.question || "No question"}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="badge badge-blue">{r.spread_type}</span>
                  <div className="text-[11px] text-muted mt-1">
                    <Clock size={10} className="inline mr-1" />
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
