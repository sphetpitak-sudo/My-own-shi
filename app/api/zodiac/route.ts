import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS, getCachedFortune, setCachedFortune } from "@/lib/ai";
import { ZODIAC_SYSTEM_PROMPT, buildZodiacUserPrompt } from "@/lib/prompts";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { buildZodiacFortune, fortuneToProse, isValidBirthDate } from "@/lib/zodiac";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function streamText(text: string) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(request: Request) {
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 4000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { birthDate } = body as { birthDate?: string };
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!isValidBirthDate(y!, m!, d!)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `zodiac:${user.id}:${birthDate}:${today}`;

    const cached = getCachedFortune(cacheKey, 24 * 3600_000);
    if (cached && typeof cached === "string") {
      return streamText(cached);
    }

    // Points check — zodiac uses 5 points (daily/chat free, rest use points)
    const { data: charged, error: spendErr } = await supabase.rpc("spend_for_spread", { p_spread: "zodiac", p_description: "zodiac" });
    if (spendErr) return NextResponse.json({ error: "Failed to process points" }, { status: 500 });
    if ((charged as number) === 0) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      return NextResponse.json({ error: "Not enough points", needed: 5, current: profile?.points ?? 0 }, { status: 400 });
    }

    const { data: zodiacOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "zodiac", p_limit: 10, p_window_seconds: 3600 });
    if (zodiacOk === false) {
      try { await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: 5 }); } catch {}
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const fallback = buildZodiacFortune(birthDate, today);
    const sign = ZODIAC_SIGNS.find((s) => s.id === fallback.signId)!;

    let text = fortuneToProse(fallback);
    try {
      const userPrompt = buildZodiacUserPrompt({
        birthDate,
        signNameTh: fallback.signNameTh,
        signNameEn: sign.nameEn,
        signSymbol: sign.symbol,
        signRange: sign.range,
        animalTh: fallback.animal.yearTh,
        animal: fallback.animal.animal,
        today,
      });

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          abortController.abort();
        } catch {}
      }, AI_PARAMS.zodiac.timeoutMs);
      if (request.signal) {
        if (request.signal.aborted) abortController.abort();
        else request.signal.addEventListener("abort", () => abortController.abort(), { once: true });
      }

      // Non-streaming completion: less overhead than stream buffering
      const completion = await getOpenAI()
        .chat.completions.create(
          {
            model: AI_MODEL,
            messages: [
              { role: "system", content: ZODIAC_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: AI_PARAMS.zodiac.temperature,
            max_tokens: AI_PARAMS.zodiac.max_tokens,
          },
          { maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
        )
        .catch(() => null);
      clearTimeout(timeoutId);

      if (completion) {
        const raw = (completion as unknown as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content?.trim() || "";
        if (raw.length > 40) {
          text = raw;
        }
      }
    } catch {
      // fall through to deterministic prose
    }

    setCachedFortune(cacheKey, text);
    return streamText(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate zodiac fortune";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
