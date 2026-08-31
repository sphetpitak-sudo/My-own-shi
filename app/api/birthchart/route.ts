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

    const body = await request.json().catch(() => ({})) as { date?: string; time?: string; place?: string };
    const date = (body.date || "").trim();
    const time = (body.time || "").trim();
    const place = (body.place || "").trim();

    if (!date || !time || !place) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Invalid time" }, { status: 400 });
    if (place.length > 80) return NextResponse.json({ error: "Place too long" }, { status: 400 });

    // Rate limit: 10 birthchart / hour
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "birthchart", p_limit: 10, p_window_seconds: 3600 });
    if (rateOk === false) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Calculate chart (real astronomy)
    const chart = await astrologyProvider.calculate({ date, time, place });

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
        chart: chart as unknown as Record<string, unknown>,
        interpretation,
        source,
      });
    } catch {}

    return NextResponse.json({ chart, interpretation, source });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
