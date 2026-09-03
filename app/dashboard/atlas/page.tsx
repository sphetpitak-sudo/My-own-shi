/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import AtlasMap from "@/components/AtlasMap";
import { Compass, Calendar, Clock, MapPin, Sparkles, Navigation, Globe, Search, Heart, Briefcase, Lightbulb, Activity, Leaf, Flame, Mountain, Gem, Droplets, Layers } from "lucide-react";
import type { AtlasLine } from "@/lib/atlas/calcLines";
import type { AtlasCity } from "@/lib/atlas/cities";
import { suggestPlaces } from "@/lib/geocoding";
import type { SajuChart } from "@/lib/saju/types";
import { FIVE_ELEMENT_TH } from "@/lib/saju/types";
import { stripMarkdownMultiline } from "@/lib/text";

const STAGES = ["กำลังคำนวณ 40 เส้น...", "กำลังจัดอันดับ 189 เมือง...", "กำลังให้ AI อ่านเมืองที่ใช่..."];

const ELEMENT_ICON: Record<string, typeof Leaf> = { wood: Leaf, fire: Flame, earth: Mountain, metal: Gem, water: Droplets };
const ELEMENT_COLOR: Record<string, string> = { wood: "#22c55e", fire: "#ef4444", earth: "#a78bfa", metal: "#eab308", water: "#38bdf8" };

function parseSections(raw: string){
  const text = stripMarkdownMultiline(raw);
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const headings=["ภาพรวม","เมืองอันดับ1","ธาตุและดาวเสริม","คำแนะนำ"] as const;
  const buckets:Record<string,string[]>= {};
  let cur:string|null=null;
  const re=new RegExp(`^(${headings.join("|")})\\s*[:：]`);
  for(const line of lines){
    const m=line.replace(/^[-•\d.\s]+/,"").match(re);
    if(m){ cur=m[1]!; buckets[cur]=[]; const rest=line.replace(re,"").trim().replace(/^[:：\s]+/,""); if(rest) buckets[cur].push(rest); continue; }
    if(!cur){ cur="ภาพรวม"; buckets[cur]=buckets[cur]||[]; }
    buckets[cur]!.push(line);
  }
  return headings.map(h=> buckets[h]?.join(" ").trim()? {title:h, content: buckets[h].join(" ")}: null).filter(Boolean) as {title:string; content:string}[];
}

export default function AtlasPage(){
  const [date,setDate]=useState(""); const [time,setTime]=useState(""); const [place,setPlace]=useState("");
  const [suggestions,setSuggestions]=useState<string[]>([]); const [showSug,setShowSug]=useState(false);
  const [geo,setGeo]=useState<{lat:number; lon:number; displayName:string}|null>(null);
  const [loading,setLoading]=useState(false); const [stage,setStage]=useState(0);
  const [lines,setLines]=useState<AtlasLine[]|null>(null);
  const [ranked,setRanked]=useState<Array<{city:AtlasCity; bestLine:{planet:string; angle:string; longitude:number; labelTh:string}; distKm:number; orb:"intense"|"soft"|"none"}>>([]);
  const [saju,setSaju]=useState<SajuChart|null>(null); const [remedy,setRemedy]=useState<string[]>([]);
  const [interpretation,setInterpretation]=useState(""); const [error,setError]=useState("");

  useEffect(()=>{ if(place.trim().length>=1) setSuggestions(suggestPlaces(place)); else setSuggestions([]); },[place]);

  async function resolveGeo(q:string){
    try{
      const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}&accept-language=th,en`, { headers:{Accept:"application/json"}});
      if(!r.ok) return null;
      const j=await r.json() as Array<{lat:string; lon:string; display_name:string}>;
      if(j[0]) return {lat:parseFloat(j[0].lat), lon:parseFloat(j[0].lon), displayName:j[0].display_name};
    }catch{} return null;
  }

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault(); setError("");
    if(!date||!time||!place.trim()){ setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setLoading(true); setStage(0);
    const t1=setInterval(()=> setStage(s=> Math.min(s+1,2)),900);
    try{
      let lat:number|undefined, lon:number|undefined, tz:number|undefined;
      if(geo && place.includes(geo.displayName.split(",")[0]!)){ lat=geo.lat; lon=geo.lon; }
      else { const g=await resolveGeo(place.trim()); if(g){ lat=g.lat; lon=g.lon; setGeo(g); const d=g.displayName.toLowerCase(); if(d.includes("japan")||d.includes("tokyo")) tz=540; else if(d.includes("singapore")) tz=480; else if(d.includes("london")) tz=0; else tz=420; } }
      const res=await fetch("/api/atlas",{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ date, time, place: place.trim(), lat, lon, tzOffsetMinutes: tz })});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error||"คำนวณไม่สำเร็จ");
      setLines(data.lines); setRanked(data.ranked); setSaju(data.saju); setRemedy(data.remedyPlanets||[]); setInterpretation(data.interpretation||"");
    }catch(err){ setError(err instanceof Error? err.message: "ไม่สามารถคำนวณได้"); }
    finally{ clearInterval(t1); setLoading(false); }
  }

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">Atlas · 40 เส้นดาว · 189 เมือง · Saju × Planet</p>
          <h1 className="step-title">Atlas แผนที่โลกของคุณ</h1>
          <p className="step-sub">วิธีอ่านใน 3 ขั้น: ใส่ข้อมูลเกิด → ดูเมืองที่ใช่ (จัดอันดับ 189 เมือง) → อ่านคำทำนาย AI เฉพาะตัว (ธาตุ Saju + เส้นดาว)</p>
        </div>

        {!lines && (
          <form onSubmit={handleSubmit} className="mx-4 space-y-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass size={16} style={{color:"var(--primary)"}}/>
                <div className="text-[12.5px] font-bold">ข้อมูลการเกิด</div>
                <span className="ml-auto text-[10px] px-2 py-1 rounded-full font-bold" style={{background:"rgba(212,175,55,0.12)", color:"var(--gold)", border:"1px solid rgba(212,175,55,0.18)"}}>40 เส้นจริง</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="atlas-date"><Calendar size={11}/> วันเกิด</label>
                  <input id="atlas-date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="input" required style={{fontSize:16}}/>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="atlas-time"><Clock size={11}/> เวลาเกิด (แม่นระดับนาที)</label>
                  <input id="atlas-time" type="time" value={time} onChange={e=>setTime(e.target.value)} className="input" required style={{fontSize:16}}/>
                  <p className="text-[10.5px] mt-1" style={{color:"var(--text-muted)"}}>MC/IC อ่อนไหว 4 นาที = 1° (~110km) — ยิ่งแม่นยิ่งตรง</p>
                </div>
                <div className="relative">
                  <label className="label flex items-center gap-1.5" htmlFor="atlas-place"><MapPin size={11}/> เมืองเกิด</label>
                  <div className="relative">
                    <input id="atlas-place" type="text" value={place} onChange={e=>{setPlace(e.target.value); setShowSug(true); setGeo(null);}} onFocus={()=>setShowSug(true)} onBlur={()=> setTimeout(()=>setShowSug(false),160)} placeholder="เช่น กรุงเทพ, Tokyo, Singapore" className="input pr-9" required style={{fontSize:16}} autoComplete="off"/>
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"var(--text-muted)"}}/>
                  </div>
                  {showSug && suggestions.length>0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden border shadow-lg" style={{background:"var(--bg-card)", borderColor:"var(--border)"}}>
                      {suggestions.map(s=> <button key={s} type="button" onClick={()=>{setPlace(s); setShowSug(false);}} className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--bg)] flex items-center gap-2"><Globe size={12} style={{color:"var(--primary)"}}/>{s}</button>)}
                    </div>
                  )}
                  {geo && <p className="text-[10.5px] mt-1 flex items-center gap-1" style={{color:"var(--primary)"}}><Navigation size={11}/> พบ: {geo.displayName.slice(0,60)}</p>}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl text-[11.5px]" style={{background:"var(--primary-soft)", color:"var(--primary)"}}>
              <strong>แผนที่บอกอะไร?</strong> เส้นสี=พลังดาว 1 ดวง · จุดวงกลม=ดาวอยู่เหนือหัว · หมุดบ้าน=เมืองเกิด · ตั้ง=พลังเปิดเผย (อาชีพ/ตัวตน) · โค้ง=พลังภายใน (รากเหง้า/สัมพันธ์)
            </div>
            {error && <div className="p-3 rounded-xl text-[12.5px]" style={{background:"var(--red-soft)", color:"var(--red)"}}>{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-2xl py-3">
              {loading? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{STAGES[stage]}</span> : <><Sparkles size={15}/> สร้าง Atlas 40 เส้น + จัดอันดับ 189 เมือง</>}
            </button>
          </form>
        )}

        {lines && (
          <div className="mx-4 space-y-3 animate-in">
            <div className="card p-2 sm:p-3">
              <AtlasMap lines={lines} cities={ranked as any} onSelectCity={(c)=> window.open(`https://www.google.com/maps/search/${encodeURIComponent(c.nameEn)}`,"_blank")} />
            </div>

            {/* 189 เมือง Top 6 */}
            <div className="card p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2" style={{color:"var(--text-muted)"}}>เมืองที่ใช่ — Top 6 จาก 189 เมือง</div>
              <div className="space-y-2">
                {ranked.map((r,idx)=>(
                  <div key={r.city.nameEn} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: idx===0? "rgba(212,175,55,0.08)":"var(--bg)", border:`1px solid ${idx===0?"rgba(212,175,55,0.22)":"var(--border-subtle)"}`}}>
                    <span className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0" style={{ background: idx===0?"linear-gradient(135deg,#f6c944,#b8942a)":"var(--primary-soft)", color: idx===0?"#1a1025":"var(--primary)"}}>{idx+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold" style={{color:"var(--text)"}}>{r.city.nameTh} <span className="text-[11px] font-normal" style={{color:"var(--text-muted)"}}>({r.city.countryTh})</span></div>
                      <div className="text-[11px] flex items-center gap-1" style={{color:"var(--text-muted)"}}>{r.bestLine.labelTh} · {r.distKm.toFixed(0)} km · {r.orb==="intense"?<><Flame size={10} style={{color:"#f87171"}}/> เข้มข้น 0-250km</>:<><Layers size={10} style={{color:"var(--gold)"}}/> เจือจาง 250-1100km</>}</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: r.orb==="intense"?"rgba(239,68,68,0.12)":"rgba(212,175,55,0.12)", color: r.orb==="intense"?"#f87171":"var(--gold)"}}>{r.bestLine.angle}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2 text-center" style={{color:"var(--text-muted)"}}>เมืองใกลเส้นไหน × ดาวที่คุณชอบความหมาย = ที่นั่นจะดีกับคุณ</p>
            </div>

            {/* Saju */}
            {saju && (
              <div className="card p-4">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2" style={{color:"var(--text-muted)"}}>Saju × Atlas — ธาตุที่ขาดของคุณ</div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {(["wood","fire","earth","metal","water"] as const).map(el=>{
                    const cnt = saju.elementCountsWithHidden[el];
                    const isWeak = saju.weakest===el;
                    const Icon = ELEMENT_ICON[el];
                    const col = ELEMENT_COLOR[el];
                    return (
                      <div key={el} className="rounded-xl p-2 text-center flex flex-col items-center gap-1" style={{ background: isWeak?"rgba(239,68,68,0.08)":"var(--bg)", border:`1px solid ${isWeak?"rgba(239,68,68,0.22)":"var(--border-subtle)"}`}}>
                        <span className="w-7 h-7 rounded-full grid place-items-center" style={{ background: isWeak? "rgba(239,68,68,0.12)": `${col}14`, color: isWeak? "#f87171": col, border: `1px solid ${isWeak? "rgba(239,68,68,0.22)": `${col}22`}`}}><Icon size={13} /></span>
                        <div className="text-[11px] font-bold" style={{color: isWeak?"#f87171":"var(--text)"}}>{FIVE_ELEMENT_TH[el]}</div>
                        <div className="text-[11px] font-extrabold" style={{color: isWeak?"#f87171":"var(--primary)"}}>{cnt}</div>
                        {isWeak && <div className="text-[9px] font-bold px-1 py-0.5 rounded-full" style={{background:"rgba(239,68,68,0.12)", color:"#f87171"}}>ขาด</div>}
                      </div>
                    );
                  })}
                </div>
                <div className="p-2.5 rounded-xl text-[11.5px] flex items-center gap-2" style={{background:"var(--gold-soft)", color:"var(--gold)", border:"1px solid rgba(212,175,55,0.14)"}}>
                  {(()=>{ const Icon=ELEMENT_ICON[saju.weakest]; const col=ELEMENT_COLOR[saju.weakest]; return <span className="w-6 h-6 rounded-full grid place-items-center shrink-0" style={{background:`${col}14`, color:col, border:`1px solid ${col}22`}}><Icon size={12}/></span>; })()}
                  <span>{FIVE_ELEMENT_TH[saju.weakest]} ขาด → เสริมด้วย {remedy.join(", ") || "Jupiter/Venus"} · ดูเมืองที่เส้น {remedy.join("/")} ผ่านใกล้สุดใน Top 6 ข้างบน</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
                  {Object.entries(saju.pillars).map(([k, p]:any)=>(
                    <div key={k} className="rounded-xl p-2" style={{background:"var(--bg)", border:"1px solid var(--border-subtle)"}}>
                      <div className="text-[9px] font-bold uppercase" style={{color:"var(--text-muted)"}}>{k}</div>
                      <div className="text-[16px] font-extrabold" style={{color:"var(--text)"}}>{p.stem}{p.branch}</div>
                      <div className="text-[10px]" style={{color:"var(--text-muted)"}}>{p.stemHanja}{p.branchHanja}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10 ดาว archetype */}
            <div className="card p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2" style={{color:"var(--text-muted)"}}>10 ดาวเคราะห์ — แต่ละดวงมี archetype ต่างกัน</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  ["☉ อาทิตย์","ตัวตน ภาพลักษณ์"], ["☽ จันทร์","อารมณ์ บ้าน"], ["☿ พุธ","สื่อสาร ความคิด"], ["♀ ศุกร์","ความรัก ความงาม"], ["♂ อังคาร","พลัง ลงมือ"], ["♃ พฤหัส","โชค ขยาย"], ["♄ เสาร์","วินัย บทเรียน"], ["♅ ยูเรนัส","นวัตกรรม"], ["♆ เนปจูน","ฝัน จิตวิญญาณ"], ["♇ พลูโต","ทรานส์ฟอร์ม"]
                ].map(([a,b])=> <div key={a} className="flex gap-1.5"><span className="font-bold" style={{color:"var(--primary)"}}>{a}</span><span style={{color:"var(--text-muted)"}}>{b}</span></div>)}
              </div>
              <p className="text-[10.5px] mt-3 p-2 rounded-xl" style={{background:"var(--bg)", border:"1px solid var(--border-subtle)", color:"var(--text-muted)"}}>ตั้ง=พลังเปิดเผย (อาชีพ/ตัวตน) · โค้ง=พลังภายใน (รากเหง้า/สัมพันธ์) · ใช้ร่วมกับ Relocation Chart จะแม่นขึ้น — Atlas ให้ภาพกว้าง ส่วน Relocation ให้ภาพเรือนทั้ง 12 ใหม่ ณ เมืองปลายทาง (ต้องดูคู่กัน)</p>
            </div>

            {interpretation && (
              <div className="space-y-3">
                {parseSections(interpretation).map((sec,i)=>{
                  const iconMap:Record<string, any>={ "ภาพรวม": Sparkles, "เมืองอันดับ1": Navigation, "ธาตุและดาวเสริม": Heart, "คำแนะนำ": Lightbulb };
                  const Icon=iconMap[sec.title]|| Activity;
                  return (
                    <div key={sec.title} className="reading-journal-section" style={{animation:`fadeUp 0.45s var(--ease) ${i*0.06}s both`}}>
                      <div className="reading-journal-section-header"><span className="reading-journal-section-icon"><Icon size={13}/></span><h3 className="reading-journal-section-title">{sec.title}</h3><span className="reading-journal-section-line"/></div>
                      <p className="reading-journal-paragraph">{sec.content}</p>
                    </div>
                  );
                })}
                {!parseSections(interpretation).length && <div className="reading-journal-section"><p className="reading-journal-paragraph whitespace-pre-wrap">{interpretation}</p></div>}
              </div>
            )}

            <button onClick={()=>{ setLines(null); setRanked([]); setSaju(null); setInterpretation("");}} className="btn btn-ghost w-full rounded-2xl">เริ่มใหม่</button>
            <p className="text-[10px] text-center" style={{color:"var(--text-muted)"}}>อิง Jim Lewis (1941-1995) Astro*Carto*Graphy 1970s + astronomy-engine 0.02° · Tropical Whole Sign</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
