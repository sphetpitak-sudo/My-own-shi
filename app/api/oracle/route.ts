import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALL_CARDS } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS } from "@/lib/ai";
import { ORACLE_SYSTEM_PROMPT, buildOracleUserPrompt } from "@/lib/prompts";

interface OracleCardInput {
  cardId: number;
  reversed: boolean;
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

    // Serverless-safe rate limit for oracle (5 elaborations / 60s)
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "oracle", p_limit: 5, p_window_seconds: 60 });
    if (rateOk === false) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    // Verify payment — also validate amount matches spread (prevents 5pt ticket for 15pt elaboration)
    const expectedCost = cards.length === 1 ? 5 : 15;
    const { data: recentTx, count } = await supabase
      .from("point_transactions")
      .select("id, amount", { count: "exact" })
      .eq("user_id", user.id)
      .eq("type", "reading_purchase")
      .ilike("description", "oracle:%")
      .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString());

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
    }, AI_PARAMS.oracle.timeoutMs);

    const stream = await getOpenAI()
      .chat.completions.create(
        {
          model: AI_MODEL,
          messages: [
            { role: "system", content: ORACLE_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: AI_PARAMS.oracle.temperature,
          max_tokens: AI_PARAMS.oracle.max_tokens,
          stream: true,
        },
        { maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
      )
      .catch(() => null);

    if (!stream) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      return NextResponse.json({ error: "AI generation unavailable. Try again shortly." }, { status: 502 });
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as unknown as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
        }
      },
      cancel() {
        try {
          abortController.abort();
        } catch {}
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
