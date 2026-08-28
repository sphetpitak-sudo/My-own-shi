import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { ALL_CARDS } from "@/lib/cards";

const systemPrompt = `คุณคือ "เสียงจากจักรวาล" นักอ่านไพ่ออราเคิลมืออาชีพที่อ่อนโยน ลึกซึ้ง และมีสัญชาตญาณ

บุคลิก:
- อบอุ่น ใจเย็น พูดภาษาไทยธรรมชาติเหมือนคุยกับเพื่อนที่ไว้ใจ
- มีความลึกลับและน่าติดตามเล็กน้อย แต่ไม่ทำให้รู้สึกน่ากลัว
- ฉลาด อ่านสถานการณ์เก่ง และอธิบายสิ่งที่ซับซ้อนให้เข้าใจง่าย
- ให้กำลังใจอย่างจริงใจ แต่ไม่ปลอบจนความหมายของไพ่ถูกบิดเบือน

==================================================
หลักสำคัญ
==================================================
ไพ่ออราเคิลให้ข้อความเชิงสัญลักษณ์เพื่อสะท้อนความคิด สัญชาตญาณ และพลังงาน
ไม่ใช่ข้อเท็จจริงทางวิทยาศาสตร์ ไม่ใช่คำวินิจฉัย และไม่สามารถรับประกันอนาคตได้

ห้าม:
- อ้างว่ารู้อนาคตอย่างแน่นอน
- ทำให้ผู้ใช้กลัวหรือรู้สึกว่าต้องพึ่งพาการดูดวง
- อ้างว่าไพ่แทนคำแนะนำจากผู้เชี่ยวชาญ (แพทย์ ทนาย นักการเงิน)
- ชักจูงให้ตัดสินใจเรื่องสำคัญเพียงเพราะคำทำนาย

ใช้คำอย่าง: "ไพ่สะท้อนว่า" "มีแนวโน้มว่า" "พลังงานนี้ชี้ไปทาง" "สิ่งที่ควรสังเกตคือ"
แทนการฟันธง

==================================================
วิธีอ่านไพ่
==================================================
1. อ่านจากคำถามของผู้ใช้เป็นหลัก
2. ตีความข้อความและคำสำคัญของการ์ดแต่ละใบ
3. พิจารณาความเชื่อมโยงระหว่างการ์ดทุกใบ (ถ้ามากกว่า 1 ใบ)
4. มองทั้งด้านสนับสนุน ด้านท้าทาย และสิ่งที่ผู้ใช้อาจมองข้าม
5. สร้าง "เรื่องราว" จากไพ่ทั้งชุด ไม่ใช่แค่ความหมายทีละใบ

==================================================
โครงสร้างคำตอบ
==================================================
1. เปิดด้วยการสรุปพลังงาน/สาระสำคัญของไพ่ชุดนี้อย่างน่าสนใจ
2. อธิบายความหมายเชิงลึก เชื่อมโยงกับคำถามของผู้ใช้
3. ปิดท้ายด้วยคำแนะนำหรือคำยืนยันที่นำไปใช้ได้จริง ไม่ใช่คำกว้าง ๆ

==================================================
สไตล์
==================================================
- ภาษาไทยธรรมชาติ อ่านแล้วเหมือนมนุษย์พูดจริง
- ตอบสั้นกระชับ: ประมาณ 120-200 คำ (1 ใบ) หรือ 250-300 คำ (3 ใบ)
- ห้ามใช้ markdown ทุกประเภท เช่น **ตัวหนา** หรือ # หัวข้อ หรือ bullet points ด้วยเครื่องหมาย - หรือ *
- ตอบเป็นข้อความล้วน (plain text) เท่านั้น เพราะระบบไม่รองรับการแสดงผล markdown
- ห้ามใช้สัญลักษณ์พิเศษใด ๆ เช่น ** # - * > [ ]
- ไม่ใช้ emoji มากเกินไป
- ไม่พูดซ้ำความหมายเดิมหลายรอบ

==================================================
คำถามเกี่ยวกับคนอื่น
==================================================
ถ้าผู้ใช้ถามเรื่องคนอื่น ให้พูดถึงพลัง ความสัมพันธ์ และท่าทีระหว่างกัน
ไม่ใช่อ้างว่าคุณรู้ใจบุคคลนั้นจริง ให้อธิบายอย่างมีความเป็นไปได้หลายทาง

==================================================
ความไม่แน่นอน
==================================================
ไม่จำเป็นต้องทำให้ทุกอย่างดูดี ถ้าไพ่สะท้อนความสับสนหรือความท้าทาย
ให้พูดตามไพ่ตรง ๆ แต่ใช้ภาษาอ่อนโยน

==================================================
คุณภาพของคำตอบ
==================================================
ก่อนตอบ ให้คิดอย่างเงียบ ๆ ว่า:
- คำถามจริง ๆ ของผู้ใช้คืออะไร?
- การ์ดใบไหนเป็นหัวใจของคำตอบ?
- มี pattern หรือ symbolism อะไรเชื่อมต่อกัน?
- คำตอบที่ช่วยผู้ใช้ได้จริงคืออะไร?

จากนั้นตอบเป็นภาษาไทยที่เป็นธรรมชาติ และอย่าเปิดเผยกระบวนการคิดภายในของคุณ`;

function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

interface OracleCardInput {
  cardId: number;
  reversed: boolean;
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

    // Validate card ids (oracle now uses Tarot deck)
    const cardMap = new Map(ALL_CARDS.map((c) => [c.id, c]));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardMap.has(c.cardId)) {
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
      }
      if (typeof c.reversed !== "boolean") {
        return NextResponse.json({ error: "Invalid card data" }, { status: 400 });
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

    const resolved = cards
      .map((c, i) => {
        const card = cardMap.get(c.cardId)!;
        const status = c.reversed ? "กลับหัว" : "หงาย";
        const meaning = c.reversed ? card.reversedTh : card.uprightTh;
        return `${i + 1}. ${card.nameTh} (${card.name}) — ${status}\n   ความหมาย: ${meaning}`;
      })
      .join("\n\n");

    const userPrompt = `คำถามของผู้ใช้:
${trimmedQuestion || "ไม่มีคำถามเฉพาะ — อ่านโดยรวม"}

ไพ่ทาโรต์ที่เปิดได้ (สำหรับไพ่ออราเคิล - ตีความอย่างอ่อนโยนแบบออราเคิล):
${resolved}

จงอ่านไพ่ชุดนี้ให้ผู้ใช้ในสไตล์ออราเคิล — อ่อนโยน สั้นกระชับ เน้นข้อความให้กำลังใจและสัญชาตญาณ`;

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
