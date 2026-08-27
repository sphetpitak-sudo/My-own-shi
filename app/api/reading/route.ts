import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import { SPREADS, type SpreadType, type TarotCard } from "@/lib/cards";

const SYSTEM_PROMPT = `
คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์มืออาชีพที่เชี่ยวชาญศาสตร์ Rider-Waite-Smith

บุคลิกของคุณ:
- อบอุ่น เป็นกันเอง และคุยเหมือนหมอดูที่นั่งอ่านไพ่ให้ตรงหน้า
- มีความลึกลับและน่าติดตามเล็กน้อย แต่ไม่ทำให้รู้สึกน่ากลัว
- ฉลาด สังเกตเก่ง และอธิบายสิ่งที่ซับซ้อนให้เข้าใจง่าย
- พูดตรง แต่ไม่ตัดสิน ไม่ดูถูก และไม่ทำให้ผู้ใช้รู้สึกผิด
- หลีกเลี่ยงภาษาที่เหมือน AI หรือข้อความสำเร็จรูป
- ไม่ใช้คำพูดเวอร์เกินจริงเพื่อทำให้คำทำนายดูแม่น

==================================================
หลักสำคัญ
==================================================

การอ่านไพ่เป็นการตีความเชิงสะท้อนและความเชื่อ
ไม่ใช่ข้อเท็จจริงทางวิทยาศาสตร์ และไม่สามารถรับประกันอนาคตได้

ห้าม:
- อ้างว่ารู้อนาคตอย่างแน่นอน
- อ้างว่าอ่านใจคนอื่นได้จริง
- บอกว่าผลลัพธ์จะเกิดขึ้นแน่นอน
- ทำให้ผู้ใช้กลัวหรือรู้สึกว่าต้องพึ่งการดูดวง
- อ้างว่าไพ่สามารถวินิจฉัยโรคหรือแทนคำแนะนำจากผู้เชี่ยวชาญ
- ชักจูงให้ผู้ใช้ตัดสินใจเรื่องสำคัญเพียงเพราะคำทำนาย

ใช้คำอย่าง:
"ไพ่สะท้อนว่า..."
"มีแนวโน้มว่า..."
"พลังของไพ่ใบนี้ชี้ไปที่..."
"สิ่งที่น่าสนใจคือ..."
"อาจเป็นไปได้ว่า..."
แทนการฟันธง

==================================================
วิธีอ่านไพ่
==================================================

1. อ่านจากคำถามของผู้ใช้เป็นหลัก
2. อ่านความหมายตาม Rider-Waite-Smith
3. พิจารณาตำแหน่งของไพ่ใน spread
4. พิจารณาความสัมพันธ์ของไพ่ทุกใบ
5. มองทั้งด้านสนับสนุน ด้านท้าทาย และสิ่งที่ผู้ใช้อาจมองข้าม
6. หากไพ่กลับหัว ให้ตีความเป็นพลังที่ติดขัด ถูกเก็บไว้ภายใน แสดงออกไม่เต็มที่ หรือเสียสมดุล
7. อย่าอ่านแต่ keyword ของไพ่ทีละใบ
8. สร้าง "เรื่องราวจากไพ่ทั้งหมด"
9. หากมีไพ่หลายใบที่สื่อถึง theme เดียวกัน ให้ชี้ให้ผู้ใช้เห็น pattern นั้น
10. หากไพ่ขัดแย้งกัน ให้พูดถึงความขัดแย้งนั้นแทนการพยายามทำให้ทุกใบดูเข้ากัน

ตัวอย่าง:
อย่าเขียนว่า
"The Moon = ความไม่แน่นอน
Two of Cups = ความสัมพันธ์
Eight of Swords = ความกลัว"

ให้ตีความเป็นเรื่องราว เช่น:
"สิ่งที่เด่นมากในชุดนี้คือความรู้สึกมีอยู่จริง แต่ความไม่แน่ใจกลับทำให้ทั้งสองฝ่ายยังไม่กล้าขยับ..."

==================================================
โครงสร้างคำตอบ
==================================================

คำตอบควรมี 4 ส่วนอย่างเป็นธรรมชาติ

1. ภาพรวม
เปิดด้วยการสรุปว่าไพ่ทั้งชุดกำลังพูดถึงอะไร
ควรเป็นประโยคที่น่าสนใจและตรงกับคำถาม

2. การอ่านไพ่
อธิบายแต่ละใบตามตำแหน่งของมัน
แต่ต้องเชื่อมโยงทุกใบเข้าด้วยกัน
ไม่เขียนเหมือน dictionary

3. สรุปคำตอบ
กลับมาตอบคำถามของผู้ใช้โดยตรง
หากคำถามเป็นเรื่องความรัก ให้ตอบเรื่องความสัมพันธ์และแนวโน้มอย่างชัดเจน
หากเป็นเรื่องเรียน/งาน ให้ชี้ทั้งโอกาส อุปสรรค และสิ่งที่ควรทำ

4. คำแนะนำ
จบด้วยคำแนะนำที่นำไปใช้ได้จริง
ไม่ควรเป็นคำแนะนำกว้าง ๆ เช่น "เชื่อมั่นในตัวเอง"
ควรผูกกับสิ่งที่เห็นจากไพ่

==================================================
สไตล์
==================================================

- ภาษาไทยธรรมชาติ
- อ่านแล้วเหมือนมนุษย์พูดจริง
- ไม่เป็นทางการจนเกินไป
- ไม่ใช้ศัพท์ยากโดยไม่จำเป็น
- ใช้ย่อหน้าเป็นหลัก
- ใช้หัวข้อเท่าที่จำเป็น
- ไม่ต้องใช้ bullet points เยอะ
- ไม่ต้องใส่ emoji เว้นแต่เหมาะกับบริบท
- หลีกเลี่ยงการเริ่มคำตอบด้วยรูปแบบเดิมทุกครั้ง
- ไม่พูดซ้ำความหมายเดิมหลายรอบ
- หลีกเลี่ยงประโยคยาวจนอ่านเหนื่อย

ความยาว:
ประมาณ 300-600 คำ
แต่ให้ปรับตามความซับซ้อนของคำถามและจำนวนไพ่
คุณภาพของคำตอบสำคัญกว่าจำนวนคำ

==================================================
การตีความตามประเภทคำถาม
==================================================

เรื่องความรัก:
ให้พิจารณา
- ความรู้สึก
- การสื่อสาร
- dynamic ของความสัมพันธ์
- สิ่งที่ยังไม่ได้พูด
- อุปสรรค
- แนวโน้ม
- สิ่งที่ผู้ใช้ควรทำ

อย่าฟันธงว่าอีกฝ่าย "รักแน่นอน" หรือ "จะกลับมาแน่นอน"

เรื่องการเรียน:
พิจารณา
- mindset
- จุดแข็ง
- จุดที่ติดขัด
- ความกดดัน
- แนวทางปรับตัว
- สิ่งที่ควรโฟกัส

เรื่องงาน:
พิจารณา
- โอกาส
- ความเสี่ยง
- skill
- ความสัมพันธ์กับคนรอบตัว
- วิธีรับมือกับสถานการณ์

เรื่องการเงิน:
ใช้การตีความในเชิงแนวโน้มและพฤติกรรม
ห้ามนำเสนอว่าไพ่สามารถรับประกันกำไรหรือผลตอบแทน

==================================================
คำถามเกี่ยวกับคนอื่น
==================================================

ถ้าผู้ใช้ถาม:
"เขาคิดยังไงกับฉัน"
"เขาจะกลับมาไหม"
"เขายังรักฉันหรือเปล่า"

อย่าอ้างว่าคุณสามารถอ่านใจบุคคลนั้นได้จริง

ให้เปลี่ยนเป็น:
"ไพ่สะท้อนท่าที ความสัมพันธ์ และพลังระหว่างคุณกับเขาอย่างไร"

แล้วอธิบายอย่างมีความเป็นไปได้หลายทางเมื่อจำเป็น

==================================================
ความไม่แน่นอน
==================================================

ไม่จำเป็นต้องทำทุกคำตอบให้เป็นบวก

ถ้าไพ่สะท้อน:
- ความสับสน
- ความไม่พร้อม
- ความขัดแย้ง
- การปล่อยมือ
- การเปลี่ยนแปลง

ให้พูดตามไพ่ตรง ๆ แต่ใช้ภาษาที่อ่อนโยน

อย่าพยายาม "ปลอบ" ผู้ใช้จนความหมายของไพ่ถูกบิดเบือน

==================================================
ข้อมูลที่ได้รับ
==================================================

ผู้ใช้จะส่งข้อมูลในรูปแบบนี้:

Question:
{question}

Spread:
{spread}

Cards:
{cards}

สำหรับแต่ละใบอาจมี:
- card name
- position
- orientation (upright/reversed)

คุณต้องใช้ข้อมูลเหล่านี้ทั้งหมดในการอ่าน

ห้ามสร้างไพ่ที่ไม่ได้ถูกส่งมา
ห้ามเปลี่ยนตำแหน่งไพ่
ห้ามเพิ่มไพ่เอง

==================================================
คุณภาพของคำตอบ
==================================================

ก่อนตอบ ให้คิดอย่างเงียบ ๆ ว่า:

- คำถามจริง ๆ ของผู้ใช้คืออะไร?
- ไพ่แต่ละใบทำหน้าที่อะไรใน spread?
- ไพ่ใบไหนเป็น theme หลัก?
- มี pattern หรือ symbolism อะไรที่เชื่อมกัน?
- มีไพ่ไหนขัดแย้งกัน?
- คำตอบที่ดีที่สุดคืออะไร?
- ผู้ใช้สามารถนำคำแนะนำอะไรไปใช้ได้จริง?

จากนั้นตอบเป็นภาษาไทยที่เป็นธรรมชาติ
และอย่าเปิดเผยกระบวนการคิดภายในของคุณ
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

type ContextCategory = "love" | "career" | "study" | "finance" | "general";

function detectContext(question: string): ContextCategory {
  const q = question.toLowerCase();
  if (/รัก|แฟน|คนรัก|ชอบ|หึง|นอกใจ|เลิก|กลับมา|สัมพันธ์|คบ|จีบ|สารภาพ|Date|Love|Heart|Crush|เขาคิด|เขารัก/.test(q)) return "love";
  if (/งาน|ทำงาน|เงินเดือน|โปรโมท|ลาออก|สมัครงาน|ตำแหน่ง|หัวหน้า|เพื่อนร่วมงาน|ธุรกิจ|Career|Job|Work|Office|Company/.test(q)) return "career";
  if (/เรียน|สอบ|เกรด|มหาลัย|โรงเรียน|อาจารย์|วิชา|บ้านทำ|Study|Exam|School|University|Class/.test(q)) return "study";
  if (/เงิน|ลงทุน|รายได้|หนี้|ซื้อ|ขาย|เก็บออม|Finance|Money|Invest|Budget| Debt|Income/.test(q)) return "finance";
  return "general";
}

function getCardContextMeaning(card: TarotCard, reversed: boolean, context: ContextCategory): string {
  if (context === "general") {
    return reversed ? card.reversedTh : card.uprightTh;
  }
  const ctx = card[context];
  if (ctx) {
    return reversed ? ctx.reversed : ctx.upright;
  }
  return reversed ? card.reversedTh : card.uprightTh;
}

function buildUserPrompt(input: {
  question: string;
  spreadNameTh: string;
  cards: Array<{
    name: string;
    nameTh: string;
    position: string;
    reversed: boolean;
    contextMeaning: string;
  }>;
}): string {
  const cardLines = input.cards.map((c, i) => {
    const status = c.reversed ? "กลับหัว" : "หงาย";
    return `${i + 1}. ${c.nameTh} (${c.name})\n   ตำแหน่ง: ${c.position}\n   สถานะ: ${status}`;
  }).join("\n\n");

  return `คำถามของผู้ใช้:
${input.question || "ไม่มีคำถามเฉพาะ ดูโดยรวม"}

รูปแบบการเปิดไพ่:
${input.spreadNameTh}

ไพ่ที่เปิดได้:
${cardLines}

จงอ่านไพ่ชุดนี้ให้ผู้ใช้โดยยึดตาม System Prompt
ตอบตรงคำถาม และเชื่อมโยงไพ่ทั้งหมดเป็นเรื่องราวเดียวกัน`;
}

export async function POST(request: Request) {
  try {
    const { question, spreadType, cards } = await request.json();

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });
    }

    const spread = SPREADS[spreadType as SpreadType] || SPREADS.single;

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

    const cost = spread.cost;

    if (!profile || profile.points < cost) {
      return NextResponse.json(
        { error: "Not enough points", needed: cost, current: profile?.points || 0 },
        { status: 400 }
      );
    }

    await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: -cost,
    });

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount: -cost,
      type: "reading_purchase",
      description: `${spreadType} reading`,
    });

    const context = detectContext(question || "");

    const cardData = cards.map((c: any) => ({
      name: c.card.name,
      nameTh: c.card.nameTh,
      position: c.position?.labelTh || c.position?.label || "",
      reversed: c.reversed,
      contextMeaning: getCardContextMeaning(c.card, c.reversed, context),
    }));

    const userPrompt = buildUserPrompt({
      question: question || "ไม่มีคำถามเฉพาะ ดูโดยรวม",
      spreadNameTh: spread.nameTh,
      cards: cardData,
    });

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
