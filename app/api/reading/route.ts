import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS, isValidPositionLabel, createAiStream, armFirstTokenGuard, isBreakerOpen, recordBreakerFailure } from "@/lib/ai";
import { PROMPT_VERSION, getReadingSystemPrompt, buildReadingUserPrompt } from "@/lib/prompts";
import { startObs, setObsUser, endObs, logObs, logPromptVersion, obsHeaders, normalizeTopic } from "@/lib/observability";
import { checkRateLimitPolicy } from "@/lib/ratelimit";
import { reportError } from "@/lib/sentry";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

type ReadingCardInput = { cardId: number; positionLabel: string; reversed: boolean };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), ms))]);
}

const SPREAD_TO_P_SPEND: Record<SpreadType, string> = {
  single: "single",
  three_card: "three_card",
  celtic: "celtic",
};

// Removed legacy getTopicPrompt — now handled via lib/prompts TOPIC_MODIFIERS + getReadingSystemPrompt (v2.0)

export async function POST(request: Request) {
  const obs = startObs("reading", request);
  try {
    // Guard oversized payload before JSON parse (DoS)
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
    const { question, spreadType, cards, topic } = body as {
      question?: string;
      spreadType?: string;
      cards?: ReadingCardInput[];
      topic?: string;
    };
    const topicKey = topic ?? "general";

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_cards" });
      return NextResponse.json({ error: "Invalid cards" }, { status: 400, headers: obsHeaders(obs) });
    }
    if (cards.length > 10) {
      endObs(obs, "validation_error", { status: 400, reason: "too_many_cards" });
      return NextResponse.json({ error: "Too many cards" }, { status: 400, headers: obsHeaders(obs) });
    }

    const spread = SPREADS[spreadType as SpreadType];
    if (!spread) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_spread" });
      return NextResponse.json({ error: "Invalid spread" }, { status: 400, headers: obsHeaders(obs) });
    }
    obs.spread = spreadType as string;
    obs.topic = normalizeTopic(topicKey);
    if (cards.length !== spread.cardCount) {
      endObs(obs, "validation_error", { status: 400, reason: "card_count_mismatch" });
      return NextResponse.json({ error: "Card count mismatch" }, { status: 400, headers: obsHeaders(obs) });
    }

    // Strict question length — do not silently truncate
    if (question !== undefined && typeof question !== "string") {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_question" });
      return NextResponse.json({ error: "Invalid question" }, { status: 400, headers: obsHeaders(obs) });
    }
    const rawQ = (question || "").trim();
    if (rawQ.length > LIMITS.questionMax) {
      endObs(obs, "validation_error", { status: 400, reason: "question_too_long" });
      return NextResponse.json({ error: `Question too long (max ${LIMITS.questionMax})` }, { status: 400, headers: obsHeaders(obs) });
    }
    const trimmedQuestion = rawQ;

    const cardIdSet = new Set(ALL_CARDS.map((c) => c.id));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardIdSet.has(c.cardId)) {
        endObs(obs, "validation_error", { status: 400, reason: "invalid_card_id" });
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400, headers: obsHeaders(obs) });
      }
      if (typeof c.reversed !== "boolean") {
        endObs(obs, "validation_error", { status: 400, reason: "invalid_card" });
        return NextResponse.json({ error: "Invalid card" }, { status: 400, headers: obsHeaders(obs) });
      }
      if (!isValidPositionLabel(c.positionLabel)) {
        endObs(obs, "validation_error", { status: 400, reason: "invalid_position" });
        return NextResponse.json({ error: "Invalid position" }, { status: 400, headers: obsHeaders(obs) });
      }
    }
    const seen = new Set<number>();
    for (const c of cards) {
      if (seen.has(c.cardId)) {
        endObs(obs, "validation_error", { status: 400, reason: "duplicate_card" });
        return NextResponse.json({ error: "Duplicate" }, { status: 400, headers: obsHeaders(obs) });
      }
      seen.add(c.cardId);
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

    // Single policy: limit BEFORE spend, fail-closed on DB errors.
    const rl = await checkRateLimitPolicy(supabase, "reading");
    if (!rl.allowed) {
      const limited = rl.reason === "exceeded";
      endObs(obs, limited ? "rate_limited" : "db_error", {
        status: limited ? 429 : 503,
        reason: limited ? "rate_limited" : "rate_limit_unavailable",
      });
      return NextResponse.json(
        { error: limited ? "Too many readings. Please try again shortly." : "Database busy, please retry" },
        { status: limited ? 429 : 503, headers: obsHeaders(obs) }
      );
    }

    // Authoritative spend via spend_for_spread (prevents cost tampering)
    const pSpread = SPREAD_TO_P_SPEND[spreadType as SpreadType];
    const { data: charged, error: spendErr } = await supabase.rpc("spend_for_spread", {
      p_spread: pSpread,
      p_description: `${spreadType} reading`,
    });
    if (spendErr) {
      const msg = (spendErr as { message?: string }).message || "";
      endObs(obs, "db_error", { status: 500, reason: "spend_failed", detail: msg.slice(0, 120) });
      if (msg.includes("Insufficient") || msg.includes("points")) {
        return NextResponse.json({ error: "Failed to process points" }, { status: 500, headers: obsHeaders(obs) });
      }
      return NextResponse.json({ error: "Failed to process points" }, { status: 500, headers: obsHeaders(obs) });
    }
    const cost = (charged as number) || 0;
    if (!cost || cost === 0) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      // Use dynamic cost from admin_settings if available, fallback to SPREADS default
      let needed = spread.cost;
      try {
        const { data: costRow } = await supabase.from("admin_settings").select("value").eq("key", "reading_costs").single();
        const dyn = (costRow?.value as Record<string, number> | null)?.[spreadType as string];
        if (typeof dyn === "number") needed = dyn;
      } catch {}
      endObs(obs, "validation_error", { status: 400, reason: "not_enough_points", needed, current: profile?.points || 0 });
      return NextResponse.json({ error: "Not enough points", needed, current: profile?.points || 0 }, { status: 400, headers: obsHeaders(obs) });
    }

    // Insert generating marker — allows exactly-once persistence + idempotent refund (guard Supabase hang)
    let genRow: { id: string } | null = null;
    let genErr: unknown = null;
    try {
      const res = await withTimeout(
        supabase
          .from("readings")
          .insert({
            user_id: user.id,
            spread_type: spreadType,
            cards,
            question: trimmedQuestion,
            interpretation: "__generating__",
            points_spent: cost,
          })
          .select("id")
          .single() as unknown as Promise<{ data: { id: string } | null; error: unknown }>,
        8000
      );
      genRow = res.data as { id: string } | null;
      genErr = res.error;
    } catch (e) {
      genErr = e;
    }
    if (genErr || !genRow) {
      try {
        await withTimeout(supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost }) as unknown as Promise<unknown>, 5000).catch(() => {});
      } catch {}
      const isTimeout = genErr instanceof Error && genErr.message === "DB_TIMEOUT";
      endObs(obs, isTimeout ? "timeout" : "db_error", {
        status: isTimeout ? 503 : 500,
        reason: "gen_row_failed",
        outcome2: "refunded",
        cost,
      });
      return NextResponse.json({ error: isTimeout ? "Database busy, please retry — points refunded" : "Failed to create reading" }, { status: isTimeout ? 503 : 500, headers: obsHeaders(obs) });
    }
    const readingId = genRow.id;

    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    const resolved = cards.map((c) => {
      const card = cardMap.get(c.cardId)!;
      return { name: card.name, nameTh: card.nameTh, position: c.positionLabel, reversed: c.reversed };
    });
    const userPrompt = buildReadingUserPrompt({ question: trimmedQuestion, spreadTh: spread.nameTh, cards: resolved });

    const params = AI_PARAMS.reading[spreadType as SpreadType] ?? AI_PARAMS.reading.three_card;

    const readingPrompt = getReadingSystemPrompt(spreadType as "single" | "three_card" | "celtic", topicKey);
    // Log prompt version without exposing content (for observability)
    logPromptVersion(obs, PROMPT_VERSION, { spread: spreadType, topic: normalizeTopic(topicKey) });

    // Circuit breaker (shared store): skip the AI call when Typhoon is
    // failing globally instead of adding retry load. Fail-open on RPC error.
    if (await isBreakerOpen(supabase, "reading")) {
      try {
        await supabase.rpc("refund_by_reading", { p_reading_id: readingId });
      } catch {
        try {
          await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
        } catch {}
      }
      try {
        await supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id);
      } catch {}
      endObs(obs, "breaker_open", { status: 503, reason: "ai_breaker_open", outcome2: "refunded", cost, readingId });
      return NextResponse.json({ error: "AI กำลังหนาแน่น กรุณาลองใหม่ในครู่ — แต้มคืนแล้ว" }, { status: 503, headers: obsHeaders(obs) });
    }

    type ReadingChunk = { choices: Array<{ delta?: { content?: string } }> };
    let handle: Awaited<ReturnType<typeof createAiStream<AsyncIterable<ReadingChunk>>>> | null = null;
    try {
      // Centralized pre-stream setup: client-abort forwarding + create
      // timeout + ONE safe retry (pre-stream only — see lib/ai.ts).
      handle = await createAiStream<AsyncIterable<ReadingChunk>>({
        create: (signal) =>
          getOpenAI().chat.completions.create(
            {
              model: AI_MODEL,
              messages: [
                { role: "system", content: readingPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              stream: true,
            },
            { timeout: params.timeoutMs, maxRetries: 0, signal } as unknown as Record<string, unknown>
          ) as unknown as Promise<AsyncIterable<ReadingChunk>>,
        requestSignal: request.signal,
        timeoutMs: params.timeoutMs,
        onRetry: (err, attempt) =>
          logObs(obs, "ai_retry", { attempt, spread: spreadType }),
      });
    } catch (err: unknown) {
      handle?.detach();
      await recordBreakerFailure(supabase, "reading");
      // Refund via reading id (idempotent) with fallback to amount-based
      try {
        await supabase.rpc("refund_by_reading", { p_reading_id: readingId });
      } catch {
        try {
          await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
        } catch {}
      }
      try {
        await supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id);
      } catch {}
      console.error("AI create failed", err);
      reportError(err, { requestId: obs.requestId, endpoint: "reading", readingId, cost });
      endObs(obs, "ai_error", { status: 502, reason: "ai_create_failed", outcome2: "refunded", cost, readingId });
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: 502, headers: obsHeaders(obs) });
    }

    if (!handle) {
      await recordBreakerFailure(supabase, "reading");
      try {
        await supabase.rpc("refund_by_reading", { p_reading_id: readingId });
      } catch {
        try {
          await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
        } catch {}
      }
      try {
        await supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id);
      } catch {}
      endObs(obs, "ai_error", { status: 502, reason: "no_stream", outcome2: "refunded", cost, readingId });
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: 502, headers: obsHeaders(obs) });
    }
    const stream = handle.stream;

    const encoder = new TextEncoder();
    let fullText = "";
    const clearFirstTokenGuard = armFirstTokenGuard(() => {
      try {
        handle?.abort();
      } catch {}
    }, params.firstTokenMs);
    let refundedOrDeleted = false;

    const readable = new ReadableStream({
      async start(controller) {
        let failed = false;
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              clearFirstTokenGuard();
              // Cap accumulation to DB limit (prevent CHECK violation)
              if (fullText.length < LIMITS.interpretationMax) {
                const remaining = LIMITS.interpretationMax - fullText.length;
                fullText += content.slice(0, remaining);
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearFirstTokenGuard();
          handle?.detach();

          // Persist final interpretation BEFORE sending [DONE] so it survives serverless termination.
          // CAS guard (Phase 1.1 deliverable): only overwrite the row while it
          // is still ours (__generating__). If the Phase 2 sweeper already
          // refunded+deleted it, the update matches 0 rows and we tell the
          // client the points were refunded instead of sending a dead [DONE].
          let casWon = false;
          if (!failed) {
            try {
              const finalText = fullText.trim().slice(0, LIMITS.interpretationMax);
              if (finalText) {
                const persisted = await withTimeout(
                  supabase.from("readings").update({ interpretation: finalText }).eq("id", readingId).eq("user_id", user.id).eq("interpretation", "__generating__").select("id") as unknown as Promise<{ data: { id: string }[] | null }>,
                  15000 // increased timeout for larger Celtic readings
                );
                casWon = Array.isArray(persisted?.data) && persisted.data.length > 0;
              } else {
                await withTimeout(supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id) as unknown as Promise<unknown>, 5000);
                try {
                  await withTimeout(supabase.rpc("refund_by_reading", { p_reading_id: readingId }) as unknown as Promise<unknown>, 5000);
                } catch {}
              }
            } catch (e) {
              console.error("Failed to persist reading", e);
              // Don't fail the stream if persist fails — client already has content
            }
          }

          if (!casWon && fullText.trim()) {
            // Sweeper won the race: points already refunded, row gone.
            endObs(obs, "refunded", { status: 200, reason: "cas_lost_to_sweeper", cost, readingId });
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "หมดเวลา กรุณาลองใหม่ — แต้มคืนแล้ว" })}\n\n`));
            } catch {}
            try {
              controller.error(new Error("CAS lost to sweeper"));
            } catch {}
            return;
          }

          endObs(obs, "ok", { status: 200, readingId, cost, chars: fullText.length });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ readingId })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          failed = true;
          clearFirstTokenGuard();
          handle?.detach();
          console.error("Streaming failed", err);
          await recordBreakerFailure(supabase, "reading");
          endObs(obs, "ai_error", { status: 502, reason: "stream_failed", outcome2: "refunded", cost, readingId });
          // Refund + delete generating row (exactly once)
          if (!refundedOrDeleted) {
            refundedOrDeleted = true;
            try {
              await withTimeout(supabase.rpc("refund_by_reading", { p_reading_id: readingId }) as unknown as Promise<unknown>, 5000).catch(() => {});
            } catch {
              try {
                await withTimeout(supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost }) as unknown as Promise<unknown>, 5000).catch(() => {});
              } catch {}
            }
            try {
              await withTimeout(supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id) as unknown as Promise<unknown>, 5000).catch(() => {});
            } catch {}
          }
          try {
            // Send error as SSE before closing so client can show refund message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" })}\n\n`));
          } catch {}
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
          return;
        }
      },
      cancel() {
        try {
          handle?.abort();
        } catch {}
        clearFirstTokenGuard();
        handle?.detach();
        // Best-effort refund on client disconnect before completion
        if (!refundedOrDeleted) {
          refundedOrDeleted = true;
          void (async () => {
            try {
              await withTimeout(supabase.rpc("refund_by_reading", { p_reading_id: readingId }) as unknown as Promise<unknown>, 5000).catch(() => {});
            } catch {
              try {
                await withTimeout(supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost }) as unknown as Promise<unknown>, 5000).catch(() => {});
              } catch {}
            }
            try {
              await withTimeout(supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id) as unknown as Promise<unknown>, 5000).catch(() => {});
            } catch {}
          })();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "x-request-id": obs.requestId,
      },
    });
  } catch (e: unknown) {
    reportError(e, { requestId: obs.requestId, endpoint: "reading" });
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}
