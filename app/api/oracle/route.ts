import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALL_CARDS } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS } from "@/lib/ai";
import { ORACLE_SYSTEM_PROMPT, buildOracleUserPrompt } from "@/lib/prompts";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface OracleCardInput {
  cardId: number;
  reversed: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), ms))]);
}

export async function POST(request: Request) {
  try {
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 8000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { question, cards } = body as {
      question?: string;
      cards?: OracleCardInput[];
    };

    if (!cards || !Array.isArray(cards) || cards.length === 0 || cards.length > 3) {
      return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });
    }

    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardMap.has(c.cardId)) {
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
      }
      if (typeof c.reversed !== "boolean") {
        return NextResponse.json({ error: "Invalid card data" }, { status: 400 });
      }
    }

    if (question !== undefined && typeof question !== "string") {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }
    const rawQ = (question || "").trim();
    if (rawQ.length > LIMITS.questionMax) {
      return NextResponse.json({ error: `Question too long (max ${LIMITS.questionMax})` }, { status: 400 });
    }
    const trimmedQuestion = rawQ;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Serverless-safe rate limit for oracle (5 elaborations / 60s) — guard DB hang
    try {
      const rateOk = await withTimeout(
        supabase.rpc("check_rate_limit", { p_endpoint: "oracle", p_limit: 5, p_window_seconds: 60 }) as unknown as Promise<{ data: boolean }>,
        5000
      ).then((r) => (r as unknown as { data: boolean }).data);
      if (rateOk === false) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
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
      return NextResponse.json({ error: "Database busy, please retry" }, { status: 503 });
    }

    if ((count ?? 0) < 1) {
      return NextResponse.json({ error: "Please open an oracle reading first" }, { status: 403 });
    }
    const hasValidCost = (recentTx || []).some((r) => r.amount === -expectedCost);
    if (!hasValidCost) {
      return NextResponse.json({ error: "Invalid oracle purchase amount" }, { status: 403 });
    }
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
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

    const abortController = new AbortController();
    const onClientAbort = () => {
      try {
        abortController.abort();
      } catch {}
    };
    if (request.signal) {
      if (request.signal.aborted) abortController.abort();
      else request.signal.addEventListener("abort", onClientAbort, { once: true });
    }
    const timeoutId = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, params.timeoutMs);

    let stream: Awaited<ReturnType<typeof getOpenAI extends () => infer R ? R extends { chat: { completions: { create: (...a: unknown[]) => Promise<infer S> } } } ? () => Promise<S> : never : never>> | null = null;
    try {
      const createPromise = getOpenAI().chat.completions.create(
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
        { timeout: params.timeoutMs, maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
      );
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI_CREATE_TIMEOUT")), params.timeoutMs + 3000));
      const s = await Promise.race([createPromise, timeoutPromise]);
      stream = s as unknown as typeof stream;
    } catch (err) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      console.error("oracle AI create failed", err);
      const isTimeout = err instanceof Error && (err.message === "AI_CREATE_TIMEOUT" || err.name === "AbortError");
      return NextResponse.json({ error: isTimeout ? "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" : "AI generation unavailable. Try again shortly." }, { status: isTimeout ? 504 : 502 });
    }

    if (!stream) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      return NextResponse.json({ error: "AI generation unavailable. Try again shortly." }, { status: 502 });
    }

    const encoder = new TextEncoder();
    let firstTokenTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, params.firstTokenMs);
    let truncatedByLength = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as unknown as AsyncIterable<{ choices: Array<{ delta?: { content?: string }; finish_reason?: string | null }> }>) {
            const choice = chunk.choices[0] as { delta?: { content?: string }; finish_reason?: string | null };
            if (choice?.finish_reason === "length") {
              truncatedByLength = true;
              console.warn("oracle truncated by length", { cards: cards.length, max_tokens: params.max_tokens });
            }
            const content = choice?.delta?.content || "";
            if (content) {
              if (firstTokenTimeout) {
                clearTimeout(firstTokenTimeout);
                firstTokenTimeout = null;
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          if (firstTokenTimeout) {
            clearTimeout(firstTokenTimeout);
            firstTokenTimeout = null;
          }
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          if (truncatedByLength) {
            // Send truncation notice — client will show but keep content (no refund)
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ warning: "truncated" })}\n\n`));
            } catch {}
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          console.error("oracle streaming failed", err);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มจะคืนให้" })}\n\n`));
          } catch {}
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
        }
      },
      cancel() {
        try {
          abortController.abort();
        } catch {}
        if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
        clearTimeout(timeoutId);
        if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate oracle reading";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
