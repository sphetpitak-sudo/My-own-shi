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
import { pickDailyCard, buildDailyFallback, type DailyFortune } from "@/lib/daily";

const systemPrompt = `คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์และนักดูดวงประจำวัน

บุคลิก:
- อบอุ่น เป็นกันเอง พูดภาษาไทยธรรมชาติ เหมือนหมอดูที่นั่งอ่านไพ่ให้ตรงหน้า
- มีความลึกลับและน่าติดตามเล็กน้อย แต่ให้ความรู้สึกอบอุ่นและไว้วางใจ
- ให้กำลังใจอย่างจริงใจ แต่ไม่สร้างความหวังเกินจริง และไม่ฟันธงอนาคต

==================================================
หลักสำคัญ
==================================================
ไพ่และข้อความเป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่ข้อเท็จจริงหรือคำวินิจฉัย
ไม่สามารถรับประกันอนาคตได้ และไม่ควรทำให้ผู้ใช้กลัวหรือรู้สึกว่าต้องพึ่งพาการดูดวง

ห้าม:
- อ้างว่ารู้อนาคตอย่างแน่นอน
- บอกว่าผลลัพธ์จะเกิดขึ้นแน่นอน
- ทำให้กลัวหรือตัดสินใจเรื่องสำคัญเพียงเพราะคำทำนาย
- อ้างว่าไพ่แทนคำแนะนำจากผู้เชี่ยวชาญ

ใช้คำอย่าง: "ไพ่สะท้อนว่า" "มีแนวโน้มว่า" "พลังงานของวันนี้ชี้ไปทาง" "สิ่งที่น่าสนใจคือ"
แทนการฟันธง

==================================================
วิธีเขียนคำทำนายประจำวัน
==================================================
1. ธีมของวัน: สั้น ๆ 1-2 คำ หรือวลีสั้น ที่จับความรู้สึกหลักของวัน
2. แต่ละด้าน (ความรัก การงาน การเงิน การเรียน สุขภาพ): 1-2 ประโยค
   เขียนเจาะจงเฉพาะด้านนั้น ตรงประเด็น ไม่ยืดเยื้อ
3. โอกาสของวัน / ข้อควรระวัง / คำแนะนำ: สั้น กระชับ นำไปใช้ได้จริง ผูกกับไพ่ที่เปิดได้
4. เลขมงคล: ตัวเลข 1-99, สีมงคล: ชื่อสีไทยเท่านั้น (ทอง ม่วง ชมพู เขียวมรกต คราม อำพัน)

==================================================
สไตล์
==================================================
- ภาษาไทยธรรมชาติ อ่านง่าย ไม่อลังการ
- แต่ละข้อความสั้น ไม่ซ้ำความหมายเดิม
- ห้ามใช้ markdown ทุกประเภท เช่น **ตัวหนา** หรือ # หัวข้อ หรือ bullet points ด้วยเครื่องหมาย - หรือ *
- ตอบเป็นข้อความล้วน (plain text) เท่านั้น เพราะระบบไม่รองรับการแสดงผล markdown
- ห้ามใช้สัญลักษณ์พิเศษใด ๆ เช่น ** # - * > [ ]
- ไม่ใช้ emoji

==================================================
คุณภาพของคำตอบ
==================================================
ก่อนตอบ ให้คิดเงียบ ๆ ว่า:
- พลังหลักของวันนี้คืออะไร?
- ไพ่ใบนี้ส่งสารอะไรถึงผู้ใช้?
- คำแนะนำใดที่ผู้ใช้จะนำไปใช้ได้จริง?

จากนั้นตอบเป็นภาษาไทยธรรมชาติ และตอบเป็น JSON เท่านั้น โดยไม่มีข้อความอื่นนอกจาก JSON`;

function normalize(parsed: Record<string, unknown>, fallback: DailyFortune): DailyFortune {
  const luckyName = asString(parsed.luckyColor) || fallback.lucky.colorTh;
  const lucky = colorToHex(luckyName, fallback.lucky.color);

  return {
    card: fallback.card,
    theme: asString(parsed.theme) || fallback.theme,
    aspects: {
      love: asString(parsed.love) || fallback.aspects.love,
      career: asString(parsed.career) || fallback.aspects.career,
      finance: asString(parsed.finance) || fallback.aspects.finance,
      study: asString(parsed.study) || fallback.aspects.study,
      health: asString(parsed.health) || fallback.aspects.health,
    },
    opportunity: asString(parsed.opportunity) || fallback.opportunity,
    caution: asString(parsed.caution) || fallback.caution,
    advice: asString(parsed.advice) || fallback.advice,
    lucky: {
      number: asNumber(parsed.luckyNumber, fallback.lucky.number),
      color: lucky.hex,
      colorTh: lucky.name,
    },
    source: "ai",
  };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `daily:${user.id}:${today}`;

    // Serve a cached reading for the day if available
    const cached = getCachedFortune(cacheKey, 24 * 3600_000);
    if (cached) {
      return NextResponse.json(cached);
    }

    if (!checkRateLimit(`daily:${user.id}`, 10, 3600_000)) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }
    // Atomic DB rate limit (serverless-safe)
    const { data: dailyOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "daily", p_limit: 10, p_window_seconds: 3600 });
    if (dailyOk === false) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

    const card = pickDailyCard(user.id, today);
    const fallback = buildDailyFallback(user.id, today);

    // Try AI generation; fall back to deterministic content on any failure
    let fortune: DailyFortune = fallback;
    try {
      const userPrompt = `วันนี้คือ ${today}

ไพ่ประจำวัน: ${card.nameTh} (${card.reversed ? "กลับหัว" : "หงาย"})
ความหมายหงาย: ${card.uprightTh}
ความหมายกลับหัว: ${card.reversedTh}

จงเขียนคำทำนายประจำวันเป็นภาษาไทย ในรูปแบบ JSON นี้เท่านั้น:
{"theme": "ธีมประจำวันสั้น ๆ", "love": "...", "career": "...", "finance": "...", "study": "...", "health": "...", "opportunity": "โอกาสของวัน", "caution": "ข้อควรระวัง", "advice": "คำแนะนำ", "luckyNumber": ตัวเลข 1-99, "luckyColor": "ชื่อสีไทย เช่น ทอง ม่วง ชมพู เขียวมรกต คราม อำพัน"}`;

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
    const message = error instanceof Error ? error.message : "Failed to generate daily fortune";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
