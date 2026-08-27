"use client";

import { useState, useCallback, useEffect } from "react";
import { Gift, Check, Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DailyBonusProps {
  userId: string;
  onClaim: (amount: number) => void;
}

export default function DailyBonus({ userId, onClaim }: DailyBonusProps) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flyCoins, setFlyCoins] = useState<number[]>([]);
  const [bonusAmount, setBonusAmount] = useState(10);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBonusAmount() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "daily_bonus")
          .single();
        if (data?.value && typeof data.value === "object" && "amount" in data.value) {
          setBonusAmount((data.value as { amount: number }).amount || 10);
        }
      } catch {
        // fallback to 10
      }
    }
    fetchBonusAmount();
  }, []);

  // Check server-side if already claimed today
  useEffect(() => {
    async function checkClaimed() {
      try {
        const supabase = createClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data } = await supabase
          .from("point_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "daily_bonus")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString())
          .limit(1);

        if (data && data.length > 0) {
          setClaimed(true);
        }
      } catch {
        // If check fails, allow user to try claiming (server will reject if already claimed)
      }
    }
    checkClaimed();
  }, [userId]);

  const handleClaim = useCallback(async () => {
    if (claimed || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/daily-bonus", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error === "Already claimed today") {
          setClaimed(true);
        } else {
          setError(data.error || "ไม่สามารถรับโบนัสได้");
          setTimeout(() => setError(""), 3000);
        }
        return;
      }

      setFlyCoins([1, 2, 3]);
      setTimeout(() => setFlyCoins([]), 800);

      setClaimed(true);
      onClaim(data.amount || 10);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [claimed, loading, onClaim]);

  return (
    <div className="relative">
      {error && (
        <div className="absolute -top-10 left-0 right-0 text-center text-[12px] font-medium px-3 py-1.5 rounded-lg"
          style={{ background: "var(--red-soft)", color: "var(--red)" }}>
          {error}
        </div>
      )}
      <button
        onClick={handleClaim}
        disabled={claimed || loading}
        className="btn w-full justify-center gap-2.5 py-3.5 text-[14px] relative overflow-hidden"
        style={{
          background: claimed
            ? "rgba(255,255,255,0.06)"
            : "linear-gradient(135deg, #f6c944, #d4af37, #b8942a)",
          color: claimed ? "rgba(255,255,255,0.4)" : "#4a3800",
          border: claimed ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(212, 175, 55, 0.4)",
          cursor: claimed ? "default" : "pointer",
          boxShadow: claimed ? "none" : "0 4px 16px rgba(212, 175, 55, 0.25)",
        }}
      >
        {claimed ? (
          <>
            <Check size={16} />
            มารับใหม่พรุ่งนี้
          </>
        ) : loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#4a3800]/30 border-t-[#4a3800] rounded-full animate-spin" />
            กำลังดำเนินการ...
          </span>
        ) : (
          <>
            <Gift size={16} />
            รับโบนัสรายวัน
            <span
              className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: "rgba(74, 56, 0, 0.12)",
                color: "#4a3800",
              }}
            >
              +{bonusAmount}
            </span>
          </>
        )}
      </button>

      {flyCoins.map((id) => (
        <div
          key={id}
          className="absolute pointer-events-none coin-fly"
          style={{
            left: "50%",
            top: "50%",
            animationDelay: `${id * 0.08}s`,
          }}
        >
          <Coins size={14} style={{ color: "#d4af37" }} />
        </div>
      ))}
    </div>
  );
}
