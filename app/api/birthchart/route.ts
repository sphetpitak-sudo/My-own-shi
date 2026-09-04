import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS } from "@/lib/ai";
import { BIRTH_CHART_SYSTEM_PROMPT, buildBirthChartUserPrompt } from "@/lib/prompts";
import { astrologyProvider } from "@/lib/astrology/calculator";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const obs = startObs("birthchart", request);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    const body = await request.json().catch(() => ({})) as { date?: string; time?: string; place?: string; lat?: number; lon?: number; tzOffsetMinutes?: number };
    const date = (body.date || "").trim();
    const time = (body.time || "").trim();
    const place = (body.place || "").trim();
    const lat = typeof body.lat === "number" ? body.lat : undefined;
    const lon = typeof body.lon === "number" ? body.lon : undefined;
    const tzOffsetMinutes = typeof body.tzOffsetMinutes === "number" ? body.tzOffsetMinutes : undefined;

    if (!date || !time || !place) {
      endObs(obs, "validation_error", { status: 400, reason: "missing_fields" });
      return NextResponse.json({ error: "Missing fields" }, { status: 400, headers: obsHeaders(obs) });
    }
    // Validate real date
    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isNaN(parsed.getTime())) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_datetime" });
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_date" });
      return NextResponse.json({ error: "Invalid date" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_time" });
      return NextResponse.json({ error: "Invalid time" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (place.length > 80) {
      endObs(obs, "validation_error", { status: 400, reason: "place_too_long" });
      return NextResponse.json({ error: "Place too long" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (lat != null && (lat < -90 || lat > 90)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_lat" });
      return NextResponse.json({ error: "Invalid lat" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (lon != null && (lon < -180 || lon > 180)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_lon" });
      return NextResponse.json({ error: "Invalid lon" }, { status: 400, headers: obsHeaders(obs) });
    }
    // No future dates
    if (parsed.getTime() > Date.now() + 1000 * 60) {
      endObs(obs, "validation_error", { status: 400, reason: "future_birthdate" });
      return NextResponse.json({ error: "วันเกิดต้องไม่เป็นอนาคต" }, { status: 400, headers: obsHeaders(obs) });
    }

    // Single policy: limit BEFORE spend (no spend-then-refund on 429),
    // fail-closed on DB errors.
    const rl = await checkRateLimitPolicy(supabase, "birthchart");
    if (!rl.allowed) {
      const limited = rl.reason === "exceeded";
      endObs(obs, limited ? "rate_limited" : "db_error", {
        status: limited ? 429 : 503,
        reason: limited ? "rate_limited" : "rate_limit_unavailable",
      });
      return NextResponse.json(
        { error: limited ? "Too many requests" : "Database busy, please retry" },
        { status: limited ? 429 : 503, headers: obsHeaders(obs) }
      );
    }

    // Points check — birthchart uses 25 points (single spend path only;
    // the legacy spend_points fallback was removed in Phase 3).
    let charged: number | null = null;
    let spendErr: unknown = null;
    try {
      const r = await supabase.rpc("spend_for_spread", { p_spread: "birthchart", p_description: "birthchart" }) as { data: number | null; error: unknown };
      charged = r.data as number | null;
      spendErr = r.error;
    } catch (e) {
      spendErr = e;
    }
    if (spendErr) {
      console.error("[birthchart] spend failed", spendErr);
      endObs(obs, "db_error", { status: 500, reason: "spend_failed" });
      return NextResponse.json({ error: "Failed to process points" }, { status: 500, headers: obsHeaders(obs) });
    }
    if ((charged as number) === 0 || charged == null) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).maybeSingle() as { data: { points:number } | null };
      const cur = profile?.points ?? 0;
      // also try direct fallback if profile null (should not happen, but avoid showing 0 incorrectly)
      endObs(obs, "validation_error", { status: 400, reason: "not_enough_points", needed: 25, current: cur });
      return NextResponse.json({ error: "Not enough points", needed: 25, current: cur }, { status: 400, headers: obsHeaders(obs) });
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

    if (source === "ai") {
      endObs(obs, "ok", { status: 200, cost: 25 });
    } else {
      endObs(obs, "fallback", { status: 200, reason: "ai_failed_or_empty", cost: 25 });
    }
    return NextResponse.json({ chart, interpretation, source }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}
