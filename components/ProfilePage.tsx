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
      <div className="space-y-6 p-4 md:p-8">
        <div className="shimmer h-[140px] w-full rounded-2xl" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-[52px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, var(--primary), #a78bfa)",
                boxShadow: "0 4px 16px rgba(109, 40, 217, 0.2)",
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name || "User"}
                  width={64}
                  height={64}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={26} className="text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-bold truncate" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                {profile?.display_name || "ผู้ใช้"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar size={11} style={{ color: "var(--text-muted)" }} />
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
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
              className="btn btn-ghost text-[12px] flex-shrink-0"
            >
              <Settings size={13} />
              ตั้งค่า
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card text-center">
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--amber-soft)" }}
              >
                <Coins size={16} style={{ color: "var(--gold)" }} />
              </div>
            </div>
            <div className="stat-value text-[22px]">{profile?.points ?? 0}</div>
            <div className="stat-label">คะแนนคงเหลือ</div>
          </div>
          <div className="stat-card text-center">
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--blue-soft)" }}
              >
                <BookOpen size={16} style={{ color: "var(--blue)" }} />
              </div>
            </div>
            <div className="stat-value text-[22px]">{transactions.filter((t) => t.type === "reading_purchase").length}</div>
            <div className="stat-label">การทำนายทั้งหมด</div>
          </div>
        </div>

        {/* Daily Bonus */}
        <DailyBonus userId={userId} onClaim={handleDailyBonus} />

        {/* Transaction History */}
        <div>
          <div className="sec-title mb-4">ประวัติคะแนน</div>
          {transactions.length === 0 ? (
            <div className="empty py-8">
              <div className="empty-icon">
                <Coins size={22} />
              </div>
              <div className="empty-title">ยังไม่มีธุรกรรม</div>
              <div className="empty-sub">เริ่มทำนายเพื่อดูประวัติคะแนนของคุณ</div>
            </div>
          ) : (
            <div className="space-y-1">
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
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                        {meta.label}
                      </div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {formatTxDate(tx.created_at)}
                      </div>
                    </div>
                    <div
                      className="text-[14px] font-bold flex-shrink-0"
                      style={{ color: meta.positive ? "var(--green)" : "var(--red)" }}
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
