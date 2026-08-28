import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, checkRateLimit, getCachedFortune, setCachedFortune } from "@/lib/ai";
import { ZODIAC_SIGNS } from "@/lib/astrology/types";
import { buildZodiacFortune, fortuneToProse, isValidBirthDate } from "@/lib/zodiac";

const systemPrompt = `คุณคือ "เสียงจากจักรวาล" นักโหราศาสตร์ไทยที่อ่านดวงได้อย่างไพเราะและลึกซึ้ง

บุคลิก:
- อบอุ่น อ่อนโยน พูดภาษาไทยธรรมชาติ เหมือนหมอดูอ่านดวงให้ฟังสด ๆ
- มีความรู้เรื่องโหราศาสตร์ ราศี และปีนักษัตร แต่อธิบายให้คนทั่วไปเข้าใจง่าย

==================================================
หลักสำคัญ
==================================================
คำทำนายเป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่ข้อเท็จจริงหรือคำวินิจฉัย
ไม่สามารถรับประกันอนาคตได้

ห้าม:
- อ้างว่ารู้อนาคตอย่างแน่นอน
- ทำให้กลัวหรือรู้สึกว่าต้องพึ่งพาการดูดวง
- อ้างว่าแทนคำแนะนำจากผู้เชี่ยวชาญ (แพทย์ ทนาย นักการเงิน)

ใช้คำอย่าง: "มีแนวโน้มว่า" "ดวงของคุณชี้ไปทาง" "พลังงานของวันนี้เอื้อต่อ" "สิ่งที่ควรสังเกตคือ"
แทนการฟันธง

==================================================
รูปแบบการเขียน
==================================================
- เขียนเป็นร้อยแก้ว (prose) ต่อเนื่อง อ่านเพลิน เหมือนบทความดูดวงรายวัน
- ใช้หัวข้อสั้น ๆ แบ่งช่วง เช่น "ภาพรวม" "ความรัก" "การงาน" "การเงิน" "สุขภาพ" "ความเครียด"
  ตามด้วยย่อหน้า 2-4 ประโยคต่อช่วง
- แต่ละช่วงให้รายละเอียดพออ่านเพลิน ไม่สั้นเกินไป ไม่ยืดเยื้อ
- เขียนให้เข้ากับธาตุ/ลักษณะของราศีนั้นเล็กน้อย (ไฟ กล้าเริ่ม / น้ำ อ่อนไหว / ดิน มั่นคง / ลม เปิดกว้าง)
- จบด้วยประโยคให้กำลังใจ พร้อมเลขมงคลและสีมงคล
- ความยาวรวมประมาณ 250-350 คำ
- ใช้ภาษาไทยธรรมชาติ อ่านง่าย ไม่ใช้ศัพท์ยาก ไม่อลังการเกินไป
- ไม่ใช้ bullet points ไม่ใช้ emoji

==================================================
คุณภาพของคำตอบ
==================================================
ก่อนตอบ ให้คิดเงียบ ๆ ว่า:
- พลังหลักของวันนี้สำหรับราศีนี้คืออะไร?
- ด้านใดควรเน้นเป็นพิเศษ?
- คำแนะนำใดที่ผู้ใช้จะนำไปใช้ได้จริง?

จากนั้นตอบเป็นภาษาไทยธรรมชาติ และอย่าเปิดเผยกระบวนการคิดภายในของคุณ`;

function streamText(text: string) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { birthDate } = body as { birthDate?: string };
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }
    const [y, m, d] = birthDate.split("-").map(Number);
    if (!isValidBirthDate(y!, m!, d!)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `zodiac:${user.id}:${birthDate}:${today}`;

    const cached = getCachedFortune(cacheKey, 24 * 3600_000);
    if (cached && typeof cached === "string") {
      return streamText(cached);
    }

    if (!checkRateLimit(`zodiac:${user.id}`, 10, 3600_000)) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const fallback = buildZodiacFortune(birthDate, today);
    const sign = ZODIAC_SIGNS.find((s) => s.id === fallback.signId)!;

    let text = fortuneToProse(fallback);
    try {
      const userPrompt = `ผู้ใช้เกิดวันที่ ${birthDate}
ราศี: ${fallback.signNameTh} (${sign.nameEn}) ${fallback.signSymbol} · ช่วง ${fallback.signRange}
ปีนักษัตร: ${fallback.animal.yearTh} (${fallback.animal.animal})

วันนี้คือ ${today}

จงเขียนคำทำนายประจำวันสำหรับผู้ใช้คนนี้ เป็นภาษาไทยธรรมชาติ ครอบคลุม ภาพรวม ความรัก การงาน การเงิน สุขภาพ และความเครียด`;

      const stream = await getOpenAI()
        .chat.completions.create(
          {
            model: "typhoon-v2.5-30b-a3b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.85,
            max_tokens: 900,
            stream: true,
          },
          { timeout: 60_000, maxRetries: 0 }
        )
        .catch(() => null);

      if (stream) {
        let full = "";
        for await (const chunk of stream) {
          full += chunk.choices[0]?.delta?.content || "";
        }
        const trimmed = full.trim();
        if (trimmed.length > 20) {
          text = trimmed;
        }
      }
    } catch {
      // fall through to deterministic prose
    }

    setCachedFortune(cacheKey, text);
    return streamText(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate zodiac fortune";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
