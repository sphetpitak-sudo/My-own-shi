/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
"use client";

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import type { AtlasLine } from "@/lib/atlas/calcLines";
import type { AtlasCity } from "@/lib/atlas/cities";
// @ts-ignore
import world from "world-atlas/countries-110m.json";

const PLANET_COLOR: Record<string, string> = {
  sun: "#f6c944", moon: "#e8e6f0", mercury: "#fbbf24", venus: "#f472b6", mars: "#ef4444",
  jupiter: "#a78bfa", saturn: "#64748b", uranus: "#38bdf8", neptune: "#34d399", pluto: "#a3a3a3",
};

export default function AtlasMap({ lines, cities, onSelectCity }: { lines: AtlasLine[]; cities?: Array<{ city: AtlasCity; bestLine: { planet:string; angle:string; longitude:number; labelTh?:string }; distKm:number; orb:"intense"|"soft"|"none"}>; onSelectCity?: (c: AtlasCity)=>void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(new Set());
  const width = 960, height = 480;
  const projection = useMemo(() => geoNaturalEarth1().scale(width/6.2).translate([width/2, height/2]), []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const land = feature(world as any, (world as any).objects.countries) as any;
  const graticule = useMemo(() => geoGraticule().step([30,30])(), []);

  const togglePlanet = (p:string)=>{
    const s=new Set(selectedPlanets);
    if(s.has(p)) s.delete(p); else s.add(p);
    setSelectedPlanets(s);
  };
  const visibleLines = lines.filter(l=> selectedPlanets.size===0 || selectedPlanets.has(l.planet));

  return (
    <div className="w-full flex flex-col gap-3">
      {/* planet filter */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from(new Set(lines.map(l=>l.planet))).map(p=>{
          const active = selectedPlanets.has(p) || selectedPlanets.size===0;
          return (
            <button key={p} onClick={()=>togglePlanet(p)} className="text-[11px] px-2.5 py-1 rounded-full font-bold border" style={{ background: active? PLANET_COLOR[p] ?? "var(--primary)": "var(--bg-card)", color: active? "#0a0614":"var(--text-muted)", borderColor: active? (PLANET_COLOR[p]??"var(--primary)"): "var(--border)"}}>{p}</button>
          );
        })}
        {selectedPlanets.size>0 && <button onClick={()=>setSelectedPlanets(new Set())} className="text-[11px] px-2 py-1 rounded-full" style={{ color:"var(--primary)"}}>ล้าง</button>}
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor:"rgba(212,175,55,0.16)", background:"radial-gradient(600px 300px at 50% 0%, rgba(167,139,250,0.08), #07050d)"}}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="block">
          <defs>
            <radialGradient id="seaGrad" cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#170d2c" />
              <stop offset="100%" stopColor="#07050d" />
            </radialGradient>
            <linearGradient id="goldStrokeAtlas" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f6c944" />
              <stop offset="100%" stopColor="#b8942a" />
            </linearGradient>
            <filter id="atlasGlow"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(212,175,55,0.32)" /></filter>
          </defs>
          <rect x={0} y={0} width={width} height={height} fill="url(#seaGrad)" />
          {/* graticule */}
          <path d={path(graticule as any) || ""} fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth={0.7} strokeDasharray="2 6" />
          {/* land */}
          <path d={path(land as any) || ""} fill="#120d20" stroke="rgba(212,175,55,0.14)" strokeWidth={0.9} />
          {/* lines */}
          {visibleLines.map((line, idx)=>{
            const color = PLANET_COLOR[line.planet] ?? "#a78bfa";
            const isVertical = !line.points; // MC/IC
            const isHover = hover===`${line.planet}-${line.angle}`;
            if (isVertical) {
              const geoLine = { type:"LineString", coordinates: [[line.longitude, -85],[line.longitude, 85]] } as any;
              const d = path(geoLine as any) || "";
              return (
                <g key={`${line.planet}-${line.angle}-${idx}`} onMouseEnter={()=>setHover(`${line.planet}-${line.angle}`)} onMouseLeave={()=>setHover(null)} style={{ cursor:"pointer"}}>
                  {/* outer soft orb 250-1100 ~9.9° ~14px */}
                  <path d={d} fill="none" stroke={color} strokeWidth={14} strokeOpacity={0.07} strokeLinecap="round" />
                  {/* intimate 0-250 ~2.25° */}
                  <path d={d} fill="none" stroke={color} strokeWidth={isHover?2.4:1.6} strokeOpacity={0.92} style={{ filter: isHover? "url(#atlasGlow)": undefined }} />
                  {isHover && <path d={d} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.22} strokeDasharray="3 5" />}
                </g>
              );
            } else {
              // curved AC/DC
              const coords = line.points!.map(p=>[p.lon, p.lat] as [number,number]);
              const geo = { type:"LineString", coordinates: coords } as any;
              const d = path(geo as any) || "";
              return (
                <g key={`${line.planet}-${line.angle}-${idx}`} onMouseEnter={()=>setHover(`${line.planet}-${line.angle}`)} onMouseLeave={()=>setHover(null)} style={{ cursor:"pointer"}}>
                  <path d={d} fill="none" stroke={color} strokeWidth={12} strokeOpacity={0.06} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={color} strokeWidth={isHover?2.4:1.4} strokeOpacity={0.9} strokeDasharray={line.angle==="AC"?"0":"6 4"} style={{ filter: isHover? "url(#atlasGlow)": undefined }} />
                </g>
              );
            }
          })}
          {/* house pin (birth place) if cities include it */}
          {/* legend hover label */}
          {hover && (
            <g>
              <rect x={width/2-60} y={12} width={120} height={22} rx={11} fill="rgba(18,13,32,0.92)" stroke="rgba(212,175,55,0.22)" />
              <text x={width/2} y={26} textAnchor="middle" fontSize={11} fontWeight={800} fill="#f6c944">{hover}</text>
            </g>
          )}
        </svg>
      </div>

      {/* city dots overlay - simple list of cities near lines with dots */}
      {cities && cities.length>0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cities.slice(0,6).map(({ city, bestLine, distKm, orb })=>{
            const c = PLANET_COLOR[bestLine.planet] ?? "#a78bfa";
            const label = (bestLine as { labelTh?: string }).labelTh ?? `${bestLine.planet}-${bestLine.angle}`;
            return (
              <button key={city.nameEn} onClick={()=>onSelectCity?.(city)} className="card p-3 text-left hover:border-[var(--primary)] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background:c, boxShadow:`0 0 6px ${c}`}} />
                  <span className="text-[12px] font-bold" style={{ color:"var(--text)"}}>{city.nameTh}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto" style={{ background: orb==="intense"?"rgba(239,68,68,0.12)": orb==="soft"?"rgba(212,175,55,0.12)":"var(--bg)", color: orb==="intense"?"#f87171": orb==="soft"?"var(--gold)":"var(--text-muted)", border:`1px solid ${orb==="intense"?"rgba(239,68,68,0.22)": orb==="soft"?"rgba(212,175,55,0.16)":"var(--border)"}`}}>{orb==="intense"?"เข้มข้น":orb==="soft"?"เจือจาง":"ไกล"}</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color:"var(--text-muted)"}}>{label} · {distKm.toFixed(0)} km</div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-center" style={{ color:"var(--text-muted)"}}>MC/IC = เส้นตั้ง · AC/DC = เส้นโค้ง · เข้มข้น 0-250km · เจือจาง 250-1100km · อิง Jim Lewis / astronomy-engine 0.02°</p>
    </div>
  );
}
