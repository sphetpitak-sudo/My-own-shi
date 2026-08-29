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
  const [streak, setStreak] = useState(0);
  const [heatmap, setHeatmap] = useState<boolean[]>(Array(35).fill(false));
  const [nextTier, setNextTier] = useState<{ need: number; bonus: number } | null>(null);
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
    if (!userId) return;

    async function checkClaimed() {
      try {
        const supabase = createClient();
        // Compute Bangkok midnight (UTC+7) to match database RPC claim_daily_bonus
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(new Date());

        const year = parts.find((p) => p.type === "year")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;
        const todayStart = new Date(`${year}-${month}-${day}T00:00:00+07:00`);

        const { data } = await supabase
          .from("point_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "daily_bonus")
          .gte("created_at", todayStart.toISOString())
          .limit(1);

        if (data && data.length > 0) {
          setClaimed(true);
        }

        // Fetch streak + heatmap (last 35 days)
        const { data: recent } = await supabase
          .from("point_transactions")
          .select("created_at")
          .eq("user_id", userId)
          .eq("type", "daily_bonus")
          .gte("created_at", new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(35);
        const toBangkokDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
        const todayBangkok = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const days = new Set((recent || []).map((r: { created_at: string }) => toBangkokDate(r.created_at)));
        // streak if today claimed, includes today else consecutive ending yesterday
        let s = 0;
        if (claimed || (recent && recent.some((r: { created_at: string }) => toBangkokDate(r.created_at) === todayBangkok))) {
          // today claimed, count today + backwards
          const base = new Date(`${todayBangkok}T00:00:00+07:00`);
          for (let i = 0; i < 35; i++) {
            const check = new Date(base); check.setDate(base.getDate() - i);
            const ds = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(check);
            if (days.has(ds)) s++; else break;
          }
        } else {
          // not claimed today, streak is consecutive ending yesterday
          const base = new Date(`${todayBangkok}T00:00:00+07:00`);
          for (let i = 1; i < 35; i++) {
            const check = new Date(base); check.setDate(base.getDate() - i);
            const ds = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(check);
            if (days.has(ds)) s++; else break;
          }
        }
        setStreak(s);
        // heatmap 35 days: oldest -> newest
        const hm: boolean[] = [];
        const baseHm = new Date(`${todayBangkok}T00:00:00+07:00`);
        baseHm.setDate(baseHm.getDate() - 34);
        for (let i = 0; i < 35; i++) {
          const d = new Date(baseHm); d.setDate(baseHm.getDate() + i);
          const ds = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
          hm.push(days.has(ds));
        }
        setHeatmap(hm);
        // next tier
        if (s < 3) setNextTier({ need: 3 - s, bonus: 5 });
        else if (s < 7) setNextTier({ need: 7 - s, bonus: 15 });
        else if (s < 14) setNextTier({ need: 14 - s, bonus: 20 });
        else if (s < 30) setNextTier({ need: 30 - s, bonus: 30 });
        else setNextTier(null);
      } catch {
        // server will reject duplicate claim
      }
    }
    checkClaimed();
  }, [userId, claimed]);

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
      if (typeof data.streak === "number") setStreak(data.streak);
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
      {streak > 0 && (
        <div className="flex items-center justify-center gap-1.5 mb-2 text-[12.5px] font-bold" style={{ color: streak >= 7 ? "var(--gold)" : "var(--text-secondary)" }}>
          <span className="text-[16px]">🔥</span> ต่อเนื่อง {streak} วัน
          {nextTier && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>อีก {nextTier.need} วัน → +{nextTier.bonus}</span>}
        </div>
      )}
      <div className="flex justify-center gap-1 mb-2.5">
        {heatmap.map((hit, i) => (
          <div key={i} className="w-[7px] h-[7px] rounded-[2px]" title={hit ? "รับแล้ว" : "ยังไม่รับ"} style={{ background: hit ? (i === 34 && !claimed ? "var(--primary)" : "var(--gold)") : "var(--border)", opacity: hit ? 1 : 0.5 }} />
        ))}
      </div>

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
            <span className="w-6 h-6 rounded-full grid place-items-center" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <Check size={14} />
            </span>
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
