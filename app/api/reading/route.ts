import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";

const systemPrompt = `คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์มืออาชีพที่เชี่ยวชาญศาสตร์ Rider-Waite-Smith

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
- ห้ามใช้ markdown ทุกประเภท เช่น **ตัวหนา** หรือ # หัวข้อ หรือ bullet points ด้วยเครื่องหมาย - หรือ *
- ตอบเป็นข้อความล้วน (plain text) เท่านั้น เพราะระบบไม่รองรับการแสดงผล markdown
- ห้ามใช้สัญลักษณ์พิเศษใด ๆ เช่น ** # - * > [ ]
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
    throw new Error("OPEN_TYPHOON_API_KEY is not set");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

type ContextCategory = "love" | "career" | "study" | "finance" | "general";

interface ReadingCardInput {
  cardId: number;
  positionLabel: string;
  reversed: boolean;
}

function detectContext(question: string): ContextCategory {
  const q = question.toLowerCase();
  if (/รัก|แฟน|คนรัก|ชอบ|หึง|นอกใจ|เลิก|กลับมา|สัมพันธ์|คบ|จีบ|สารภาพ|Date|Love|Heart|Crush|เขาคิด|เขารัก/.test(q)) return "love";
  if (/งาน|ทำงาน|เงินเดือน|โปรโมท|ลาออก|สมัครงาน|ตำแหน่ง|หัวหน้า|เพื่อนร่วมงาน|ธุรกิจ|Career|Job|Work|Office|Company/.test(q)) return "career";
  if (/เรียน|สอบ|เกรด|มหาลัย|โรงเรียน|อาจารย์|วิชา|บ้านทำ|Study|Exam|School|University|Class/.test(q)) return "study";
  if (/เงิน|ลงทุน|รายได้|หนี้|ซื้อ|ขาย|เก็บออม|Finance|Money|Invest|Budget| Debt|Income/.test(q)) return "finance";
  return "general";
}

function getCardContextMeaning(card: (typeof ALL_CARDS)[0], reversed: boolean, context: ContextCategory): string {
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
  memoryBlock?: string;
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
${input.memoryBlock || ""}

จงอ่านไพ่ชุดนี้ให้ผู้ใช้โดยยึดตาม System Prompt
ตอบตรงคำถาม และเชื่อมโยงไพ่ทั้งหมดเป็นเรื่องราวเดียวกัน
หากมีบริบทอดีต ให้อ้างอิงอย่างอ่อนโยนเมื่อเกี่ยวข้องเท่านั้น ไม่บังคับเชื่อมทุกครั้ง`;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { question, spreadType, cards, useMemory } = body as {
      question?: string;
      spreadType?: string;
      cards?: ReadingCardInput[];
      useMemory?: boolean;
    };

    // Validate input
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });
    }

    if (cards.length > 10) {
      return NextResponse.json({ error: "Too many cards" }, { status: 400 });
    }

    const spread = SPREADS[spreadType as SpreadType];
    if (!spread) {
      return NextResponse.json({ error: "Invalid spread type" }, { status: 400 });
    }

    if (cards.length !== spread.cardCount) {
      return NextResponse.json({ error: "Card count does not match spread" }, { status: 400 });
    }

    // Validate question length server-side
    const trimmedQuestion = (question || "").trim().slice(0, 500);

    // Validate card IDs exist and positionLabel
    const cardIdSet = new Set(ALL_CARDS.map(c => c.id));
    for (const c of cards) {
      if (typeof c.cardId !== "number" || !cardIdSet.has(c.cardId)) {
        return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
      }
      if (typeof c.reversed !== "boolean") {
        return NextResponse.json({ error: "Invalid card data" }, { status: 400 });
      }
      if (typeof c.positionLabel !== "string" || c.positionLabel.length === 0 || c.positionLabel.length > 50) {
        return NextResponse.json({ error: "Invalid position" }, { status: 400 });
      }
    }

    // Check for duplicate card IDs
    const seenIds = new Set<number>();
    for (const c of cards) {
      if (seenIds.has(c.cardId)) {
        return NextResponse.json({ error: "Duplicate cards" }, { status: 400 });
      }
      seenIds.add(c.cardId);
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Atomic rate limit (serverless-safe) — 5 readings / 60s
    const { data: rateOk } = await supabase.rpc("check_rate_limit", { p_endpoint: "reading", p_limit: 5, p_window_seconds: 60 });
    if (rateOk === false) {
      return NextResponse.json({ error: "Too many readings. Please try again shortly." }, { status: 429 });
    }

    // Fetch reading cost for error message (authoritative cost is inside spend_for_spread)
    const { data: costRow } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "reading_costs")
      .single();
    const costs = (costRow?.value as Record<string, number>) || { single: 5, three_card: 15, celtic: 50 };
    const expectedCost = costs[spreadType as SpreadType] || spread.cost;

    // Atomic point spend via authoritative RPC (no client-controlled amount)
    const { data: charged, error: spendError } = await supabase.rpc("spend_for_spread", {
      p_spread: spreadType,
      p_description: `${spreadType} reading`,
    });

    if (spendError) {
      return NextResponse.json({ error: "Failed to process points" }, { status: 500 });
    }

    if (!charged || charged === 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();
      return NextResponse.json(
        { error: "Not enough points", needed: expectedCost, current: profile?.points || 0 },
        { status: 400 }
      );
    }
    const cost = charged as number;

    // Resolve cards from server-side data
    const cardMap = new Map(ALL_CARDS.map(c => [c.id, c]));
    const context = detectContext(trimmedQuestion);

    const resolvedCards = cards.map(c => {
      const card = cardMap.get(c.cardId)!;
      return {
        name: card.name,
        nameTh: card.nameTh,
        position: c.positionLabel,
        reversed: c.reversed,
        contextMeaning: getCardContextMeaning(card, c.reversed, context),
      };
    });

    // Continuity memory: fetch last 3 readings if enabled (default true)
    let memoryBlock = "";
    const shouldUseMemory = useMemory !== false;
    if (shouldUseMemory) {
      try {
        const { data: past } = await supabase
          .from("readings")
          .select("question, interpretation, created_at, spread_type, cards")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        if (past && past.length > 0) {
          const summaries = past.map((r, idx) => {
            const q = (r.question || "ไม่มีคำถาม").slice(0, 80);
            const interp = (r.interpretation || "").replace(/\s+/g, " ").slice(0, 300);
            const date = new Date(r.created_at).toLocaleDateString("th-TH");
            return `${idx + 1}. [${date} · ${r.spread_type}] คำถาม: ${q} — สรุป: ${interp}${interp.length >= 300 ? "…" : ""}`;
          }).join("\n");
          memoryBlock = `\n\nบริบทจาก 3 ครั้งล่าสุดของผู้ใช้นี้ (เพื่อความต่อเนื่องเท่านั้น — อย่าคัดลอกตรง ๆ แต่ให้เชื่อมโยงอย่างอ่อนโยนเมื่อเกี่ยวข้อง):\n${summaries}\nหากไม่เกี่ยวข้อง ให้ละไว้`;
        }
      } catch {}
    }

    const userPrompt = buildUserPrompt({
      question: trimmedQuestion || "ไม่มีคำถามเฉพาะ ดูโดยรวม",
      spreadNameTh: spread.nameTh,
      cards: resolvedCards,
      memoryBlock,
    });

    // Create pending reading before AI (ensures history exists even if insert after would fail)
    let pendingReadingId: string | null = null;
    try {
      const { data: pending, error: pendingErr } = await supabase.from("readings").insert({
        user_id: user.id,
        spread_type: spreadType,
        cards: cards,
        question: trimmedQuestion,
        interpretation: "__generating__",
        points_spent: cost,
      }).select("id").single();
      if (pendingErr) throw pendingErr;
      pendingReadingId = (pending as { id: string }).id;
    } catch (e) {
      // If pending insert fails, refund and abort
      try { await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost }); } catch {}
      console.error("Failed to create pending reading:", e);
      return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
    }

    const stream = await getOpenAI()
      .chat.completions.create(
        {
          model: "typhoon-v2.5-30b-a3b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 1500,
          stream: true,
        },
        { timeout: 60_000, maxRetries: 0 }
      )
      .catch(async () => {
        // AI request failed before streaming — refund and delete pending
        try {
          if (pendingReadingId) {
            try { await supabase.from("readings").delete().eq("id", pendingReadingId).eq("user_id", user.id); } catch {}
            try { await supabase.rpc("refund_by_reading", { p_reading_id: pendingReadingId }); } catch {
              await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
            }
          } else {
            await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
          }
        } catch {}
        return null;
      });

    if (!stream) {
      return NextResponse.json(
        { error: "AI generation unavailable. Points refunded." },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    let fullText = "";

    const readable = new ReadableStream({
      async start(controller) {
        let streamFailed = false;
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
        } catch {
          streamFailed = true;
          // Refund and delete pending on mid-stream failure
          try {
            if (pendingReadingId) {
              try { await supabase.from("readings").delete().eq("id", pendingReadingId).eq("user_id", user.id); } catch {}
              try { await supabase.rpc("refund_by_reading", { p_reading_id: pendingReadingId }); } catch {
                await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
              }
            } else {
              await supabase.rpc("refund_points", { p_user_id: user.id, p_amount: cost });
            }
          } catch {}
          try {
            controller.error(new Error("Streaming failed"));
          } catch {}
        }

        // Update pending reading with final interpretation (only on success)
        if (!streamFailed && pendingReadingId) {
          try {
            await supabase.from("readings").update({ interpretation: fullText }).eq("id", pendingReadingId).eq("user_id", user.id);
          } catch (e) {
            console.error("Failed to update reading:", e);
            // If update fails, try to keep original pending — not critical, user already got stream
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
    const message = error instanceof Error ? error.message : "Failed to generate reading";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
