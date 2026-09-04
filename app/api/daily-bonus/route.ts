import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export async function POST(request: Request) {
  const obs = startObs("daily-bonus", request);
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    // Get bonus amount from admin settings
    const { data: settingsRow } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "daily_bonus")
      .single();

    const baseBonus = (settingsRow?.value as { amount: number })?.amount || 10;

    // Compute streak bonus: count consecutive daily_bonus days before today (Bangkok)
    let streakBefore = 0;
    try {
      const { data: recent } = await supabase.from("point_transactions").select("created_at").eq("user_id", user.id).eq("type", "daily_bonus").order("created_at", { ascending: false }).limit(35);
      if (recent && recent.length > 0) {
        const toBangkokDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
        const todayBangkok = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const days = new Set(recent.map(r => toBangkokDate(r.created_at as string)));
        const base = new Date(`${todayBangkok}T00:00:00+07:00`);
        for (let i = 1; i <= 35; i++) {
          const check = new Date(base);
          check.setDate(base.getDate() - i);
          const ds = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(check);
          if (days.has(ds)) streakBefore++;
          else break;
        }
      }
    } catch {}
    const newStreak = streakBefore + 1;
    let tierBonus = 0;
    if (newStreak >= 30) tierBonus = 30;
    else if (newStreak >= 14) tierBonus = 20;
    else if (newStreak >= 7) tierBonus = 15;
    else if (newStreak >= 3) tierBonus = 5;
    const bonusAmount = baseBonus + tierBonus;

    // Use atomic RPC to claim bonus (prevents race conditions)
    const { data: claimed, error: rpcErr } = await supabase.rpc("claim_daily_bonus", {
      p_user_id: user.id,
      p_amount: bonusAmount,
    });

    if (rpcErr) {
      endObs(obs, "db_error", { status: 500, reason: "claim_failed" });
      return NextResponse.json({ error: rpcErr.message }, { status: 500, headers: obsHeaders(obs) });
    }

    if (!claimed) {
      endObs(obs, "validation_error", { status: 400, reason: "already_claimed" });
      return NextResponse.json({ error: "Already claimed today" }, { status: 400, headers: obsHeaders(obs) });
    }

    endObs(obs, "ok", { status: 200, amount: bonusAmount, streak: newStreak });
    return NextResponse.json({ success: true, amount: bonusAmount, base: baseBonus, tier: tierBonus, streak: newStreak }, { headers: obsHeaders(obs) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to claim daily bonus";
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: message }, { status: 500, headers: obsHeaders(obs) });
  }
}
