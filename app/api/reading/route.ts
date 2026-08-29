import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS, isValidPositionLabel } from "@/lib/ai";
import { READING_SYSTEM_PROMPT, buildReadingUserPrompt } from "@/lib/prompts";

type ReadingCardInput = { cardId: number; positionLabel: string; reversed: boolean };

const SPREAD_TO_P_SPEND: Record<SpreadType, string> = {
  single: "single",
  three_card: "three_card",
  celtic: "celtic",
};

export async function POST(request: Request) {
  try {
    // Guard oversized payload before JSON parse (DoS)
    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > 8000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { question, spreadType, cards } = body as {
      question?: string;
      spreadType?: string;
      cards?: ReadingCardInput[];
    };

    if (!cards || !Array.isArray(cards) || cards.length === 0) return NextResponse.json({ error: "Invalid cards" }, { status: 400 });
    if (cards.length > 10) return NextResponse.json({ error: "Too many cards" }, { status: 400 });

    const spread = SPREADS[spreadType as SpreadType];
    if (!spread) return NextResponse.json({ error: "Invalid spread" }, { status: 400 });
    if (cards.length !== spread.cardCount) return NextResponse.json({ error: "Card count mismatch" }, { status: 400 });

    // Strict question length — do not silently truncate
    if (question !== undefined && typeof question !== "string") return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    const rawQ = (question || "").trim();
    if (rawQ.length > LIMITS.questionMax) return NextResponse.json({ error: `Question too long (max ${LIMITS.questionMax})` }, { status: 400 });
    const trimmedQuestion = rawQ;

    const cardIdSet = new Set(ALL_CARDS.map((c) => c.id));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardIdSet.has(c.cardId)) return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
      if (typeof c.reversed !== "boolean") return NextResponse.json({ error: "Invalid card" }, { status: 400 });
      if (!isValidPositionLabel(c.positionLabel)) return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }
    const seen = new Set<number>();
    for (const c of cards) {
      if (seen.has(c.cardId)) return NextResponse.json({ error: "Duplicate" }, { status: 400 });
      seen.add(c.cardId);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Atomic rate limit (serverless-safe)
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "reading", p_limit: 5, p_window_seconds: 60 });
    if (rateOk === false) return NextResponse.json({ error: "Too many readings. Please try again shortly." }, { status: 429 });

    // Authoritative spend via spend_for_spread (prevents cost tampering)
    const pSpread = SPREAD_TO_P_SPEND[spreadType as SpreadType];
    const { data: charged, error: spendErr } = await supabase.rpc("spend_for_spread", {
      p_spread: pSpread,
      p_description: `${spreadType} reading`,
    });
    if (spendErr) {
      const msg = (spendErr as { message?: string }).message || "";
      if (msg.includes("Insufficient") || msg.includes("points")) {
        return NextResponse.json({ error: "Failed to process points" }, { status: 500 });
      }
      return NextResponse.json({ error: "Failed to process points" }, { status: 500 });
    }
    const cost = (charged as number) || 0;
    if (!cost || cost === 0) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      return NextResponse.json({ error: "Not enough points", needed: spread.cost, current: profile?.points || 0 }, { status: 400 });
    }

    // Insert generating marker — allows exactly-once persistence + idempotent refund
    const { data: genRow, error: genErr } = await supabase
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
      .single();
    if (genErr || !genRow) {
      try {
        await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
      } catch {}
      return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
    }
    const readingId = (genRow as { id: string }).id;

    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    const resolved = cards.map((c) => {
      const card = cardMap.get(c.cardId)!;
      return { name: card.name, nameTh: card.nameTh, position: c.positionLabel, reversed: c.reversed };
    });
    const userPrompt = buildReadingUserPrompt({ question: trimmedQuestion, spreadTh: spread.nameTh, cards: resolved });

    const params = AI_PARAMS.reading[spreadType as SpreadType] ?? AI_PARAMS.reading.three_card;

    // Timeout coherence: single signal with client disconnect + SDK timeout
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
      const s = await getOpenAI().chat.completions.create(
        {
          model: AI_MODEL,
          messages: [
            { role: "system", content: READING_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          stream: true,
        },
        { maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
      );
      stream = s as unknown as typeof stream;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
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
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: 502 });
    }

    if (!stream) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
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
      return NextResponse.json({ error: "AI ไม่ตอบสนอง กรุณาลองใหม่ — แต้มคืนแล้ว" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    let fullText = "";
    let firstTokenTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      try {
        abortController.abort();
      } catch {}
    }, params.firstTokenMs);
    let refundedOrDeleted = false;

    const readable = new ReadableStream({
      async start(controller) {
        let failed = false;
        try {
          for await (const chunk of stream as unknown as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              if (firstTokenTimeout) {
                clearTimeout(firstTokenTimeout);
                firstTokenTimeout = null;
              }
              // Cap accumulation to DB limit (prevent CHECK violation)
              if (fullText.length < LIMITS.interpretationMax) {
                const remaining = LIMITS.interpretationMax - fullText.length;
                fullText += content.slice(0, remaining);
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ readingId })}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {
          failed = true;
          if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          // Refund + delete generating row (exactly once)
          if (!refundedOrDeleted) {
            refundedOrDeleted = true;
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
          }
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
          return;
        }
        if (!failed) {
          // Persist final interpretation exactly once via update
          try {
            const finalText = fullText.trim().slice(0, LIMITS.interpretationMax);
            if (finalText) {
              await supabase.from("readings").update({ interpretation: finalText }).eq("id", readingId).eq("user_id", user.id);
            } else {
              await supabase.from("readings").delete().eq("id", readingId).eq("user_id", user.id);
              try {
                await supabase.rpc("refund_by_reading", { p_reading_id: readingId });
              } catch {}
            }
          } catch (e) {
            console.error("Failed to persist reading", e);
          }
        }
      },
      cancel() {
        try {
          abortController.abort();
        } catch {}
        if (firstTokenTimeout) clearTimeout(firstTokenTimeout);
        clearTimeout(timeoutId);
        if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
        // Best-effort refund on client disconnect before completion
        if (!refundedOrDeleted) {
          refundedOrDeleted = true;
          void (async () => {
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
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
