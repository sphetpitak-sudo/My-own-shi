"use client";

import { useState, useCallback } from "react";
import { Gift, Check, Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DailyBonusProps {
  userId: string;
  onClaim: (amount: number) => void;
}

const BONUS_AMOUNT = 10;

export default function DailyBonus({ userId, onClaim }: DailyBonusProps) {
  const [claimed, setClaimed] = useState(() => {
    if (typeof window === "undefined") return false;
    const last = localStorage.getItem("lastDailyBonus");
    if (last) {
      const lastDate = new Date(last).toDateString();
      const today = new Date().toDateString();
      return lastDate === today;
    }
    return false;
  });
  const [loading, setLoading] = useState(false);
  const [flyCoins, setFlyCoins] = useState<number[]>([]);

  const handleClaim = useCallback(async () => {
    if (claimed || loading) return;
    setLoading(true);

    try {
      const supabase = createClient();

      // Use RPC for atomic increment
      await supabase.rpc("increment_points", {
        p_user_id: userId,
        p_amount: BONUS_AMOUNT,
      });

      await supabase.from("point_transactions").insert({
        user_id: userId,
        amount: BONUS_AMOUNT,
        type: "daily_bonus",
        description: "Daily bonus",
      });

      localStorage.setItem("lastDailyBonus", new Date().toISOString());

      setFlyCoins([1, 2, 3]);
      setTimeout(() => setFlyCoins([]), 800);

      setClaimed(true);
      onClaim(BONUS_AMOUNT);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [claimed, loading, userId, onClaim]);

  return (
    <div className="relative">
      <button
        onClick={handleClaim}
        disabled={claimed || loading}
        className="btn w-full justify-center gap-2.5 py-3.5 text-[15px] relative overflow-hidden"
        style={{
          background: claimed ? "var(--surface)" : "linear-gradient(135deg, #f6c944, #e8a917)",
          color: claimed ? "var(--text-muted)" : "#5a3e00",
          border: claimed ? "1px solid var(--border)" : "1px solid #d4960a",
          cursor: claimed ? "default" : "pointer",
        }}
      >
        {claimed ? (
          <>
            <Check size={18} />
            มารับใหม่พรุ่งนี้
          </>
        ) : loading ? (
          <span className="animate-pulse">กำลังดำเนินการ...</span>
        ) : (
          <>
            <Gift size={18} />
            รับโบนัสรายวัน
            <span
              className="ml-1 px-2 py-0.5 rounded-full text-[12px] font-bold"
              style={{
                background: "rgba(90, 62, 0, 0.15)",
                color: "#5a3e00",
              }}
            >
              +{BONUS_AMOUNT}
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
          <Coins size={16} style={{ color: "#d4960a" }} />
        </div>
      ))}
    </div>
  );
}
