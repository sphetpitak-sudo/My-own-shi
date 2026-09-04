/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSaju, REMEDY_MAP } from "@/lib/saju/calculator";
import { startObs, setObsUser, endObs, obsHeaders } from "@/lib/observability";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request){
  const obs = startObs("saju", request);
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) {
    endObs(obs, "unauthorized", { status: 401 });
    return NextResponse.json({ error:"Unauthorized"}, {status:401, headers: obsHeaders(obs)});
  }
  setObsUser(obs, user.id);
  const body = await request.json().catch(()=>({})) as { date?: string; time?: string; place?: string };
  const date=(body.date||"").trim(), time=(body.time||"").trim(), place=(body.place||"").trim();
  if(!date||!time||!place) {
    endObs(obs, "validation_error", { status: 400, reason: "missing_fields" });
    return NextResponse.json({ error:"Missing fields"}, {status:400, headers: obsHeaders(obs)});
  }
  const { data: rateOk } = await supabase.rpc("check_rate_limit",{ p_endpoint:"saju", p_limit:10, p_window_seconds:3600});
  if(rateOk===false) {
    endObs(obs, "rate_limited", { status: 429 });
    return NextResponse.json({ error:"Too many requests"}, {status:429, headers: obsHeaders(obs)});
  }
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
  endObs(obs, "ok", { status: 200 });
  return NextResponse.json({ chart, remedy }, { headers: obsHeaders(obs) });
  } catch (e: unknown) {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}
