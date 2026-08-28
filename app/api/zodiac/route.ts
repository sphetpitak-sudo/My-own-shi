import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAI,
  extractJSON,
  asString,
  asNumber,
  colorToHex,
  checkRateLimit,
  getCachedFortune,
  setCachedFortune,
} from "@/lib/ai";
import {
  buildZodiacFortune,
  isValidBirthDate,
  type ZodiacFortune,
} from "@/lib/zodiac";

const systemPrompt = `คุณคือ "เสียงจากจักรวาล" นักโหราศาสตร์ไทยที่เชี่ยวชาญราศีและปีนักษัตร

บุคลิก:
- อบอุ่น อ่อนโยน พูดภาษาไทยธรรมชาติ
- มีความรู้เรื่องโหราศาสตร์ แต่อธิบายให้คนทั่วไปเข้าใจง่าย
- ให้กำลังใจอย่างจริงใจ ไม่ตัดสิน ไม่ทำให้กลัว

==================================================
หลักสำคัญ
==================================================
คำทำนายเป็นแนวทางเชิงสัญลักษณ์ตามโหราศาสตร์ ไม่ใช่ข้อเท็จจริงหรือคำวินิจฉัย
ไม่สามารถรับประกันอนาคตได้ และไม่ควรทำให้ผู้ใช้รู้สึกว่าต้องพึ่งพาการดูดวง

ห้าม:
- อ้างว่ารู้อนาคตอย่างแน่นอน
- บอกว่าผลลัพธ์จะเกิดขึ้นแน่นอน
- ทำให้กลัวหรือตัดสินใจเรื่องสำคัญเพียงเพราะคำทำนาย
- อ้างว่าแทนคำแนะนำจากผู้เชี่ยวชาญ

ใช้คำอย่าง: "มีแนวโน้มว่า" "ดวงของคุณชี้ไปทาง" "พลังงานของวันนี้เอื้อต่อ" "สิ่งที่ควรสังเกตคือ"
แทนการฟันธง

==================================================
วิธีเขียนคำทำนายรายวันตามราศี
==================================================
1. ภาพรวม: 1-2 ประโยค สรุปพลังงานหลักของวันสำหรับราศีนั้น
2. แต่ละด้าน (เรียน/งาน ความรัก การเงิน สุขภาพ ความเครียด): 1-2 ประโยค เจาะจงแต่ละด้าน
3. เขียนให้เข้ากับธาตุของราศีเล็กน้อย เช่น ราศีไฟ กล้าเริ่ม ราศีน้ำ อ่อนไหว ราศีดิน มั่นคง ราศีลม เปิดกว้าง
4. เลขมงคล: ตัวเลข 1-99, สีมงคล: ชื่อสีไทยเท่านั้น (ทอง ม่วง ชมพู เขียวมรกต คราม อำพัน)

==================================================
สไตล์
==================================================
- ภาษาไทยธรรมชาติ อ่านง่าย กระชับ ไม่ยืดเยื้อ
- แต่ละข้อความสั้น ไม่ซ้ำความหมายเดิม
- ไม่ใช้ markdown ไม่ใช้ bullet ไม่ใช้ emoji

==================================================
คุณภาพของคำตอบ
==================================================
ก่อนตอบ ให้คิดเงียบ ๆ ว่า:
- พลังหลักของวันนี้สำหรับราศีนี้คืออะไร?
- ด้านใดที่ควรเน้นเป็นพิเศษ?
- คำแนะนำใดที่ผู้ใช้จะนำไปใช้ได้จริง?

จากนั้นตอบเป็นภาษาไทยธรรมชาติ และตอบเป็น JSON เท่านั้น โดยไม่มีข้อความอื่นนอกจาก JSON`;

function normalize(parsed: Record<string, unknown>, fallback: ZodiacFortune): ZodiacFortune {
  const luckyName = asString(parsed.luckyColor) || fallback.lucky.colorTh;
  const lucky = colorToHex(luckyName, fallback.lucky.color);

  return {
    ...fallback,
    overview: asString(parsed.overview) || fallback.overview,
    study: asString(parsed.study) || fallback.study,
    love: asString(parsed.love) || fallback.love,
    money: asString(parsed.money) || fallback.money,
    health: asString(parsed.health) || fallback.health,
    stress: asString(parsed.stress) || fallback.stress,
    lucky: {
      number: asNumber(parsed.luckyNumber, fallback.lucky.number),
      color: lucky.hex,
      colorTh: lucky.name,
    },
    source: "ai" as const,
  };
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
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!checkRateLimit(`zodiac:${user.id}`, 10, 3600_000)) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const fallback = buildZodiacFortune(birthDate, today);

    let fortune: ZodiacFortune = fallback;
    try {
      const userPrompt = `ผู้ใช้เกิดวันที่ ${birthDate}
ราศี: ${fallback.signNameTh}
ปีนักษัตร: ${fallback.animal.yearTh} (${fallback.animal.animal})

วันนี้คือ ${today}

จงเขียนคำทำนายประจำวันเป็นภาษาไทย ในรูปแบบ JSON นี้เท่านั้น:
{"overview": "ภาพรวมของวัน", "study": "การเรียน/การงาน", "love": "ความรัก", "money": "การเงิน", "health": "สุขภาพ", "stress": "ความเครียด", "luckyNumber": ตัวเลข 1-99, "luckyColor": "ชื่อสีไทย เช่น ทอง ม่วง ชมพู เขียวมรกต คราม อำพัน"}`;

      const stream = await getOpenAI()
        .chat.completions.create(
          {
            model: "typhoon-v2.5-30b-a3b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 600,
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
        const parsed = extractJSON(full);
        if (parsed) {
          fortune = normalize(parsed, fallback);
        }
      }
    } catch {
      // fall through to deterministic fallback
    }

    setCachedFortune(cacheKey, fortune);
    return NextResponse.json(fortune);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate zodiac fortune";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
