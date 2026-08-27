import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("cookie") || "";
            return cookieHeader.split(";").filter(c => c.trim()).map(c => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            });
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already claimed today (server-side)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingTx } = await supabase
      .from("point_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "daily_bonus")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
    }

    // Get bonus amount from admin settings
    const { data: settingsRow } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "daily_bonus")
      .single();

    const bonusAmount = (settingsRow?.value as { amount: number })?.amount || 10;

    // Award points via RPC
    const { error: rpcErr } = await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: bonusAmount,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    // Record transaction
    const { error: txErr } = await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount: bonusAmount,
      type: "daily_bonus",
      description: "Daily bonus",
    });

    if (txErr) {
      // Points already awarded, log but don't fail
      console.error("Failed to record daily bonus transaction:", txErr);
    }

    return NextResponse.json({ success: true, amount: bonusAmount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to claim daily bonus";
    console.error("Daily bonus error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
