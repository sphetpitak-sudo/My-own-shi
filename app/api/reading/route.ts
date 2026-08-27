import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_TYPHOON_API_KEY,
  baseURL: "https://api.opentyphoon.ai/v1",
});

const SYSTEM_PROMPT = `คุณเป็นนักอ่านไพ่ทาโรต์ผู้มีประสบการณ์ชื่อ "หมอดูทิพย์"
คุณเชี่ยวชาญการทำนายไพ่ทาโรต์แบบ Rider-Waite
คุณอ่านไพ่เป็นภาษาไทยอย่างเป็นธรรมชาติ มีความลึกซึ้ง และให้คำแนะนำที่เป็นประโยชน์

กฎการอ่านไพ่:
- วิเคราะห์ไพ่แต่ละใบตามตำแหน่งที่จั่วได้
- พิจารณาว่าไพ่กลับหัวหรือไม่ (กลับหัวมีความหมายต่างกัน)
- เชื่อมโยงความหมายของไพ่แต่ละใบเข้าด้วยกัน
- ตอบคำถามของผู้ใช้โดยตรง
- ให้คำแนะนำเชิงบวกแต่จริงใจ
- ใช้ภาษาที่เข้าใจง่าย ไม่ซับซ้อนเกินไป
- ความยาวประมาณ 200-400 คำ
- เน้นการเล่าเรื่อง ไม่ต้องมี bullet points มาก`;

export async function POST(request: Request) {
  try {
    const { cards, question, spreadType } = await request.json();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("cookie") || "";
            return cookieHeader.split(";").filter(c => c.trim()).map(c => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            });
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    const costs: Record<string, number> = { single: 5, three_card: 15, celtic: 50 };
    const cost = costs[spreadType] || 5;

    if (!profile || profile.points < cost) {
      return NextResponse.json(
        { error: "Not enough points", needed: cost, current: profile?.points || 0 },
        { status: 400 }
      );
    }

    await supabase
      .from("profiles")
      .update({ points: profile.points - cost })
      .eq("id", user.id);

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount: -cost,
      type: "reading_purchase",
      description: `${spreadType} reading`,
    });

    const cardDescriptions = cards.map((c: any, i: number) => {
      const pos = c.position || `Card ${i + 1}`;
      const rev = c.reversed ? " (กลับหัว)" : "";
      const meaning = c.reversed
        ? (c.card.reversedTh || c.card.reversed || c.card.meaningReversed || "")
        : (c.card.uprightTh || c.card.upright || c.card.meaningUpright || "");
      return `${pos}: ${c.card.nameTh || c.card.name} (${c.card.name})${rev} - ${meaning}`;
    }).join("\n\n");

    const userPrompt = `คำถาม: ${question || "ไม่มีคำถามเฉพาะ ดูโดยรวม"}\n\nไพ่ที่จั่วได้:\n${cardDescriptions}\n\nกรุณาทำนายและให้คำแนะนำ`;

    const stream = await openai.chat.completions.create({
      model: "typhoon-v2.5-30b-a3b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();

          await supabase.from("readings").insert({
            user_id: user.id,
            spread_type: spreadType,
            cards: cards,
            question: question || "",
            interpretation: fullText,
            points_spent: cost,
          });
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Reading error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate reading" },
      { status: 500 }
    );
  }
}
