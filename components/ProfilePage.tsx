"use client";

import { useState, useEffect } from "react";
import { User, Calendar, BookOpen, Coins, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PointsBalance from "./PointsBalance";
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
      <div className="space-y-6">
        <div className="shimmer h-[160px] w-full rounded-2xl" />
        <div className="shimmer h-[80px] w-full rounded-2xl" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-[56px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "var(--primary)", color: "var(--text-invert)" }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={28} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] font-bold truncate" style={{ color: "var(--text)" }}>
              {profile?.display_name || "ผู้ใช้"}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar size={12} style={{ color: "var(--text-muted)" }} />
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
        </div>
      </div>

      {/* Points */}
      <div className="card p-6">
        <PointsBalance points={profile?.points ?? 0} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2">
            <Coins size={18} style={{ color: "var(--amber)" }} />
          </div>
          <div className="stat-value">{profile?.points ?? 0}</div>
          <div className="stat-label">คะแนนคงเหลือ</div>
        </div>
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2">
            <BookOpen size={18} style={{ color: "var(--blue)" }} />
          </div>
          <div className="stat-value">{transactions.filter((t) => t.type === "reading_purchase").length}</div>
          <div className="stat-label">การทำนายทั้งหมด</div>
        </div>
      </div>

      {/* Daily Bonus */}
      <DailyBonus userId={userId} onClaim={handleDailyBonus} />

      {/* Transaction History */}
      <div>
        <div className="sec-title mb-3">ประวัติคะแนน</div>
        {transactions.length === 0 ? (
          <div className="empty py-6">
            <div className="empty-icon">
              <Coins size={22} />
            </div>
            <div className="empty-title">ยังไม่มีธุรกรรม</div>
          </div>
        ) : (
          <div className="space-y-1.5">
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
                      size={16}
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
  );
}
