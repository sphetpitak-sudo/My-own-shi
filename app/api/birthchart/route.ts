import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS } from "@/lib/ai";
import { BIRTH_CHART_SYSTEM_PROMPT, buildBirthChartUserPrompt } from "@/lib/prompts";
import { astrologyProvider } from "@/lib/astrology/calculator";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({})) as { date?: string; time?: string; place?: string; lat?: number; lon?: number; tzOffsetMinutes?: number };
    const date = (body.date || "").trim();
    const time = (body.time || "").trim();
    const place = (body.place || "").trim();
    const lat = typeof body.lat === "number" ? body.lat : undefined;
    const lon = typeof body.lon === "number" ? body.lon : undefined;
    const tzOffsetMinutes = typeof body.tzOffsetMinutes === "number" ? body.tzOffsetMinutes : undefined;

    if (!date || !time || !place) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    // Validate real date
    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isNaN(parsed.getTime())) return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Invalid time" }, { status: 400 });
    if (place.length > 80) return NextResponse.json({ error: "Place too long" }, { status: 400 });
    if (lat != null && (lat < -90 || lat > 90)) return NextResponse.json({ error: "Invalid lat" }, { status: 400 });
    if (lon != null && (lon < -180 || lon > 180)) return NextResponse.json({ error: "Invalid lon" }, { status: 400 });
    // No future dates
    if (parsed.getTime() > Date.now() + 1000 * 60) return NextResponse.json({ error: "วันเกิดต้องไม่เป็นอนาคต" }, { status: 400 });

    // Points check — birthchart uses 25 points (ทุกฟีเจอร์ต้องใช้แต้ม ยกเว้น daily/chat)
    const { data: charged, error: spendErr } = await supabase.rpc("spend_for_spread", { p_spread: "birthchart", p_description: "birthchart" });
    if (spendErr) return NextResponse.json({ error: "Failed to process points" }, { status: 500 });
    if ((charged as number) === 0) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      return NextResponse.json({ error: "Not enough points", needed: 25, current: profile?.points ?? 0 }, { status: 400 });
    }

    // Rate limit: 10 birthchart / hour
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "birthchart", p_limit: 10, p_window_seconds: 3600 });
    if (rateOk === false) {
      // refund points if rate limited
      try { await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: 25 }); } catch {}
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Calculate chart (real astronomy) — pass precise coords if provided
    let chart;
    try {
      chart = await astrologyProvider.calculate({ date, time, place, lat, lon, tzOffsetMinutes });
    } catch (e) {
      try { await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: 25 }); } catch {}
      throw e;
    }

    // AI interpretation (non-stream, with fallback)
    let interpretation = "";
    let source: "ai" | "fallback" = "fallback";
    try {
      const userPrompt = buildBirthChartUserPrompt({
        date, time, place,
        sun: { sign: chart.sun.sign, degree: chart.sun.degree },
        moon: { sign: chart.moon.sign, degree: chart.moon.degree },
        rising: chart.rising || chart.sun.sign,
        planets: chart.planets.map(p => ({ planet: p.planet, sign: p.sign, degree: p.degree })),
      });

      const completion = await getOpenAI().chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: BIRTH_CHART_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: AI_PARAMS.birthchart.temperature,
        max_tokens: AI_PARAMS.birthchart.max_tokens,
      }, { timeout: AI_PARAMS.birthchart.timeoutMs } as unknown as Record<string, unknown>);

      const raw = (completion as unknown as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content || "";
      if (raw.trim()) {
        interpretation = raw.trim().slice(0, 4000);
        source = "ai";
      }
    } catch (e) {
      console.error("birthchart AI failed", e);
    }

    // Try to persist (optional — ignore if table doesn't exist)
    try {
      await supabase.from("birth_charts").insert({
        user_id: user.id,
        birth_date: date,
        birth_time: time,
        birth_place: place,
        lat: (chart as unknown as { lat?: number }).lat ?? lat ?? null,
        lon: (chart as unknown as { lon?: number }).lon ?? lon ?? null,
        tz: (chart as unknown as { timezone?: string }).timezone ?? null,
        tz_offset: (chart as unknown as { tzOffsetMinutes?: number }).tzOffsetMinutes ?? tzOffsetMinutes ?? null,
        house_system: (chart as unknown as { houseSystem?: string }).houseSystem ?? "whole_sign",
        zodiac_system: "tropical",
        chart: chart as unknown as Record<string, unknown>,
        interpretation,
        source,
      } as unknown as Record<string, unknown>);
    } catch {}

    return NextResponse.json({ chart, interpretation, source });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
