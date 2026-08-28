import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ORACLE_CARDS } from "@/lib/oracle";

const systemPrompt = `คุณคือ "เสียงจากจักรวาล" นักอ่านไพ่ออราเคิลที่อ่อนโยนและลึกซึ้ง

บุคลิก:
- อบอุ่น ใจเย็น และพูดเหมือนคนคุยกับเพื่อนที่ไว้ใจ
- ใช้ภาษาธรรมชาติ ไม่เหมือน AI หรือข้อความสำเร็จรูป
- ให้กำลังใจ แต่ไม่สร้างความหวังเกินจริง
- ไม่ฟันธงอนาคต ไม่ทำให้กลัว ไม่บังคับให้เชื่อ

หลักสำคัญ:
- ไพ่ออราเคิลให้ข้อความเชิงสัญลักษณ์เพื่อสะท้อนความคิดและสัญชาตญาณ
- ไม่ใช่ข้อเท็จจริงทางวิทยาศาสตร์ ไม่ใช่คำวินิจฉัย และไม่รับประกันผลลัพธ์
- ถ้าผู้ใช้ถามเรื่องคนอื่น ให้พูดถึงพลังและความสัมพันธ์ ไม่ใช่อ้างว่ารู้ใจใคร

สไตล์:
- ตอบสั้นกระชับ นุ่มนวล ใช้ภาษาไทยธรรมชาติ
- ไม่ใช้ markdown, ไม่ใช้ bullet, ไม่ใช้ emoji มากเกินไป
- ตอบประมาณ 120-200 คำ
- ถ้ามีการ์ดมากกว่า 1 ใบ ให้เชื่อมโยงการ์ดทั้งหมดเป็นเรื่องเดียวกัน

ข้อมูลการ์ดที่เปิดได้:
- ชื่อการ์ด
- คำสำคัญ
- ข้อความหลัก (message)
- คำยืนยัน (affirmation)

จงอ่านให้ผู้ใช้ฟังอย่างลึกซึ้ง เชื่อมโยงกับคำถามของเขา และปิดท้ายด้วยประโยคที่ให้กำลังใจ`;

function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

interface OracleCardInput {
  id: number;
}

export async function POST(request: Request) {
  try {
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

    // Validate card ids
    const idSet = new Set(ORACLE_CARDS.map((c) => c.id));
    for (const c of cards) {
      if (typeof c.id !== "number" || !idSet.has(c.id)) {
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
      }
    }

    const trimmedQuestion = (question || "").trim().slice(0, 500);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user paid for an oracle reading recently (prevents free AI abuse)
    const { count } = await supabase
      .from("point_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "reading_purchase")
      .ilike("description", "oracle:%")
      .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString());

    if ((count ?? 0) < 1) {
      return NextResponse.json({ error: "Please open an oracle reading first" }, { status: 403 });
    }

    // Rate limit AI elaboration (max 5 within the purchase window)
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }

    const resolved = cards.map((c) => {
      const card = ORACLE_CARDS.find((o) => o.id === c.id)!;
      return `- ${card.nameTh} (${card.keywordTh})\n  ข้อความ: ${card.messageTh}\n  คำยืนยัน: ${card.affirmationTh}`;
    }).join("\n\n");

    const userPrompt = `คำถามของผู้ใช้:
${trimmedQuestion || "ไม่มีคำถามเฉพาะ — อ่านโดยรวม"}

ไพ่ออราเคิลที่เปิดได้:
${resolved}

จงอ่านไพ่ชุดนี้ให้ผู้ใช้อย่างอ่อนโยนและลึกซึ้ง`;

    const stream = await getOpenAI()
      .chat.completions.create(
        {
          model: "typhoon-v2.5-30b-a3b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 700,
          stream: true,
        },
        { timeout: 60_000, maxRetries: 0 }
      )
      .catch(() => null);

    if (!stream) {
      return NextResponse.json({ error: "AI generation unavailable. Try again shortly." }, { status: 502 });
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch {
          try {
            controller.error(new Error("Streaming failed"));
          } catch {
            // already closed
          }
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate oracle reading";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
