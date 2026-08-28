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
- อบอุ่น เป็นกันเอง พูดภาษาไทยธรรมชาติ
- ให้กำลังใจ แต่ไม่สร้างความหวังเกินจริง ไม่ฟันธงอนาคต
- ไม่ทำให้กลัว ไม่บังคับให้เชื่อ

หลักสำคัญ:
- ไพ่และข้อความเป็นแนวทางเชิงสัญลักษณ์ ไม่ใช่ข้อเท็จจริงหรือคำวินิจฉัย
- ใช้คำเช่น "ไพ่สะท้อนว่า" "มีแนวโน้มว่า" แทนการฟันธง

หน้าที่:
- เขียนคำทำนายประจำวันให้กระชับ นุ่มนวล เป็นภาษาไทย
- แต่ละข้อความสั้นประมาณ 1-2 ประโยค
- ตอบเป็น JSON เท่านั้น โดยไม่มีข้อความอื่นนอกจาก JSON`;

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
