import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";
import { getOpenAI, AI_MODEL, AI_PARAMS, LIMITS, isValidPositionLabel } from "@/lib/ai";
import { FOLLOWUP_SYSTEM_PROMPT, buildFollowupUserPrompt } from "@/lib/prompts";

type FollowCard = { cardId: number; positionLabel: string; reversed: boolean };

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
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
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing followQuestion" }, { status: 400 });
    }
    const trimmedQ = followQuestion.trim();
    if (trimmedQ.length > LIMITS.followQuestionMax) {
      return NextResponse.json({ error: `Question too long (max ${LIMITS.followQuestionMax})` }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!readingId || !isUUID(readingId)) return NextResponse.json({ error: "Missing or invalid readingId" }, { status: 400 });
    const effectiveReadingId = readingId;

    // Verify ownership and fetch authoritative reading (never trust client-supplied interpretation/cards)
    const { data: reading, error: readErr } = await supabase
      .from("readings")
      .select("id, user_id, cards, spread_type, question, interpretation")
      .eq("id", readingId)
      .single();
    if (readErr || !reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    if (reading.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Do not allow followup on generating placeholder
    if ((reading.interpretation as string) === "__generating__") {
      return NextResponse.json({ error: "Reading not ready" }, { status: 409 });
    }

    // Verify client cards match stored reading if provided (tamper detection)
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const stored = (reading.cards as unknown as FollowCard[]) || [];
      const storedIds = new Set(stored.map((c) => c.cardId));
      const reqIds = new Set(cards.map((c) => c.cardId));
      if (storedIds.size !== reqIds.size || [...storedIds].some((id) => !reqIds.has(id))) {
        return NextResponse.json({ error: "Cards do not match reading" }, { status: 400 });
      }
      if (spreadType && spreadType !== reading.spread_type) {
        return NextResponse.json({ error: "Spread mismatch" }, { status: 400 });
      }
    }

    // Enforce 2 followup limit server-side (reservation prevents cost amplification)
    const { count: followCount } = await supabase.from("reading_followups").select("id", { count: "exact", head: true }).eq("reading_id", readingId);
    if ((followCount ?? 0) >= 2) {
      return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429 });
    }

    // Effective cards: always use stored reading cards (authoritative) — ignore client-supplied cards content except for tamper check above
    const effectiveCards: FollowCard[] = (reading.cards as unknown as FollowCard[]) || [];
    if (!Array.isArray(effectiveCards) || effectiveCards.length === 0) return NextResponse.json({ error: "Invalid reading cards" }, { status: 400 });
    // Validate stored cards charset/length (defense if old data was polluted)
    for (const c of effectiveCards) {
      if (!isValidPositionLabel(c.positionLabel)) return NextResponse.json({ error: "Invalid position in stored reading" }, { status: 400 });
    }

    // If client supplied cards with valid spread but different length, already rejected; still verify count
    const expectedSpread = SPREADS[reading.spread_type as SpreadType];
    if (expectedSpread && effectiveCards.length !== expectedSpread.cardCount) {
      return NextResponse.json({ error: "Stored card count mismatch" }, { status: 400 });
    }

    // Atomic rate limit
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "followup", p_limit: 5, p_window_seconds: 60 });
    if (rateOk === false) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Reserve slot before AI (prevents parallel burst)
    const { data: pending, error: pendingErr } = await supabase
      .from("reading_followups")
      .insert({ reading_id: effectiveReadingId, user_id: user.id, question: trimmedQ, answer: "__generating__" })
      .select("id")
      .single();
    if (pendingErr) {
      if (pendingErr.message && pendingErr.message.includes("Followup limit")) {
        return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429 });
      }
      return NextResponse.json({ error: "Failed to reserve followup" }, { status: 429 });
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

    // Forward client disconnect to AI
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
    }, AI_PARAMS.followup.timeoutMs);

    const stream = await getOpenAI()
      .chat.completions.create(
        {
          model: AI_MODEL,
          messages: [
            { role: "system", content: FOLLOWUP_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: AI_PARAMS.followup.temperature,
          max_tokens: AI_PARAMS.followup.max_tokens,
          stream: true,
        },
        { maxRetries: 0, signal: abortController.signal } as unknown as Record<string, unknown>
      )
      .catch(() => null);

    if (!stream) {
      clearTimeout(timeoutId);
      if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
      try {
        await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id);
      } catch {}
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    let fullAnswer = "";
    let deleted = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as unknown as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }> }>) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              if (fullAnswer.length < 2000) fullAnswer += content.slice(0, 2000 - fullAnswer.length);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          try {
            await supabase.from("reading_followups").update({ answer: fullAnswer.slice(0, 2000) }).eq("id", pendingId).eq("user_id", user.id);
          } catch (e) {
            console.error("Failed to persist followup", e);
            try {
              await supabase.from("reading_followups").delete().eq("id", pendingId);
            } catch {}
          }
        } catch {
          clearTimeout(timeoutId);
          if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
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
          abortController.abort();
        } catch {}
        clearTimeout(timeoutId);
        if (request.signal) request.signal.removeEventListener("abort", onClientAbort);
        if (!deleted) {
          deleted = true;
          supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id).then(() => {}, () => {});
        }
      },
    });
    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
