/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSaju, REMEDY_MAP } from "@/lib/saju/calculator";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request){
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({ error:"Unauthorized"}, {status:401});
  const body = await request.json().catch(()=>({})) as { date?: string; time?: string; place?: string };
  const date=(body.date||"").trim(), time=(body.time||"").trim(), place=(body.place||"").trim();
  if(!date||!time||!place) return NextResponse.json({ error:"Missing fields"}, {status:400});
  const { data: rateOk } = await supabase.rpc("check_rate_limit",{ p_endpoint:"saju", p_limit:10, p_window_seconds:3600});
  if(rateOk===false) return NextResponse.json({ error:"Too many requests"}, {status:429});
  const chart = await calculateSaju(date, time, place);
  const remedy = REMEDY_MAP[chart.weakest];
  // persist best-effort
  try{
    await supabase.from("saju_charts").insert({
      user_id: user.id,
      birth_date: date, birth_time: time, birth_place: place,
      pillars: chart.pillars as any,
      element_counts: chart.elementCountsWithHidden as any,
      weakest: chart.weakest,
      day_master: chart.dayMaster,
      interpretation: "",
      source: "fallback",
    } as any);
  }catch{}
  return NextResponse.json({ chart, remedy });
}
