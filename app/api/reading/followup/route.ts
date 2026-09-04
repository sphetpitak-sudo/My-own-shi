import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS, isValidPositionLabel, createAiStream, armFirstTokenGuard, isBreakerOpen, recordBreakerFailure } from "@/lib/ai";
import { FOLLOWUP_SYSTEM_PROMPT, buildFollowupUserPrompt } from "@/lib/prompts";
import { startObs, setObsUser, endObs, logObs, obsHeaders } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type FollowCard = { cardId: number; positionLabel: string; reversed: boolean };

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: Request) {
  const obs = startObs("followup", request);
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 8000) {
      endObs(obs, "validation_error", { status: 413, reason: "payload_too_large" });
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: obsHeaders(obs) });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_json" });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: obsHeaders(obs) });
    }
    // parentInterpretation is intentionally ignored — authoritative value is fetched from DB
    const { question, spreadType, cards, followQuestion, readingId } = body as {
      question?: string;
      spreadType?: string;
      cards?: FollowCard[];
      parentInterpretation?: string;
      followQuestion?: string;
      readingId?: string;
    };

    // Validate followQuestion strictly — reject, do not truncate
    if (typeof followQuestion !== "string" || !followQuestion.trim()) {
      endObs(obs, "validation_error", { status: 400, reason: "missing_follow_question" });
      return NextResponse.json({ error: "Missing followQuestion" }, { status: 400, headers: obsHeaders(obs) });
    }
    const trimmedQ = followQuestion.trim();
    if (trimmedQ.length > LIMITS.followQuestionMax) {
      endObs(obs, "validation_error", { status: 400, reason: "question_too_long" });
      return NextResponse.json({ error: `Question too long (max ${LIMITS.followQuestionMax})` }, { status: 400, headers: obsHeaders(obs) });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    if (!readingId || !isUUID(readingId)) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_reading_id" });
      return NextResponse.json({ error: "Missing or invalid readingId" }, { status: 400, headers: obsHeaders(obs) });
    }
    const effectiveReadingId = readingId;

    // Verify ownership and fetch authoritative reading (never trust client-supplied interpretation/cards)
    const { data: reading, error: readErr } = await supabase
      .from("readings")
      .select("id, user_id, cards, spread_type, question, interpretation")
      .eq("id", readingId)
      .single();
    if (readErr || !reading) {
      endObs(obs, "validation_error", { status: 404, reason: "reading_not_found", readingId });
      return NextResponse.json({ error: "Reading not found" }, { status: 404, headers: obsHeaders(obs) });
    }
    if (reading.user_id !== user.id) {
      endObs(obs, "unauthorized", { status: 403, reason: "forbidden", readingId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: obsHeaders(obs) });
    }
    // Do not allow followup on generating placeholder
    if ((reading.interpretation as string) === "__generating__") {
      endObs(obs, "validation_error", { status: 409, reason: "reading_generating", readingId });
      return NextResponse.json({ error: "Reading not ready" }, { status: 409, headers: obsHeaders(obs) });
    }

    // Verify client cards match stored reading if provided (tamper detection)
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const stored = (reading.cards as unknown as FollowCard[]) || [];
      const storedIds = new Set(stored.map((c) => c.cardId));
      const reqIds = new Set(cards.map((c) => c.cardId));
      if (storedIds.size !== reqIds.size || [...storedIds].some((id) => !reqIds.has(id))) {
        return NextResponse.json({ error: "Cards do not match reading" }, { status: 400, headers: obsHeaders(obs) });
      }
      if (spreadType && spreadType !== reading.spread_type) {
        return NextResponse.json({ error: "Spread mismatch" }, { status: 400, headers: obsHeaders(obs) });
      }
    }

    // Enforce 2 followup limit server-side (reservation prevents cost amplification)
    const { count: followCount } = await supabase.from("reading_followups").select("id", { count: "exact", head: true }).eq("reading_id", readingId);
    if ((followCount ?? 0) >= 2) {
      return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429, headers: obsHeaders(obs) });
    }

    // Effective cards: always use stored reading cards (authoritative) — ignore client-supplied cards content except for tamper check above
    const effectiveCards: FollowCard[] = (reading.cards as unknown as FollowCard[]) || [];
    if (!Array.isArray(effectiveCards) || effectiveCards.length === 0) return NextResponse.json({ error: "Invalid reading cards" }, { status: 400, headers: obsHeaders(obs) });
    // Validate stored cards charset/length (defense if old data was polluted)
    for (const c of effectiveCards) {
      if (!isValidPositionLabel(c.positionLabel)) return NextResponse.json({ error: "Invalid position in stored reading" }, { status: 400, headers: obsHeaders(obs) });
    }

    // If client supplied cards with valid spread but different length, already rejected; still verify count
    const expectedSpread = SPREADS[reading.spread_type as SpreadType];
    if (expectedSpread && effectiveCards.length !== expectedSpread.cardCount) {
      return NextResponse.json({ error: "Stored card count mismatch" }, { status: 400, headers: obsHeaders(obs) });
    }

    // Single policy: limit BEFORE reserve, fail-closed on DB errors.
    const rl = await checkRateLimitPolicy(supabase, "followup");
    if (!rl.allowed) {
      if (rl.reason === "db_unavailable") {
        endObs(obs, "db_error", { status: 503, reason: "rate_limit_unavailable", readingId });
        return NextResponse.json({ error: "Database busy, please retry" }, { status: 503, headers: obsHeaders(obs) });
      }
      endObs(obs, "rate_limited", { status: 429, readingId });
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: obsHeaders(obs) });
    }

    // Reserve slot before AI (prevents parallel burst)
    const { data: pending, error: pendingErr } = await supabase
      .from("reading_followups")
      .insert({ reading_id: effectiveReadingId, user_id: user.id, question: trimmedQ, answer: "__generating__" })
      .select("id")
      .single();
    if (pendingErr) {
      if (pendingErr.message && pendingErr.message.includes("Followup limit")) {
        return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429, headers: obsHeaders(obs) });
      }
      return NextResponse.json({ error: "Failed to reserve followup" }, { status: 429, headers: obsHeaders(obs) });
    }
    const pendingId = (pending as { id: string }).id;

    // Authoritative parent interpretation from DB, not client
    const authoritativeParent = (reading.interpretation as string) || "";
    const authoritativeQuestion = (reading.question as string) || (question || "");

    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    const resolved = effectiveCards.map((c) => {
      const card = cardMap.get(c.cardId)!;
      return { name: card.name, nameTh: card.nameTh, position: c.positionLabel, reversed: c.reversed };
    });

    const userPrompt = buildFollowupUserPrompt({
      originalQuestion: authoritativeQuestion,
      cards: resolved,
      parentInterpretation: authoritativeParent.slice(0, 1200),
      followQuestion: trimmedQ,
    });

    const params = AI_PARAMS.followup;

    // Circuit breaker (shared store): skip the AI call when Typhoon is
    // failing globally instead of adding retry load. Fail-open on RPC error.
    // Free endpoint — no spend/refund, but clean up the reserved slot.
    if (await isBreakerOpen(supabase, "followup")) {
      try {
        await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id);
      } catch {}
      endObs(obs, "breaker_open", { status: 503, reason: "ai_breaker_open", readingId, pendingId });
      return NextResponse.json({ error: "AI กำลังหนาแน่น กรุณาลองใหม่ในครู่" }, { status: 503, headers: obsHeaders(obs) });
    }

    type FollowupChunk = { choices: Array<{ delta?: { content?: string } }> };
    let handle: Awaited<ReturnType<typeof createAiStream<AsyncIterable<FollowupChunk>>>> | null = null;
    try {
      // Centralized pre-stream setup: client-abort forwarding + create
      // timeout + ONE safe retry (pre-stream only — see lib/ai.ts).
      handle = await createAiStream<AsyncIterable<FollowupChunk>>({
        create: (signal) =>
          getOpenAI().chat.completions.create(
            {
              model: AI_MODEL,
              messages: [
                { role: "system", content: FOLLOWUP_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              stream: true,
            },
            { timeout: params.timeoutMs, maxRetries: 0, signal } as unknown as Record<string, unknown>
          ) as unknown as Promise<AsyncIterable<FollowupChunk>>,
        requestSignal: request.signal,
        timeoutMs: params.timeoutMs,
        onRetry: (err, attempt) => logObs(obs, "ai_retry", { attempt }),
      });
    } catch (err: unknown) {
      handle?.detach();
      await recordBreakerFailure(supabase, "followup");
      try {
        await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id);
      } catch {}
      console.error("AI create failed", err);
      endObs(obs, "ai_error", { status: 502, reason: "ai_create_failed", readingId, pendingId });
      return NextResponse.json({ error: "AI unavailable" }, { status: 502, headers: obsHeaders(obs) });
    }

    if (!handle) {
      await recordBreakerFailure(supabase, "followup");
      try {
        await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id);
      } catch {}
      endObs(obs, "ai_error", { status: 502, reason: "no_stream", readingId, pendingId });
      return NextResponse.json({ error: "AI unavailable" }, { status: 502, headers: obsHeaders(obs) });
    }
    const stream = handle.stream;

    const encoder = new TextEncoder();
    let fullAnswer = "";
    let deleted = false;
    const clearFirstTokenGuard = armFirstTokenGuard(() => {
      try {
        handle?.abort();
      } catch {}
    }, params.firstTokenMs);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              clearFirstTokenGuard();
              if (fullAnswer.length < 2000) fullAnswer += content.slice(0, 2000 - fullAnswer.length);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearFirstTokenGuard();
          handle?.detach();

          // Persist BEFORE sending [DONE] — CAS guard (mirror reading/route.ts):
          // only overwrite while the row is still ours (__generating__). If the
          // sweeper already deleted it, the update matches 0 rows and we tell
          // the client to retry instead of sending a dead [DONE].
          let casWon = false;
          try {
            const persisted = await supabase
              .from("reading_followups")
              .update({ answer: fullAnswer.slice(0, 2000) })
              .eq("id", pendingId)
              .eq("user_id", user.id)
              .eq("answer", "__generating__")
              .select("id");
            const rows = (persisted as unknown as { data: Array<{ id: string }> | null })?.data;
            casWon = Array.isArray(rows) && rows.length > 0;
          } catch (e) {
            console.error("Failed to persist followup", e);
            try {
              await supabase.from("reading_followups").delete().eq("id", pendingId);
            } catch {}
          }

          if (!casWon && fullAnswer.trim()) {
            // Sweeper won the race: reservation already cleaned up.
            endObs(obs, "refunded", { status: 200, reason: "cas_lost_to_sweeper", readingId, pendingId });
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "หมดเวลา กรุณาลองใหม่" })}\n\n`));
            } catch {}
            try {
              controller.error(new Error("CAS lost to sweeper"));
            } catch {}
            return;
          }

          endObs(obs, "ok", { status: 200, readingId, pendingId, chars: fullAnswer.length });
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          clearFirstTokenGuard();
          handle?.detach();
          console.error("Streaming failed", err);
          await recordBreakerFailure(supabase, "followup");
          if (!deleted) {
            deleted = true;
            try {
              await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id);
            } catch {}
          }
          try {
            controller.error(new Error("stream failed"));
          } catch {}
        }
      },
      cancel() {
        try {
          handle?.abort();
        } catch {}
        clearFirstTokenGuard();
        handle?.detach();
        if (!deleted) {
          deleted = true;
          supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id).then(() => {}, () => {});
        }
      },
    });
    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no", "x-request-id": obs.requestId },
    });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}
