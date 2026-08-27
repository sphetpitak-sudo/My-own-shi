import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get bonus amount from admin settings
    const { data: settingsRow } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "daily_bonus")
      .single();

    const bonusAmount = (settingsRow?.value as { amount: number })?.amount || 10;

    // Use atomic RPC to claim bonus (prevents race conditions)
    const { data: claimed, error: rpcErr } = await supabase.rpc("claim_daily_bonus", {
      p_user_id: user.id,
      p_amount: bonusAmount,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    if (!claimed) {
      return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
    }

    return NextResponse.json({ success: true, amount: bonusAmount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to claim daily bonus";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
