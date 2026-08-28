"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Gift, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

interface DailyBonusProps {
  userId: string;
  onClaim: (amount: number) => void;
}

export default function DailyBonus({ userId, onClaim }: DailyBonusProps) {
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(10);
  const [error, setError] = useState("");
  const [burst, setBurst] = useState(false);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        // server will reject duplicate claim
      }
    }
    checkClaimed();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

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
          errorTimerRef.current = setTimeout(() => setError(""), 3000);
        }
        return;
      }

      setBurst(true);
      setTimeout(() => setBurst(false), 1200);
      setClaimed(true);
      onClaim(data.amount || 10);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [claimed, loading, onClaim]);

  return (
    <div className="relative w-full">
      {error && (
        <div
          className="absolute -top-9 left-0 right-0 text-center text-[12px] font-medium px-3 py-1.5 rounded-lg z-10"
          style={{ background: "var(--red-soft)", color: "var(--red)" }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={claimed || loading}
        aria-label={claimed ? "รับโบนัสรายวันแล้ว มารับใหม่พรุ่งนี้" : `รับโบนัสรายวัน +${bonusAmount} แต้ม`}
        className={cn(
          "relative w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl",
          "text-[14px] font-bold overflow-hidden",
          "transition-all duration-300 active:scale-[0.98]"
        )}
        style={{
          background: claimed
            ? "rgba(255,255,255,0.05)"
            : "linear-gradient(135deg, #f6c944 0%, #d4af37 50%, #b8942a 100%)",
          color: claimed ? "rgba(255,255,255,0.5)" : "#3a2a00",
          border: claimed
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(212, 175, 55, 0.4)",
          cursor: claimed ? "default" : "pointer",
          boxShadow: claimed
            ? "none"
            : "0 6px 20px rgba(212, 175, 55, 0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        {/* Shimmer */}
        {!claimed && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)",
              transform: "translateX(-100%)",
              animation: "shimmerSweep 3s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {claimed ? (
          <>
            <Check size={16} />
            <span>มารับใหม่พรุ่งนี้</span>
          </>
        ) : loading ? (
          <span className="flex items-center gap-2">
            <span
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(58,42,0,0.3)", borderTopColor: "#3a2a00" }}
            />
            กำลังดำเนินการ...
          </span>
        ) : (
          <>
            <Gift size={16} />
            <span>รับโบนัสรายวัน</span>
            <span
              className="ml-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-extrabold"
              style={{ background: "rgba(58, 42, 0, 0.18)", color: "#3a2a00" }}
            >
              +{bonusAmount}
            </span>
          </>
        )}
      </button>

      {/* Burst */}
      {burst && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dx = Math.cos(angle) * 40;
            const dy = Math.sin(angle) * 40;
            return (
              <Sparkles
                key={i}
                size={14}
                style={{
                  position: "absolute",
                  color: "#d4af37",
                  animation: `coinBurst 0.9s ease-out ${i * 0.04}s both`,
                  ["--dx" as never]: `${dx}px`,
                  ["--dy" as never]: `${dy}px`,
                }}
              />
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes coinBurst {
          0% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.4) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
