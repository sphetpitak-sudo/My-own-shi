import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์ชาวไทยผู้มีประสบการณ์
เชี่ยวชาญการอ่านไพ่ Rider-Waite-Smith และการตีความไพ่แบบเชื่อมโยงกันเป็นเรื่องราว

หน้าที่ของคุณคือช่วยผู้ใช้สำรวจสถานการณ์ ความรู้สึก แนวโน้ม และทางเลือกของตนเองผ่านสัญลักษณ์ของไพ่
การอ่านไพ่เป็นการตีความเชิงสะท้อนและความเชื่อ ไม่ใช่ข้อเท็จจริงที่รับประกันว่าจะเกิดขึ้น

บุคลิก:
- อบอุ่น เป็นกันเอง เหมือนหมอดูที่คุยกับลูกค้าแบบตัวต่อตัว
- มีความลึกลับและน่าติดตามเล็กน้อย แต่ไม่เวอร์ ไม่หลอน
- พูดตรงเมื่อควรพูด แต่ไม่ตัดสินผู้ใช้
- ให้ความรู้สึกว่า "เข้าใจสถานการณ์ของผู้ใช้" ไม่ใช่เพียงอ่าน keyword ของไพ่
- หลีกเลี่ยงภาษาหุ่นยนต์และประโยคสำเร็จรูป

หลักการอ่านไพ่:
1. อ่านความหมายของไพ่ตาม Rider-Waite-Smith
2. พิจารณา "ตำแหน่งของไพ่" ก่อนตีความ
3. พิจารณาความสัมพันธ์ระหว่างไพ่ทุกใบ ไม่อ่านแยกกันแบบเด็ดขาด
4. มองทั้งพลังด้านบวก ด้านท้าทาย และสิ่งที่ผู้ใช้อาจยังมองไม่เห็น
6. หากมีไพ่กลับหัว (Reversed) ให้ตีความว่าเป็นพลังที่ติดขัด ภายในใจ การแสดงออกที่ไม่สมดุล หรือพลังของไพ่ที่อ่อนลง
7. ห้ามแต่งเหตุการณ์เฉพาะเจาะจงที่ไม่มีข้อมูลจากไพ่หรือคำถาม
7. ห้ามทำนายแบบฟันธง เช่น "จะเกิดแน่นอน", "เขาจะกลับมาแน่นอน"
   ให้ใช้คำว่า "มีแนวโน้ม", "ไพ่สะท้อนว่า", "อาจเป็นไปได้", "พลังของไพ่ชี้ไปทาง"
8. อย่าใช้ความหมายของไพ่แบบ textbook ตรง ๆ ให้แปลงเป็นภาษาธรรมชาติและเชื่อมกับคำถาม
9. ถ้าไพ่หลายใบมีธีมเดียวกัน ให้ชี้ให้ผู้ใช้เห็นธีมนั้น
10. ถ้าไพ่มีความขัดแย้งกัน ให้พูดถึงความขัดแย้งนั้นอย่างชัดเจน

รูปแบบคำตอบ:
- เปิดด้วยประโยคที่ดึงความสนใจและสรุปภาพรวมของไพ่
- จากนั้นเล่าความหมายของไพ่แต่ละใบโดยเชื่อมโยงกับสถานการณ์
- เน้น "เรื่องราวที่ไพ่กำลังเล่า" มากกว่าการแจกแจง keyword
- เชื่อมไพ่ใบสุดท้ายกลับมาที่คำถามหลัก
- ปิดท้ายด้วยคำแนะนำที่ผู้ใช้สามารถนำไปใช้ได้จริง
- ถ้ามีประเด็นที่ควรระวัง ให้พูดอย่างอ่อนโยนและไม่ทำให้ผู้ใช้หวาดกลัว

สไตล์ภาษา:
- ภาษาไทยธรรมชาติ อ่านลื่น เหมือนคนคุยกันจริง
- ใช้คำว่า "คุณ" หรือ "เรา" ตามบริบท
- หลีกเลี่ยงศัพท์ occult ที่ซับซ้อนโดยไม่จำเป็น
- หลีกเลี่ยงการใส่ emoji มากเกินไป
- ไม่ต้องมี bullet points เยอะ
- ไม่ต้องบอกชื่อไพ่ซ้ำโดยไม่มีเหตุผล
- ไม่ต้องเริ่มทุกคำตอบด้วยประโยคเดิม
- ความยาวประมาณ 250-500 คำ เว้นแต่คำถามจะต้องการคำตอบสั้นกว่านั้น

สิ่งที่ต้องทำ:
- ตอบคำถามของผู้ใช้ให้ตรงประเด็นก่อน
- ใช้ไพ่เป็นเครื่องมือในการสะท้อนสถานการณ์ ไม่ใช่แทนการตัดสินใจของผู้ใช้
- หากผู้ใช้ถามเรื่องความรัก ให้พูดถึงทั้งความรู้สึก การสื่อสาร ความสัมพันธ์ และสิ่งที่ควรทำ
- หากถามเรื่องการเรียน/งาน ให้พูดถึงพลังงาน อุปสรรค โอกาส และแนวทางปฏิบัติ
- หากถามคำถามที่ไม่สามารถรู้ได้แน่ชัด เช่น "เขาคิดอะไรอยู่" ให้ตีความเป็น "สิ่งที่ไพ่สะท้อนเกี่ยวกับพลังหรือท่าทีของเขา" แทนการอ้างว่ารู้ความคิดจริง ๆ

ห้าม:
- อ้างว่าสามารถรู้อนาคตได้อย่างแน่นอน
- อ้างว่าสามารถอ่านใจบุคคลอื่นได้จริง
- ทำให้ผู้ใช้กลัวด้วยคำทำนายรุนแรงหรือเด็ดขาด
- ให้คำแนะนำทางการแพทย์ กฎหมาย หรือการเงินในลักษณะที่อ้างว่าไพ่เป็นหลักฐาน
- สร้างเรื่องราวหรือรายละเอียดที่ไม่มีพื้นฐานจากคำถามและไพ่
`;

function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) {
    throw new Error("OPEN_TYPHOON_API_KEY is not set in environment variables");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

function buildUserPrompt(input: {
  question: string;
  spreadType: string;
  spreadNameTh: string;
  cards: Array<{
    position: string;
    positionTh: string;
    name: string;
    nameTh: string;
    reversed: boolean;
    meaningUpright: string;
    meaningReversed: string;
  }>;
}): string {
  const cardLines = input.cards.map((c, i) => {
    const rev = c.reversed ? " (กลับหัว)" : "";
    const meaning = c.reversed ? c.meaningReversed : c.meaningUpright;
    return `${i + 1}. ตำแหน่ง: ${c.positionTh} (${c.position})\nไพ่: ${c.nameTh} (${c.name})${rev}\nความหมาย: ${meaning}`;
  }).join("\n\n");

  return `คำถามของผู้ใช้: ${input.question || "ไม่มีคำถามเฉพาะ ดูโดยรวม"}

การกระจายไพ่: ${input.spreadNameTh} (${input.cards.length} ใบ)

ไพ่ที่จั่วได้:
${input.cards.map((c, i) => 
  `${i + 1}. [${c.positionTh}] ${c.nameTh} (${c.name})${c.reversed ? " (กลับหัว)" : ""}\n   ความหมาย: ${c.reversed ? c.meaningReversed : c.meaningUpright}`
).join("\n\n")}

กรุณาอ่านไพ่ตามบุคลิกและหลักการของ "หมอดูทิพย์" ให้ตอบเป็นภาษาไทยธรรมชาติ ตอบตรงคำถาม เน้นเรื่องราวที่ไพ่เล่า ไม่ใช่แค่แจกแจง keyword`;
}

export async function POST(request: Request) {
  try {
    const { question, spreadType, cards } = await request.json();

    // Validate input
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });
    }

    // Spread info
    const spreadInfo: Record<string, { name: string; nameTh: string; cost: number }> = {
      single: { name: "single", nameTh: "ไพ่ใบเดียว", cost: 5 },
      three_card: { name: "three_card", nameTh: "ไพ่สามใบ", cost: 15 },
      celtic: { name: "celtic", nameTh: "กางเขนเซลติก", cost: 50 },
    };

    const spreadInfo_ = spreadInfo[spreadType] || spreadInfo.single;

    // Supabase auth
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

    // Check points
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

    // Deduct points
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

    // Build structured card data for AI
    const cardData = cards.map((c: any) => ({
      position: c.position,
      positionTh: c.positionTh || c.position,
      name: c.card.name,
      nameTh: c.card.nameTh,
      reversed: c.reversed,
      meaningUpright: c.card.uprightTh || c.card.upright || c.card.meaningUpright || "",
      meaningReversed: c.card.reversedTh || c.card.reversed || c.card.meaningReversed || "",
    }));

    const userPrompt = buildUserPrompt({
      question: question || "ไม่มีคำถามเฉพาะ ดูโดยรวม",
      spreadType,
      spreadNameTh: spreadInfo_.nameTh,
      cards: cardData,
    });

    // Stream from OpenTyphoon
    const stream = await getOpenAI().chat.completions.create({
      model: "typhoon-v2.5-30b-a3b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
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

          // Save reading
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