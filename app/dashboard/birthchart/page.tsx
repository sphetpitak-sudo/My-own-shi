"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import BirthChartWheel from "@/components/BirthChartWheel";
import { Compass, Calendar, Clock, MapPin, Sparkles, Lock, Heart, Briefcase, Lightbulb, Activity, Navigation, Globe, Search } from "lucide-react";
import { ZODIAC_SIGNS, type BirthChart } from "@/lib/astrology";
import { stripMarkdownMultiline } from "@/lib/text";
import { suggestPlaces } from "@/lib/geocoding";

const STAGES = ["กำลังคำนวณตำแหน่งดาว...", "กำลังแมปแผนที่ดวงดาว...", "กำลังเตรียมคำทำนาย..."];

function parseBCSections(raw: string) {
  const text = stripMarkdownMultiline(raw);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const headings = ["ภาพรวม", "ตัวตน", "อารมณ์", "การงาน", "ความรัก", "คำแนะนำ"] as const;
  const buckets: Record<string, string[]> = {};
  let cur: string | null = null;
  const re = new RegExp(`^(${headings.join("|")})\\s*[:：]`);
  for (const line of lines) {
    const m = line.replace(/^[-•\d.\s]+/, "").match(re);
    if (m) { cur = m[1]!; buckets[cur] = []; const rest = line.replace(re, "").trim().replace(/^[:：\s]+/, ""); if (rest) buckets[cur].push(rest); continue; }
    if (!cur) { cur = "ภาพรวม"; buckets[cur] = buckets[cur] || []; }
    buckets[cur]!.push(line);
  }
  return headings.map(h => buckets[h]?.join(" ").trim() ? { title: h, content: buckets[h].join(" ") } : null).filter(Boolean) as { title: string; content: string }[];
}

export default function BirthChartPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [geo, setGeo] = useState<{ lat:number; lon:number; displayName:string }|null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{
    if(place.trim().length>=1){
      setSuggestions(suggestPlaces(place));
    } else setSuggestions([]);
  },[place]);

  // lightweight client geocode via Nominatim for precise wheel outside Thai DB
  async function resolveGeo(q:string){
    const trimmed=q.trim();
    if(!trimmed) return null;
    try{
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}&accept-language=th,en`, { headers: { "Accept":"application/json" }});
      if(!r.ok) return null;
      const j = await r.json() as Array<{lat:string; lon:string; display_name:string}>;
      if(j[0]) return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon), displayName: j[0].display_name };
    }catch{}
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !time || !place.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setLoading(true);
    setStage(0);
    const t1 = setInterval(() => setStage(s => Math.min(s + 1, 2)), 900);
    try {
      let lat:number|undefined, lon:number|undefined, tzOffsetMinutes:number|undefined;
      // use selected geo if matches place, otherwise try resolve
      if(geo && place.includes(geo.displayName.split(",")[0]!)){
        lat=geo.lat; lon=geo.lon;
      } else {
        const g = await resolveGeo(place.trim());
        if(g){ lat=g.lat; lon=g.lon; setGeo(g);
          // guess offset: Thailand +07, Japan +09, SG +08, UTC 0 else Bangkok
          const d = g.displayName.toLowerCase();
          if(d.includes("japan")||d.includes("tokyo")) tzOffsetMinutes=540;
          else if(d.includes("singapore")) tzOffsetMinutes=480;
          else if(d.includes("london")||d.includes("united kingdom")) tzOffsetMinutes=0;
          else if(d.includes("thailand")||d.includes("bangkok")||d.includes("chiang")) tzOffsetMinutes=420;
        }
      }
      const res = await fetch("/api/birthchart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, time, place: place.trim(), lat, lon, tzOffsetMinutes }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "คำนวณไม่สำเร็จ");
      setChart(data.chart);
      setInterpretation(data.interpretation || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถคำนวณได้");
    } finally {
      clearInterval(t1);
      setLoading(false);
    }
  }

  const signMeta = chart ? ZODIAC_SIGNS.find((s) => s.id === chart.sun.sign) : null;

  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="step-header">
          <p className="step-eyebrow">ดาราศาสตร์ · AI + Astronomy</p>
          <h1 className="step-title">แผนที่ดวงดาวส่วนบุคคล</h1>
          <p className="step-sub">
            กรอกวัน เวลา และสถานที่เกิด — เราคำนวณตำแหน่งดาวจริง 10 ดวง + ลัคนา + เรือนทั้ง 12 แบบแผนที่วงล้อจริง
          </p>
        </div>

        {!chart && (
          <form onSubmit={handleSubmit} className="mx-4 space-y-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass size={16} style={{ color: "var(--primary)" }} />
                <div className="text-[12.5px] font-bold" style={{ color: "var(--text)" }}>
                  ข้อมูลการเกิดของคุณ
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="bc-date">
                    <Calendar size={11} /> วันเกิด
                  </label>
                  <input
                    id="bc-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                    required
                    style={{ fontSize: 16 }}
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1.5" htmlFor="bc-time">
                    <Clock size={11} /> เวลาเกิด (ถ้าไม่แน่ใจใส่ 12:00)
                  </label>
                  <input
                    id="bc-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input"
                    required
                    style={{ fontSize: 16 }}
                  />
                  <p className="text-[10.5px] mt-1" style={{ color:"var(--text-muted)"}}>เวลาตรงยิ่งแม่น — ลัคนาเปลี่ยนทุก ~2 ชม.</p>
                </div>

                <div className="relative">
                  <label className="label flex items-center gap-1.5" htmlFor="bc-place">
                    <MapPin size={11} /> สถานที่เกิด
                  </label>
                  <div className="relative">
                    <input
                      id="bc-place"
                      type="text"
                      value={place}
                      onChange={(e) => { setPlace(e.target.value); setShowSug(true); setGeo(null); }}
                      onFocus={()=> setShowSug(true)}
                      onBlur={()=> setTimeout(()=> setShowSug(false),160)}
                      placeholder="เช่น เชียงใหม่, Bangkok, Tokyo, Singapore"
                      className="input pr-9"
                      required
                      style={{ fontSize: 16 }}
                      autoComplete="off"
                    />
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:"var(--text-muted)"}} />
                  </div>
                  {showSug && suggestions.length>0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden border shadow-lg" style={{ background:"var(--bg-card)", borderColor:"var(--border)"}}>
                      {suggestions.map(s=>(
                        <button key={s} type="button" onClick={()=>{ setPlace(s); setShowSug(false); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--bg)] flex items-center gap-2">
                          <Globe size={12} style={{ color:"var(--primary)"}} />{s}
                        </button>
                      ))}
                    </div>
                  )}
                  {geo && <p className="text-[10.5px] mt-1 flex items-center gap-1" style={{ color:"var(--primary)"}}><Navigation size={11}/> พบ: {geo.displayName.slice(0,60)}</p>}
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-xl text-[11.5px] flex items-start gap-2"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Lock size={13} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>ทำไมต้องใช้ข้อมูลเหล่านี้?</strong>{" "}
                ตำแหน่งดาว ลัคนา และเรือนทั้ง 12 คำนวณจากพิกัดละติจูด/ลองจิจูดและ timezone จริง (แก้แล้ว +07:00 สำหรับไทย) — ข้อมูลใช้คำนวณเท่านั้น
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-[12.5px]" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full rounded-2xl py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {STAGES[stage]}
                </span>
              ) : (
                <>
                  <Sparkles size={15} /> สร้างแผนที่ดวงดาว + คำทำนาย AI
                </>
              )}
            </button>
          </form>
        )}

        {chart && signMeta && (
          <div className="mx-4 space-y-3 animate-in">
            {/* Wheel — real map */}
            <div className="card p-3 sm:p-4 flex justify-center overflow-hidden" style={{ background:"radial-gradient(600px 300px at 50% 0%, rgba(167,139,250,0.08), transparent), var(--bg-card)"}}>
              <BirthChartWheel chart={chart} size={360} />
            </div>
            {/* meta bar */}
            <div className="flex flex-wrap gap-1.5 text-[10.5px]">
              <span className="px-2.5 py-1 rounded-full font-bold flex items-center gap-1" style={{ background:"var(--primary-soft)", color:"var(--primary)", border:"1px solid rgba(167,139,250,0.14)"}}><Compass size={11}/> ลัคนา {ZODIAC_SIGNS.find(z=>z.id===chart.ascendant?.sign)?.nameTh ?? ZODIAC_SIGNS.find(z=>z.id===chart.rising)?.nameTh} {chart.ascendant? `${chart.ascendant.degree}°`:""}</span>
              <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-muted)"}}><MapPin size={11} className="inline -mt-0.5 mr-1"/>{chart.lat.toFixed(2)}, {chart.lon.toFixed(2)} · {chart.timezone}</span>
            </div>

            {/* Sun sign hero */}
            <div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, rgba(129,140,248,0.10) 0%, rgba(99,102,241,0.04) 100%)",
                border: "1px solid rgba(129,140,248,0.18)",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(129,140,248,0.18), transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div className="relative">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "#818cf8" }}
                >
                  ราศีดวงอาทิตย์ · เรือน {chart.sun.house ?? "-"}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
                    style={{
                      background: "rgba(129,140,248,0.15)",
                      color: "#818cf8",
                      border: "1px solid rgba(129,140,248,0.2)",
                    }}
                  >
                    {signMeta.symbol}
                  </div>
                  <div>
                    <div className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>
                      {signMeta.nameTh} {chart.sun.degree}°
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                      {signMeta.range} · {chart.sun.retrograde? "พักร":""}
                    </div>
                  </div>
                  <div className="ml-auto hidden sm:flex flex-col items-end">
                    <span className="text-[11px] px-2 py-1 rounded-full font-bold" style={{ background:"rgba(212,175,55,0.12)", color:"var(--gold)"}}>☉ อาทิตย์</span>
                    <span className="text-[10px] mt-1" style={{ color:"var(--text-muted)"}}>{chart.timezone} UTC{chart.tzOffsetMinutes>=0?"+":""}{Math.floor(chart.tzOffsetMinutes/60)}:{String(Math.abs(chart.tzOffsetMinutes%60)).padStart(2,"0")}</span>
                  </div>
                </div>
                <p className="text-[13.5px] mt-3" style={{ color: "var(--text-secondary)" }}>
                  {chart.summary.personalityTh}
                </p>
              </div>
            </div>

            {/* Planets */}
            <div className="card p-4">
              <div
                className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2 flex items-center justify-between"
                style={{ color: "var(--text-muted)" }}
              >
                <span>ตำแหน่งดาวเคราะห์ · องศา + เรือน</span>
                <span className="text-[10px] font-semibold normal-case tracking-normal" style={{ color:"var(--text-muted)"}}>℞ = พักร</span>
              </div>
              <div className="space-y-1.5">
                {chart.planets.map((p) => {
                  const s = ZODIAC_SIGNS.find((z) => z.id === p.sign);
                  return (
                    <div key={p.planet} className="flex items-center gap-2 py-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0"
                        style={{ background: "var(--bg)" }}
                      >
                        {s?.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-bold capitalize flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                          {p.planet} <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:"var(--primary-soft)", color:"var(--primary)"}}>เรือน {p.house ?? "-"}</span> {p.retrograde && <span className="text-[10px] font-bold text-red-500">℞</span>}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {s?.nameTh} {p.degree}° · {p.longitude.toFixed(2)}° · {s?.symbol}
                        </div>
                      </div>
                      <div className="text-[11px] font-bold" style={{ color:"var(--gold)"}}>{p.degree}°</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths / challenges */}
            {(chart.summary.strengthsTh.length>0 || chart.summary.challengesTh.length>0) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="card p-4">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
                  style={{ color: "var(--green)" }}
                >
                  จุดแข็ง
                </div>
                <ul className="space-y-1">
                  {chart.summary.strengthsTh.map((s) => (
                    <li key={s} className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--green)" }}>·</span> {s}
                    </li>
                  ))}
                  {chart.summary.strengthsTh.length===0 && <li className="text-[11px]" style={{ color:"var(--text-muted)"}}>—</li>}
                </ul>
              </div>
              <div className="card p-4">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-2"
                  style={{ color: "#fbbf24" }}
                >
                  จุดที่ต้องระวัง
                </div>
                <ul className="space-y-1">
                  {chart.summary.challengesTh.map((c) => (
                    <li key={c} className="text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                      <span style={{ color: "#fbbf24" }}>·</span> {c}
                    </li>
                  ))}
                  {chart.summary.challengesTh.length===0 && <li className="text-[11px]" style={{ color:"var(--text-muted)"}}>—</li>}
                </ul>
              </div>
            </div>
            )}

            {interpretation && (
              <div className="space-y-3">
                {parseBCSections(interpretation).map((sec, i) => {
                  const iconMap: Record<string, typeof Sparkles> = { "ภาพรวม": Sparkles, "ตัวตน": Compass, "อารมณ์": Heart, "การงาน": Briefcase, "ความรัก": Heart, "คำแนะนำ": Lightbulb };
                  const Icon = iconMap[sec.title] || Activity;
                  return (
                    <div key={sec.title} className="reading-journal-section" style={{ animation: `fadeUp 0.45s var(--ease) ${i * 0.06}s both` }}>
                      <div className="reading-journal-section-header">
                        <span className="reading-journal-section-icon"><Icon size={13} /></span>
                        <h3 className="reading-journal-section-title">{sec.title}</h3>
                        <span className="reading-journal-section-line" />
                      </div>
                      <p className="reading-journal-paragraph">{sec.content}</p>
                    </div>
                  );
                })}
                {!parseBCSections(interpretation).length && (
                  <div className="reading-journal-section"><p className="reading-journal-paragraph whitespace-pre-wrap">{interpretation}</p></div>
                )}
              </div>
            )}

            <button
              onClick={() => { setChart(null); setInterpretation(""); }}
              className="btn btn-ghost w-full rounded-2xl"
            >
              เริ่มใหม่
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
