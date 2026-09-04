import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALL_CARDS } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS, createAiStream, armFirstTokenGuard, isBreakerOpen, recordBreakerFailure } from "@/lib/ai";
import { ORACLE_SYSTEM_PROMPT, buildOracleUserPrompt } from "@/lib/prompts";
import { startObs, setObsUser, endObs, logObs, obsHeaders } from "@/lib/observability";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

interface OracleCardInput {
  cardId: number;
  reversed: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), ms))]);
}

export async function POST(request: Request) {
  const obs = startObs("oracle", request);
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
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: obsHeaders(obs) });
    }

    const { question, cards } = body as {
      question?: string;
      cards?: OracleCardInput[];
    };

    if (!cards || !Array.isArray(cards) || cards.length === 0 || cards.length > 3) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_cards" });
      return NextResponse.json({ error: "Invalid cards data" }, { status: 400, headers: obsHeaders(obs) });
    }

    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardMap.has(c.cardId)) {
        endObs(obs, "validation_error", { status: 400, reason: "invalid_card_id" });
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400, headers: obsHeaders(obs) });
      }
      if (typeof c.reversed !== "boolean") {
        endObs(obs, "validation_error", { status: 400, reason: "invalid_card" });
        return NextResponse.json({ error: "Invalid card data" }, { status: 400, headers: obsHeaders(obs) });
      }
    }

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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      endObs(obs, "unauthorized", { status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: obsHeaders(obs) });
    }
    setObsUser(obs, user.id);

    // Serverless-safe rate limit for oracle (5 elaborations / 60s) — guard DB hang
    try {
      const rateOk = await withTimeout(
        supabase.rpc("check_rate_limit", { p_endpoint: "oracle", p_limit: 5, p_window_seconds: 60 }) as unknown as Promise<{ data: boolean }>,
        5000
      ).then((r) => (r as unknown as { data: boolean }).data);
      if (rateOk === false) {
        endObs(obs, "rate_limited", { status: 429 });
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: obsHeaders(obs) });
      }
    } catch {
      // DB busy — allow through but log; rate limit is best-effort
      console.error("oracle rate limit DB timeout");
    }

    // Verify payment — also validate amount matches spread (prevents 5pt ticket for 15pt elaboration)
    const expectedCost = cards.length === 1 ? 5 : 15;
    let recentTx: { id: string; amount: number }[] | null = null;
    let count: number | null = null;
    try {
      const res = await withTimeout(
        supabase
          .from("point_transactions")
          .select("id, amount", { count: "exact" })
          .eq("user_id", user.id)
          .eq("type", "reading_purchase")
          .ilike("description", "oracle:%")
          .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString()) as unknown as Promise<{ data: { id: string; amount: number }[] | null; count: number | null }>,
        8000
      );
      recentTx = (res as { data: { id: string; amount: number }[] | null }).data;
      count = (res as { count: number | null }).count;
    } catch (e) {
      console.error("oracle payment check timeout", e);
      endObs(obs, "timeout", { status: 503, reason: "payment_check_timeout" });
      return NextResponse.json({ error: "Database busy, please retry" }, { status: 503, headers: obsHeaders(obs) });
    }

    if ((count ?? 0) < 1) {
      endObs(obs, "validation_error", { status: 403, reason: "no_oracle_purchase" });
      return NextResponse.json({ error: "Please open an oracle reading first" }, { status: 403, headers: obsHeaders(obs) });
    }
    const hasValidCost = (recentTx || []).some((r) => r.amount === -expectedCost);
    if (!hasValidCost) {
      endObs(obs, "validation_error", { status: 403, reason: "invalid_purchase_amount" });
      return NextResponse.json({ error: "Invalid oracle purchase amount" }, { status: 403, headers: obsHeaders(obs) });
    }
    if ((count ?? 0) >= 5) {
      endObs(obs, "rate_limited", { status: 429, reason: "too_many_oracle" });
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: obsHeaders(obs) });
    }

    const resolved = cards.map((c) => {
      const card = cardMap.get(c.cardId)!;
      return {
        name: card.name,
        nameTh: card.nameTh,
        status: c.reversed ? "กลับหัว" : "หงาย",
        meaning: c.reversed ? card.reversedTh : card.uprightTh,
      };
    });

    const userPrompt = buildOracleUserPrompt({ question: trimmedQuestion, cards: resolved });

    const params = cards.length === 1 ? AI_PARAMS.oracle.single : AI_PARAMS.oracle.three;

    // Refund helper (Phase 1 fix): oracle spends client-side BEFORE calling
    // this route, and the old failure paths told the user "แต้มคืนแล้ว"
    // without calling any refund RPC. refund_points is safe here: it requires
    // a recent matching reading_purchase (verified above) and guards
    // double-refund internally.
    const refundOracle = async () => {
      try {
        await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: expectedCost });
      } catch {}
    };

    // Circuit breaker (shared store): skip the AI call when failing globally.
    if (await isBreakerOpen(supabase, "oracle")) {
      await refundOracle();
      endObs(obs, "breaker_open", { status: 503, reason: "ai_breaker_open", outcome2: "refunded", cost: expectedCost });
      return NextResponse.json({ error: "AI กำลังหนาแน่น กรุณาลองใหม่ในครู่ — แต้มคืนแล้ว" }, { status: 503, headers: obsHeaders(obs) });
    }

    type OracleChunk = { choices: Array<{ delta?: { content?: string }; finish_reason?: string | null }> };
    let handle: Awaited<ReturnType<typeof createAiStream<AsyncIterable<OracleChunk>>>> | null = null;
    try {
      handle = await createAiStream<AsyncIterable<OracleChunk>>({
        create: (signal) =>
          getOpenAI().chat.completions.create(
            {
              model: AI_MODEL,
              messages: [
                { role: "system", content: ORACLE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              stream: true,
            },
            { timeout: params.timeoutMs, maxRetries: 0, signal } as unknown as Record<string, unknown>
          ) as unknown as Promise<AsyncIterable<OracleChunk>>,
        requestSignal: request.signal,
        timeoutMs: params.timeoutMs,
        onRetry: (err, attempt) => logObs(obs, "ai_retry", { attempt }),
      });
    } catch (err) {
      handle?.detach();
      await recordBreakerFailure(supabase, "oracle");
      await refundOracle();
      console.error("oracle AI create failed", err);
      const isTimeout = err instanceof Error && (err.message === "AI_CREATE_TIMEOUT" || err.name === "AbortError");
      endObs(obs, isTimeout ? "timeout" : "ai_error", { status: isTimeout ? 504 : 502, reason: "ai_create_failed", outcome2: "refunded", cost: expectedCost });
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: isTimeout ? 504 : 502, headers: obsHeaders(obs) });
    }

    if (!handle) {
      await recordBreakerFailure(supabase, "oracle");
      await refundOracle();
      endObs(obs, "ai_error", { status: 502, reason: "no_stream", outcome2: "refunded", cost: expectedCost });
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: 502, headers: obsHeaders(obs) });
    }
    const stream = handle.stream;

    const encoder = new TextEncoder();
    const clearFirstTokenGuard = armFirstTokenGuard(() => {
      try {
        handle?.abort();
      } catch {}
    }, params.firstTokenMs);
    let truncatedByLength = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const choice = chunk.choices[0] as { delta?: { content?: string }; finish_reason?: string | null };
            if (choice?.finish_reason === "length") {
              truncatedByLength = true;
              console.warn("oracle truncated by length", { cards: cards.length, max_tokens: params.max_tokens });
            }
            const content = choice?.delta?.content || "";
            if (content) {
              clearFirstTokenGuard();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearFirstTokenGuard();
          handle?.detach();
          if (truncatedByLength) {
            // Send truncation notice — client will show but keep content (no refund)
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ warning: "truncated" })}\n\n`));
            } catch {}
          }
          endObs(obs, "ok", { status: 200, cards: cards.length, truncated: truncatedByLength });
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          clearFirstTokenGuard();
          handle?.detach();
          console.error("oracle streaming failed", err);
          await recordBreakerFailure(supabase, "oracle");
          await refundOracle();
          endObs(obs, "ai_error", { status: 502, reason: "stream_failed", outcome2: "refunded", cost: expectedCost });
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" })}\n\n`));
          } catch {}
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
        }
      },
      cancel() {
        try {
          handle?.abort();
        } catch {}
        clearFirstTokenGuard();
        handle?.detach();
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate oracle reading";
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: message }, { status: 500, headers: obsHeaders(obs) });
  }
}
