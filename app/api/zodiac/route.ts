import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS } from "@/lib/ai";
import { ZODIAC_SYSTEM_PROMPT, buildZodiacUserPrompt } from "@/lib/prompts";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { buildZodiacFortune, fortuneToProse, isValidBirthDate } from "@/lib/zodiac";
import { startObs, setObsUser, endObs, obsHeaders, type ObsContext } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function streamText(text: string, obs?: ObsContext) {
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
      ...(obs ? { "x-request-id": obs.requestId } : {}),
    },
  });
}

export async function POST(request: Request) {
  const obs = startObs("zodiac", request);
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 4000) {
      endObs(obs, "validation_error", { status: 413, reason: "payload_too_large" });
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: obsHeaders(obs) });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: obsHeaders(obs) });
    }

    const { birthDate } = body as { birthDate?: string };
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_birth_date" });
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400, headers: obsHeaders(obs) });
    }
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!isValidBirthDate(y!, m!, d!)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_birth_date" });
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400, headers: obsHeaders(obs) });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    const today = new Date().toISOString().slice(0, 10);

    // Single policy (Phase 3): limit BEFORE spend, fail-closed. The
    // per-process fortune cache was removed (inconsistent on serverless).
    const rl = await checkRateLimitPolicy(supabase, "zodiac");
    if (!rl.allowed) {
      const limited = rl.reason === "exceeded";
      endObs(obs, limited ? "rate_limited" : "db_error", {
        status: limited ? 429 : 503,
        reason: limited ? "rate_limited" : "rate_limit_unavailable",
      });
      return NextResponse.json(
        { error: limited ? "Too many requests. Try again later." : "Database busy, please retry" },
        { status: limited ? 429 : 503, headers: obsHeaders(obs) }
      );
    }

    // Points check — zodiac uses 5 points (single spend path only; the
    // legacy spend_points fallback was removed in Phase 3).
    let charged: number | null = null;
    let spendErr: unknown = null;
    try {
      const r = await supabase.rpc("spend_for_spread", { p_spread: "zodiac", p_description: "zodiac" }) as { data: number | null; error: unknown };
      charged = r.data as number | null;
      spendErr = r.error;
    } catch (e) { spendErr = e; }
    if (spendErr) {
      console.error("[zodiac] spend failed", spendErr);
      endObs(obs, "db_error", { status: 500, reason: "spend_failed" });
      return NextResponse.json({ error: "Failed to process points" }, { status: 500, headers: obsHeaders(obs) });
    }
    if ((charged as number) === 0 || charged == null) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).maybeSingle() as { data: { points:number } | null };
      endObs(obs, "validation_error", { status: 400, reason: "not_enough_points", needed: 5, current: profile?.points ?? 0 });
      return NextResponse.json({ error: "Not enough points", needed: 5, current: profile?.points ?? 0 }, { status: 400, headers: obsHeaders(obs) });
    }

    const fallback = buildZodiacFortune(birthDate, today);
    const sign = ZODIAC_SIGNS.find((s) => s.id === fallback.signId)!;

    let text = fortuneToProse(fallback);
    let source: "ai" | "fallback" = "fallback";
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
          source = "ai";
        }
      }
    } catch {
      // fall through to deterministic prose
    }

    if (source === "ai") {
      endObs(obs, "ok", { status: 200, cost: 5 });
    } else {
      endObs(obs, "fallback", { status: 200, reason: "ai_failed_or_empty", cost: 5 });
    }
    return streamText(text, obs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate zodiac fortune";
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: message }, { status: 500, headers: obsHeaders(obs) });
  }
}
