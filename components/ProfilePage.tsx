"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Calendar, BookOpen, Coins, ArrowUpRight, ArrowDownLeft, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DailyBonus from "./DailyBonus";
import type { Profile, PointTransaction } from "@/lib/types";

interface ProfilePageProps {
  userId: string;
}

const txTypeLabels: Record<string, { label: string; icon: typeof Coins; positive: boolean }> = {
  daily_bonus: { label: "โบนัสรายวัน", icon: Coins, positive: true },
  admin_grant: { label: "ได้รับจากแอดมิน", icon: ArrowDownLeft, positive: true },
  referral: { label: "แนะนำเพื่อน", icon: ArrowDownLeft, positive: true },
  reading_purchase: { label: "ค่าทำนาย", icon: ArrowUpRight, positive: false },
};

export default function ProfilePage({ userId }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchData = async () => {
      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("point_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (txRes.data) setTransactions(txRes.data as PointTransaction[]);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleDailyBonus = (amount: number) => {
    setProfile((prev) => (prev ? { ...prev, points: prev.points + amount } : prev));
    const newTx: PointTransaction = {
      id: crypto.randomUUID(),
      user_id: userId,
      amount,
      type: "daily_bonus",
      description: "Daily bonus",
      admin_id: null,
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <div className="shimmer" style={{ height: 140, width: "100%", borderRadius: 14 }} />
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div className="shimmer" style={{ flex: 1, height: 96, borderRadius: 14 }} />
          <div className="shimmer" style={{ flex: 1, height: 96, borderRadius: 14 }} />
        </div>
        <div style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: 56, width: "100%", borderRadius: 10, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
                background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                boxShadow: "0 4px 16px rgba(109, 40, 217, 0.2)",
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || "User"}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={22} style={{ color: "white" }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.display_name || "ผู้ใช้"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <Calendar size={11} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  เป็นสมาชิกตั้งแต่{" "}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("th-TH", {
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="btn btn-ghost"
              style={{ fontSize: 12, flexShrink: 0 }}
            >
              <Settings size={13} />
              ตั้งค่า
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="stat-card" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--amber-soft)" }}>
                <Coins size={16} style={{ color: "var(--gold)" }} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{profile?.points ?? 0}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>คะแนนคงเหลือ</div>
          </div>
          <div className="stat-card" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue-soft)" }}>
                <BookOpen size={16} style={{ color: "var(--blue)" }} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{transactions.filter((t) => t.type === "reading_purchase").length}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>การทำนายทั้งหมด</div>
          </div>
        </div>

        {/* Daily Bonus */}
        <div
          className="daily-bonus-section"
          style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="daily-bonus-inner">
            <div className="daily-bonus-title">+ โบนัสรายวัน +</div>
            <div className="daily-bonus-sub">
              รับแต้มทุกวัน · ปัจจุบัน {(profile?.points ?? 0).toLocaleString()} แต้ม
            </div>
            <DailyBonus userId={userId} onClaim={handleDailyBonus} />
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>ประวัติคะแนน</h2>
            {transactions.length > 0 && (
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>
                {transactions.length} รายการ
              </span>
            )}
          </div>
          {transactions.length === 0 ? (
            <div className="empty" style={{ padding: "32px 16px" }}>
              <div className="empty-icon">
                <Coins size={22} />
              </div>
              <div className="empty-title">ยังไม่มีธุรกรรม</div>
              <div className="empty-sub">เริ่มทำนายเพื่อดูประวัติคะแนนของคุณ</div>
            </div>
          ) : (
            <div>
              {transactions.map((tx) => {
                const meta = txTypeLabels[tx.type] || {
                  label: tx.type,
                  icon: Coins,
                  positive: true,
                };
                const Icon = meta.icon;
                return (
                  <div key={tx.id} className="list-item">
                    <div
                      className="item-icon"
                      style={{
                        background: meta.positive ? "var(--green-soft)" : "var(--red-soft)",
                      }}
                    >
                      <Icon
                        size={14}
                        style={{ color: meta.positive ? "var(--green)" : "var(--red)" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {formatTxDate(tx.created_at)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontFeatureSettings: '"tnum"',
                        color: meta.positive ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {meta.positive ? "+" : ""}
                      {tx.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
