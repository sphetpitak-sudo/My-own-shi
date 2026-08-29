import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";

function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.opentyphoon.ai/v1" });
}

type FollowCard = { cardId: number; positionLabel: string; reversed: boolean };

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { question, spreadType, cards, parentInterpretation, followQuestion, readingId } = body as {
      question?: string;
      spreadType?: string;
      cards?: FollowCard[];
      parentInterpretation?: string;
      followQuestion?: string;
      readingId?: string;
    };

    // Validate followQuestion length strictly (do not silently slice)
    if (typeof followQuestion !== "string" || !followQuestion.trim()) {
      return NextResponse.json({ error: "Missing followQuestion" }, { status: 400 });
    }
    const trimmedQ = followQuestion.trim();
    if (trimmedQ.length > 200) {
      return NextResponse.json({ error: "Question too long (max 200)" }, { status: 400 });
    }
    if (followQuestion.length > 200) {
      return NextResponse.json({ error: "Question too long (max 200)" }, { status: 400 });
    }

    // Validate readingId if provided — required for ownership enforcement
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!readingId || !isUUID(readingId)) return NextResponse.json({ error: "Missing or invalid readingId" }, { status: 400 });
    const effectiveReadingId = readingId;
    // Verify ownership and fetch reading
    const { data: reading, error: readErr } = await supabase.from("readings").select("id, user_id, cards, spread_type, question").eq("id", readingId).single();
    if (readErr || !reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    if (reading.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Verify cards match stored reading (prevent tampering)
    if (cards && Array.isArray(cards)) {
      const stored = reading.cards as unknown as FollowCard[];
      const storedIds = new Set((stored || []).map((c) => (c as FollowCard).cardId));
      const reqIds = new Set(cards.map((c) => c.cardId));
      if (storedIds.size !== reqIds.size || [...storedIds].some((id) => !reqIds.has(id))) {
        return NextResponse.json({ error: "Cards do not match reading" }, { status: 400 });
      }
      if (spreadType && spreadType !== reading.spread_type) {
        return NextResponse.json({ error: "Spread mismatch" }, { status: 400 });
      }
    }
    // Enforce 2 followup limit server-side (with reservation before AI to prevent cost amplification)
    const { count: followCount } = await supabase.from("reading_followups").select("id", { count: "exact", head: true }).eq("reading_id", readingId);
    if ((followCount ?? 0) >= 2) {
      return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429 });
    }

    // Determine effective cards: use provided if valid, else use stored reading cards
    let effectiveCards: FollowCard[];
    if (cards && Array.isArray(cards) && cards.length > 0) {
      // Validate provided cards
      if (cards.length > 10) return NextResponse.json({ error: "Invalid cards" }, { status: 400 });
      const spread = SPREADS[spreadType as SpreadType] || SPREADS[reading.spread_type as SpreadType];
      if (spread && cards.length !== spread.cardCount) return NextResponse.json({ error: "Card count mismatch" }, { status: 400 });
      const cardSet = new Set(ALL_CARDS.map((c) => c.id));
      for (const c of cards) {
        if (!cardSet.has(c.cardId) || typeof c.reversed !== "boolean" || typeof c.positionLabel !== "string" || c.positionLabel.length > 50 || c.positionLabel.length === 0) {
          return NextResponse.json({ error: "Invalid card" }, { status: 400 });
        }
        if (typeof c.positionLabel === "string" && c.positionLabel.length > 50) return NextResponse.json({ error: "Invalid position" }, { status: 400 });
      }
      effectiveCards = cards;
    } else {
      effectiveCards = reading.cards as unknown as FollowCard[];
      if (!Array.isArray(effectiveCards) || effectiveCards.length === 0) return NextResponse.json({ error: "Invalid reading cards" }, { status: 400 });
      for (const c of effectiveCards as FollowCard[]) {
        if (typeof (c as FollowCard).positionLabel === "string" && (c as FollowCard).positionLabel.length > 50) {
          return NextResponse.json({ error: "Invalid position" }, { status: 400 });
        }
      }
    }

    // Atomic rate limit (serverless-safe) — 5 followups / 60s
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "followup", p_limit: 5, p_window_seconds: 60 });
    if (rateOk === false) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    // Reserve slot before AI (prevents 10 parallel AI for 2 slots)
    const { data: pending, error: pendingErr } = await supabase.from("reading_followups").insert({ reading_id: effectiveReadingId, user_id: user.id, question: trimmedQ, answer: "__generating__" }).select("id").single();
    if (pendingErr) {
      // Check if due to limit trigger
      if (pendingErr.message && pendingErr.message.includes("Followup limit")) {
        return NextResponse.json({ error: "Followup limit reached (max 2)" }, { status: 429 });
      }
      return NextResponse.json({ error: "Failed to reserve followup" }, { status: 429 });
    }
    const pendingId = (pending as { id: string }).id;
    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    const cardLines = effectiveCards.map((c, i) => {
      const card = cardMap.get(c.cardId)!;
      return `${i + 1}. ${card.nameTh} (${card.name}) — ตำแหน่ง: ${c.positionLabel} — ${c.reversed ? "กลับหัว" : "หงาย"}`;
    }).join("\n");

    const systemPrompt = `คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์ ผู้ตอบคำถามต่อยอดจากไพ่ชุดเดิม
หลัก: ตอบสั้น 150-250 คำ ภาษาไทยอบอุ่น ใช้ "ไพ่สะท้อนว่า..." ไม่ฟันธงอนาคตแน่นอน ไม่อ้างอ่านใจคน ไม่วินิจฉัยโรค
ห้ามใช้ markdown ใด ๆ ตอบเป็น plain text เท่านั้น`;

    const userPrompt = `คำถามเดิม: ${question || "ไม่มี"}
ไพ่ที่เปิด (ห้ามสร้างใหม่):
${cardLines}
คำทำนายเดิม (สรุป):
${(parentInterpretation || "").slice(0, 1200)}
คำถามต่อยอดของผู้ใช้: ${trimmedQ}
จงตอบคำถามต่อยอดโดยอิงไพ่ชุดเดิมและคำทำนายเดิมเท่านั้น เชื่อมโยงไพ่ที่เกี่ยวข้องโดยตรง ไม่ต้องเปิดไพ่ใหม่`;

    const stream = await getOpenAI()
      .chat.completions.create(
        {
          model: "typhoon-v2.5-30b-a3b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.75,
          max_tokens: 600,
          stream: true,
        },
        { timeout: 60_000, maxRetries: 0 }
      )
      .catch(() => null);

    if (!stream) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    let fullAnswer = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullAnswer += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

          // Update pending reservation with final answer
          try {
            await supabase.from("reading_followups").update({ answer: fullAnswer.slice(0, 2000) }).eq("id", pendingId).eq("user_id", user.id);
          } catch (e) {
            console.error("Failed to persist followup", e);
            try { await supabase.from("reading_followups").delete().eq("id", pendingId); } catch {}
          }
        } catch {
          // AI/stream failed — release reservation
          try { await supabase.from("reading_followups").delete().eq("id", pendingId).eq("user_id", user.id); } catch {}
          try {
            controller.error(new Error("stream failed"));
          } catch {}
        }
      },
    });
    return new Response(readable, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
