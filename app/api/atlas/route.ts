/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAtlasLines } from "@/lib/atlas/calcLines";
import { rankCitiesAtlas } from "@/lib/atlas/cities";
import { calculateSaju, REMEDY_MAP } from "@/lib/saju/calculator";
import { getOpenAI, AI_MODEL, AI_PARAMS } from "@/lib/ai";
import { ATLAS_SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request){
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({ error:"Unauthorized"}, {status:401});
  const body = await request.json().catch(()=>({})) as { date?: string; time?: string; place?: string; lat?: number; lon?: number; tzOffsetMinutes?: number };
  const date=(body.date||"").trim(), time=(body.time||"").trim(), place=(body.place||"").trim();
  const lat=typeof body.lat==="number"?body.lat: undefined, lon=typeof body.lon==="number"?body.lon: undefined, tzOffsetMinutes=typeof body.tzOffsetMinutes==="number"?body.tzOffsetMinutes: undefined;
  if(!date||!time||!place) return NextResponse.json({ error:"Missing fields"}, {status:400});
  const { data: rateOk } = await supabase.rpc("check_rate_limit",{ p_endpoint:"atlas", p_limit:10, p_window_seconds:3600});
  if(rateOk===false) return NextResponse.json({ error:"Too many requests"}, {status:429});

  // 40 lines textbook: MC/IC vertical, AC/DC curved, RA/Dec via astronomy-engine
  const lines = getAtlasLines({ date, time, lat: lat ?? 13.7563, lon: lon ?? 100.5018, tzOffsetMinutes: tzOffsetMinutes ?? 420 });
  const ranked = rankCitiesAtlas(lines);
  const top6 = ranked.slice(0,6);

  // Saju weakest element for remedy
  let saju=null, remedyPlanets:string[]=[];
  try{
    saju = await calculateSaju(date, time, place);
    remedyPlanets = REMEDY_MAP[saju.weakest]?.planets ?? [];
  }catch{}

  // AI reading for top city + Saju (textbook: tropical, Whole Sign, Jim Lewis)
  let interpretation="", source:"ai"|"fallback"="fallback";
  try{
    const cityLines = top6.map(r=> `${r.city.nameTh} (${r.city.countryTh}) ใกล้ ${(r.bestLine as { labelTh?: string }).labelTh ?? `${r.bestLine.planet}-${r.bestLine.angle}`} ห่าง ${r.distKm.toFixed(0)}km ${r.orb==="intense"?"เข้มข้น":"เจือจาง"}`).join("\n");
    const sajuCtx = saju? `ธาตุ Saju: ${saju.balance.map(b=>`${b.element}:${b.count}`).join(", ")} ธาตุขาด:${saju.weakest} (${saju.elementCountsWithHidden[saju.weakest]}) เสริมด้วย ${remedyPlanets.join(", ")}` : "ไม่มี Saju";
    const atlasPrompt = `<context>
เกิด: ${date} ${time} ${place}
Atlas 40 เส้น (MC/IC ตั้ง, AC/DC โค้ง) คำนวณด้วย astronomy-engine VSOP87 0.02° Tropical Whole Sign อิง Jim Lewis
Top 6 เมือง: 
${cityLines}
${sajuCtx}
    เส้นทั้งหมด: ${lines.map(l=> l.labelTh + (l.points? " โค้ง":" ตั้ง") + ` ${Number(l.longitude).toFixed(2)}°`).join(", ").slice(0,1500)}
</context>
จงวิเคราะห์ Atlas ตามตำรา Jim Lewis 4 มุม AC/DC/MC/IC + orb 0-250km เข้มข้น /250-1100km เจือจาง ห้ามประดิษฐ์เรือน/มุมที่ไม่ได้ให้มา ถ้ามีธาตุขาดให้โยง Saju ${saju?.weakest ?? ""} กับดาวเสริม ${remedyPlanets.join("/")} ตามตำรา 300-450 คำ ใช้หัวข้อ: ภาพรวม, เมืองอันดับ1, ธาตุและดาวเสริม, คำแนะนำ
`;

    const completion = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role:"system", content: ATLAS_SYSTEM_PROMPT }, { role:"user", content: atlasPrompt }],
      temperature: AI_PARAMS.birthchart.temperature,
      max_tokens: AI_PARAMS.birthchart.max_tokens,
    }, { timeout: AI_PARAMS.birthchart.timeoutMs } as any);
    const raw = (completion as any).choices[0]?.message?.content || "";
    if(raw.trim()){ interpretation=raw.trim().slice(0,4000); source="ai"; }
  }catch(e){ console.error("atlas AI failed", e); }

  return NextResponse.json({ lines, ranked: top6, allRanked: ranked.slice(0,20), saju, remedyPlanets, interpretation, source });
}
