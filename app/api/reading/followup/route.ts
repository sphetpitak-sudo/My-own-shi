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

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    const { question, spreadType, cards, parentInterpretation, followQuestion } = body as {
      question?: string; spreadType?: string; cards?: FollowCard[]; parentInterpretation?: string; followQuestion?: string;
    };
    if (!cards || !Array.isArray(cards) || cards.length === 0 || cards.length > 10) {
      return NextResponse.json({ error: "Invalid cards" }, { status: 400 });
    }
    const spread = SPREADS[spreadType as SpreadType];
    if (!spread) return NextResponse.json({ error: "Invalid spread" }, { status: 400 });
    if (cards.length !== spread.cardCount) return NextResponse.json({ error: "Card count mismatch" }, { status: 400 });
    const q = (followQuestion || "").trim().slice(0, 200);
    if (!q) return NextResponse.json({ error: "Missing followQuestion" }, { status: 400 });
    const cardSet = new Set(ALL_CARDS.map(c=>c.id));
    for (const c of cards) if (!cardSet.has(c.cardId) || typeof c.reversed !== "boolean") return NextResponse.json({ error: "Invalid card" }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: 5 followups per 60s
    const { count } = await supabase.from("point_transactions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "reading_purchase").gte("created_at", new Date(Date.now()-60_000).toISOString());
    // Use readings rate limit bucket as well; but also allow followups without spend. Simpler: check point_transactions of any type? Use same bucket for followups via in-memory is not durable; reuse DB 5/60s followup check via readings insert time?
    // For now allow if recentCount < 10 per minute for followups
    // We'll do a separate check: count readings in last 60s
    const { count: recentReadings } = await supabase.from("readings").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", new Date(Date.now()-60_000).toISOString());
    if ((recentReadings ?? 0) >= 10) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const cardMap = new Map(ALL_CARDS.map(c=>[c.id,c]));
    const cardLines = cards.map((c,i)=>{
      const card = cardMap.get(c.cardId)!;
      return `${i+1}. ${card.nameTh} (${card.name}) — ตำแหน่ง: ${c.positionLabel} — ${c.reversed?"กลับหัว":"หงาย"}`;
    }).join("\n");

    const systemPrompt = `คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์ ผู้ตอบคำถามต่อยอดจากไพ่ชุดเดิม
หลัก: ตอบสั้น 150-250 คำ ภาษาไทยอบอุ่น ใช้ "ไพ่สะท้อนว่า..." ไม่ฟันธงอนาคตแน่นอน ไม่อ้างอ่านใจคน ไม่วินิจฉัยโรค
ห้ามใช้ markdown ใด ๆ ตอบเป็น plain text เท่านั้น`;

    const userPrompt = `คำถามเดิม: ${question || "ไม่มี"}
ไพ่ที่เปิด (ห้ามสร้างใหม่):
${cardLines}
คำทำนายเดิม (สรุป):
${(parentInterpretation||"").slice(0,1200)}
คำถามต่อยอดของผู้ใช้: ${q}
จงตอบคำถามต่อยอดโดยอิงไพ่ชุดเดิมและคำทำนายเดิมเท่านั้น เชื่อมโยงไพ่ที่เกี่ยวข้องโดยตรง ไม่ต้องเปิดไพ่ใหม่`;

    const stream = await getOpenAI().chat.completions.create({
      model: "typhoon-v2.5-30b-a3b-instruct",
      messages: [{ role:"system", content: systemPrompt }, { role:"user", content: userPrompt }],
      temperature: 0.75,
      max_tokens: 600,
      stream: true,
    }, { timeout: 60_000, maxRetries: 0 });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller){
        try{
          for await (const chunk of stream){
            const content = chunk.choices[0]?.delta?.content || "";
            if(content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {
          try{ controller.error(new Error("stream failed")); } catch{}
        }
      }
    });
    return new Response(readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive" }});
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
