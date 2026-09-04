import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, AI_MODEL, AI_PARAMS, extractJSON, asString, asNumber, colorToHex } from "@/lib/ai";
import { DAILY_SYSTEM_PROMPT, buildDailyUserPrompt } from "@/lib/prompts";
import { pickDailyCard, buildDailyFallback, type DailyFortune } from "@/lib/daily";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function normalize(parsed: Record<string, unknown>, fallback: DailyFortune): DailyFortune {
  const luckyName = asString(parsed.luckyColor) || fallback.lucky.colorTh;
  const lucky = colorToHex(luckyName, fallback.lucky.color);
  return {
    card: fallback.card,
    theme: asString(parsed.theme) || fallback.theme,
    aspects: {
      love: asString(parsed.love) || fallback.aspects.love,
      career: asString(parsed.career) || fallback.aspects.career,
      finance: asString(parsed.finance) || fallback.aspects.finance,
      study: asString(parsed.study) || fallback.aspects.study,
      health: asString(parsed.health) || fallback.aspects.health,
    },
    opportunity: asString(parsed.opportunity) || fallback.opportunity,
    caution: asString(parsed.caution) || fallback.caution,
    advice: asString(parsed.advice) || fallback.advice,
    lucky: {
      number: asNumber(parsed.luckyNumber, fallback.lucky.number),
      color: lucky.hex,
      colorTh: lucky.name,
    },
    source: "ai",
  };
}

export async function POST(request: Request) {
  const obs = startObs("daily", request);
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    const today = new Date().toISOString().slice(0, 10);

    // Single policy (Phase 3): DB rate limit only — the per-process fortune
    // cache was removed (inconsistent across serverless instances). Every
    // request within quota gets a fresh AI reading (or deterministic fallback).
    const rl = await checkRateLimitPolicy(supabase, "daily");
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

    const card = pickDailyCard(user.id, today);
    const fallback = buildDailyFallback(user.id, today);

    let fortune: DailyFortune = fallback;
    try {
      const userPrompt = buildDailyUserPrompt({
        date: today,
        cardNameTh: card.nameTh,
        reversed: card.reversed,
        uprightTh: card.uprightTh,
        reversedTh: card.reversedTh,
      });

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          abortController.abort();
        } catch {}
      }, AI_PARAMS.daily.timeoutMs);
      if (request.signal) {
        if (request.signal.aborted) abortController.abort();
        else request.signal.addEventListener("abort", () => abortController.abort(), { once: true });
      }

      // Non-streaming completion: lower overhead vs stream buffering
      const completion = await getOpenAI()
        .chat.completions.create(
          {
            model: AI_MODEL,
            messages: [
              { role: "system", content: DAILY_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: AI_PARAMS.daily.temperature,
            max_tokens: AI_PARAMS.daily.max_tokens,
          },
          { maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
        )
        .catch(() => null);
      clearTimeout(timeoutId);

      if (completion) {
        const raw = (completion as unknown as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content || "";
        const parsed = extractJSON(raw);
        if (parsed) {
          fortune = normalize(parsed, fallback);
        }
      }
    } catch {
      // fall through to deterministic fallback
    }

    if (fortune.source === "ai") {
      endObs(obs, "ok", { status: 200 });
    } else {
      endObs(obs, "fallback", { status: 200, reason: "ai_failed_or_empty" });
    }
    return NextResponse.json(fortune, { headers: obsHeaders(obs) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate daily fortune";
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: message }, { status: 500, headers: obsHeaders(obs) });
  }
}
