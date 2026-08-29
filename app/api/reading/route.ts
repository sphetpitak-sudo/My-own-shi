import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { SPREADS, ALL_CARDS, type SpreadType } from "@/lib/cards";

const systemPrompt = `คุณคือ "หมอดูทิพย์" นักอ่านไพ่ทาโรต์มืออาชีพที่เชี่ยวชาญศาสตร์ Rider-Waite-Smith
- อบอุ่น เป็นกันเอง คุยเหมือนหมอดูตรงหน้า
- มองทั้งด้านสนับสนุน ท้าทาย และสิ่งที่มองข้าม
- ตอบ 4 ส่วน: ภาพรวม → การอ่านไพ่ → สรุป → คำแนะนำ
- ภาษาไทยธรรมชาติ ไม่ใช้ markdown ห้ามใช้ ** # - * > [
- 300-600 คำ`;

function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: "https://api.opentyphoon.ai/v1" });
}

type ReadingCardInput = { cardId: number; positionLabel: string; reversed: boolean };

function buildUserPrompt(q: string, spreadTh: string, cards: Array<{nameTh:string; name:string; position:string; reversed:boolean}>) {
  const lines = cards.map((c,i)=> `${i+1}. ${c.nameTh} (${c.name}) ตำแหน่ง:${c.position} ${c.reversed?"กลับหัว":"หงาย"}`).join("\n");
  return `คำถาม: ${q || "ไม่มี ดูโดยรวม"}\nSpread: ${spreadTh}\nไพ่:\n${lines}\nจงอ่านตาม system`;
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({error:"Invalid JSON"}, {status:400}); }
    const { question, spreadType, cards } = body as { question?:string; spreadType?:string; cards?: ReadingCardInput[] };
    if (!cards || !Array.isArray(cards) || cards.length===0) return NextResponse.json({error:"Invalid cards"}, {status:400});
    if (cards.length>10) return NextResponse.json({error:"Too many cards"}, {status:400});
    const spread = SPREADS[spreadType as SpreadType];
    if (!spread) return NextResponse.json({error:"Invalid spread"}, {status:400});
    if (cards.length !== spread.cardCount) return NextResponse.json({error:"Card count mismatch"}, {status:400});
    const trimmedQuestion = (question||"").trim().slice(0,500);
    const cardIdSet = new Set(ALL_CARDS.map(c=>c.id));
    for (const c of cards) {
      if (typeof c.cardId!=="number" || !cardIdSet.has(c.cardId)) return NextResponse.json({error:"Invalid card ID"}, {status:400});
      if (typeof c.reversed!=="boolean") return NextResponse.json({error:"Invalid card"}, {status:400});
      if (typeof c.positionLabel!=="string" || c.positionLabel.length===0 || c.positionLabel.length>50) return NextResponse.json({error:"Invalid position"}, {status:400});
    }
    const seen=new Set<number>(); for(const c of cards){ if(seen.has(c.cardId)) return NextResponse.json({error:"Duplicate"}, {status:400}); seen.add(c.cardId); }
    const supabase = await createClient();
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({error:"Unauthorized"}, {status:401});
    const { count } = await supabase.from("point_transactions").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("type","reading_purchase").gte("created_at", new Date(Date.now()-60_000).toISOString());
    if ((count??0)>=5) return NextResponse.json({error:"Too many readings. Please try again shortly."},{status:429});
    const { data: costRow } = await supabase.from("admin_settings").select("value").eq("key","reading_costs").single();
    const costs = (costRow?.value as Record<string,number>) || {single:5,three_card:15,celtic:50};
    const cost = costs[spreadType as SpreadType] || spread.cost;
    const { data: spent, error: spendErr } = await supabase.rpc("spend_points", {p_user_id:user.id, p_amount:cost, p_description:`${spreadType} reading`});
    if (spendErr) return NextResponse.json({error:"Failed to process points"},{status:500});
    if (!spent) {
      const { data: profile } = await supabase.from("profiles").select("points").eq("id",user.id).single();
      return NextResponse.json({error:"Not enough points", needed:cost, current:profile?.points||0},{status:400});
    }
    const cardMap=new Map(ALL_CARDS.map(c=>[c.id,c]));
    const resolved=cards.map(c=>{ const card=cardMap.get(c.cardId)!; return {name:card.name,nameTh:card.nameTh,position:c.positionLabel,reversed:c.reversed};});
    const userPrompt = buildUserPrompt(trimmedQuestion, spread.nameTh, resolved);
    const maxTokens = spreadType==="single"?700:spreadType==="three_card"?1000:1300;
    const abortController=new AbortController();
    const overallTimeout=setTimeout(()=>abortController.abort(),30000);
    const aiPromise=getOpenAI().chat.completions.create({model:"typhoon-v2.5-30b-a3b-instruct",messages:[{role:"system",content:systemPrompt},{role:"user",content:userPrompt}],temperature:0.75,max_tokens:maxTokens,stream:true},{timeout:20000,maxRetries:0,signal:abortController.signal} as any);
    const timeoutPromise=new Promise<null>((_,reject)=>setTimeout(()=>reject(new Error("AI_TIMEOUT")),25000));
    const stream=await Promise.race([aiPromise,timeoutPromise]).catch(async (err:unknown)=>{
      clearTimeout(overallTimeout);
      try{ await supabase.rpc("refund_points",{p_user_id:user.id,p_amount:cost}); }catch{}
      console.error("AI create failed",err);
      return null;
    }) as unknown as null | Awaited<typeof aiPromise>;
    if (!stream) return NextResponse.json({error:"AI ไม่ตอบสนองภายใน 25 วินาที กรุณาลองใหม่ — แต้มคืนแล้ว"},{status:502});
    const encoder=new TextEncoder(); let fullText="";
    let firstTokenTimeout: ReturnType<typeof setTimeout>|null=setTimeout(()=>{ try{abortController.abort();}catch{} },15000);
    const readable=new ReadableStream({
      async start(controller){
        let failed=false;
        try{
          for await(const chunk of stream){
            const content=chunk.choices[0]?.delta?.content||"";
            if(content){ if(firstTokenTimeout){clearTimeout(firstTokenTimeout);firstTokenTimeout=null;} fullText+=content; controller.enqueue(encoder.encode(`data: ${JSON.stringify({content})}\n\n`)); }
          }
          if(firstTokenTimeout){clearTimeout(firstTokenTimeout);firstTokenTimeout=null;}
          clearTimeout(overallTimeout);
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`)); controller.close();
        }catch{
          failed=true;
          if(firstTokenTimeout)clearTimeout(firstTokenTimeout);
          clearTimeout(overallTimeout);
          try{ await supabase.rpc("refund_points",{p_user_id:user.id,p_amount:cost}); }catch{}
          try{ controller.error(new Error("Streaming failed")); }catch{}
        }
        if(!failed){
          try{ await supabase.from("readings").insert({user_id:user.id,spread_type:spreadType,cards,question:trimmedQuestion,interpretation:fullText,points_spent:cost}); }catch(e){ console.error(e); }
        }
      },
      cancel(){ try{abortController.abort();}catch{} if(firstTokenTimeout)clearTimeout(firstTokenTimeout); clearTimeout(overallTimeout); }
    });
    return new Response(readable,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"}});
  } catch(e:unknown){ return NextResponse.json({error: e instanceof Error?e.message:"Failed"},{status:500}); }
}
