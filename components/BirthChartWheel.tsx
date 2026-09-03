"use client";

import { ZODIAC_SIGNS, type BirthChart, type PlanetPosition } from "@/lib/astrology";
import { HOUSE_MEANINGS_TH } from "@/lib/astrology/houses";
import { useState } from "react";

const signOrder = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"] as const;

const PLANET_META: Record<string, { th: string; color: string; short: string }> = {
  sun: { th: "อาทิตย์", color: "#f6c944", short: "☉" },
  moon: { th: "จันทร์", color: "#e8e6f0", short: "☽" },
  mercury: { th: "พุธ", color: "#fbbf24", short: "☿" },
  venus: { th: "ศุกร์", color: "#f472b6", short: "♀" },
  mars: { th: "อังคาร", color: "#ef4444", short: "♂" },
  jupiter: { th: "พฤหัส", color: "#a78bfa", short: "♃" },
  saturn: { th: "เสาร์", color: "#64748b", short: "♄" },
  uranus: { th: "มฤตยู", color: "#38bdf8", short: "♅" },
  neptune: { th: "เกตุ", color: "#34d399", short: "♆" },
  pluto: { th: "พลูโต", color: "#a3a3a3", short: "♇" },
};

function normalize(lon: number): number { return ((lon % 360)+360)%360; }
function polar(cx:number, cy:number, r:number, deg:number){ const rad=(deg-90)*Math.PI/180; return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad)}; }

export default function BirthChartWheel({ chart, size=360 }: { chart: BirthChart; size?: number }) {
  const [hover, setHover] = useState<PlanetPosition|null>(null);
  const cx=200, cy=200;
  const rOuter=168, rZodiacOuter=152, rZodiacInner=118, rHouseInner=92, rPlanet=104;
  const ascLon = chart.ascendant?.longitude ?? (()=>{ const idx=signOrder.indexOf(chart.rising as typeof signOrder[number]); return idx>=0? idx*30:0;})();
  // cusp for Whole Sign: cusp[i]=normalize(ascSignStart + i*30)
  const ascSignStart = Math.floor(normalize(ascLon)/30)*30;
  const cusps = chart.cusps ?? Array.from({length:12}, (_,i)=> normalize(ascSignStart + i*30));

  // jitter for planets sharing same house to avoid overlap
  const houseCounts: Record<number, number> = {};
  const planetsWithOffset = chart.planets.map((p)=>{
    const h = p.house ?? 1;
    const n = houseCounts[h] ?? 0;
    houseCounts[h] = n+1;
    const jitter = n===0?0: (n%2===1? 10: -10) + Math.floor(n/2)*4;
    const rOff = n===0?0: (n>1? (n%2? -8:8):0);
    return { p, jitter, rOff };
  });

  return (
    <div className="w-full flex flex-col items-center gap-3" style={{ maxWidth: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 400 400" width={size} height={size} className="overflow-visible" style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.45))" }}>
          <defs>
            <radialGradient id="wheelBg" cx="50%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#1e0e3a" />
              <stop offset="45%" stopColor="#14082a" />
              <stop offset="85%" stopColor="#0a0614" />
              <stop offset="100%" stopColor="#07050d" />
            </radialGradient>
            <radialGradient id="zodiacGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(167,139,250,0.10)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.02)" />
            </radialGradient>
            <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f6c944" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#b8942a" />
            </linearGradient>
            <filter id="glow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(212,175,55,0.35)" />
            </filter>
          </defs>

          {/* starfield dots */}
          <g opacity={0.22}>
            {Array.from({length:18}).map((_,i)=>{
              const a = (i*67)%360, r= rOuter+6 + (i%3)*4;
              const p = polar(cx,cy,r,a);
              return <circle key={i} cx={p.x} cy={p.y} r={i%4===0?1.1:0.7} fill="white" opacity={0.9} />
            })}
          </g>

          {/* outer rim */}
          <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheelBg)" stroke="url(#goldStroke)" strokeWidth={1.6} />
          <circle cx={cx} cy={cy} r={rOuter-3} fill="none" stroke="rgba(201,168,76,0.18)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={rOuter-6} fill="none" stroke="rgba(201,168,76,0.09)" strokeWidth={0.8} />

          {/* zodiac ring background */}
          <circle cx={cx} cy={cy} r={(rZodiacOuter+rZodiacInner)/2} fill="none" stroke="url(#goldStroke)" strokeWidth={0} />
          {/* 12 segments */}
          {cusps.map((cusp, i)=>{
            const start = 180 - normalize(cusp - ascLon); // Whole Sign cusp angle
            // segment from cusp to next cusp
            const end = 180 - normalize(cusps[(i+1)%12] - ascLon);
            // For Whole Sign each 30°, we can draw wedge via path
            const p1 = polar(cx,cy,rZodiacOuter, start);
            const p2 = polar(cx,cy,rZodiacOuter, end);
            const p3 = polar(cx,cy,rZodiacInner, end);
            const p4 = polar(cx,cy,rZodiacInner, start);
            const isEven = i%2===0;
            return (
              <path key={i} d={`M ${p1.x} ${p1.y} A ${rZodiacOuter} ${rZodiacOuter} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rZodiacInner} ${rZodiacInner} 0 0 1 ${p4.x} ${p4.y} Z`}
                fill={isEven? "rgba(18,13,32,0.9)":"rgba(14,10,24,0.92)"} stroke="rgba(212,175,55,0.14)" strokeWidth={0.9}
              />
            );
          })}

          {/* house lines (12) */}
          {cusps.map((cusp,i)=>{
            const ang = 180 - normalize(cusp - ascLon);
            const pO = polar(cx,cy,rOuter-1, ang);
            const pI = polar(cx,cy,rHouseInner, ang);
            return <line key={`h-${i}`} x1={pO.x} y1={pO.y} x2={pI.x} y2={pI.y} stroke={i===0? "url(#goldStroke)":"rgba(212,175,55,0.18)"} strokeWidth={i===0?1.6:0.9} opacity={i===0?1:0.9} />
          })}

          {/* inner circle */}
          <circle cx={cx} cy={cy} r={rHouseInner} fill="rgba(7,5,13,0.55)" stroke="rgba(201,168,76,0.14)" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={rHouseInner-10} fill="none" stroke="rgba(167,139,250,0.08)" strokeWidth={0.8} strokeDasharray="2 6" />

          {/* zodiac glyphs */}
          {ZODIAC_SIGNS.map((z, idx)=>{
            const cuspLon = normalize(ascSignStart + idx*30);
            const midLon = normalize(cuspLon + 15);
            const ang = 180 - normalize(midLon - ascLon);
            const p = polar(cx,cy, (rZodiacOuter+rZodiacInner)/2, ang);
            const isAscSign = idx===0;
            return (
              <g key={z.id}>
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={16} style={{ filter: isAscSign? "drop-shadow(0 0 6px rgba(212,175,55,0.6))":"none" }} fill={isAscSign? "#f6c944": "rgba(232,230,240,0.92)"} fontWeight={700}>{z.symbol}</text>
                <text x={polar(cx,cy, (rZodiacOuter+rZodiacInner)/2 + 18, ang).x} y={polar(cx,cy, (rZodiacOuter+rZodiacInner)/2 + 18, ang).y} textAnchor="middle" dominantBaseline="central" fontSize={7.5} letterSpacing={0.6} fill="rgba(255,255,255,0.42)" fontWeight={700}>{String(idx+1)}</text>
              </g>
            );
          })}

          {/* ascendant marker */}
          {(() => {
            const ang = 180; // left
            const p = polar(cx,cy,rOuter+10, ang);
            const p2 = polar(cx,cy,rOuter+2, ang);
            return (
              <g>
                <line x1={p2.x} y1={p2.y} x2={p.x} y2={p.y} stroke="#f6c944" strokeWidth={1.6} />
                <g transform={`translate(${p.x},${p.y})`}>
                  <rect x={-14} y={-9} width={28} height={14} rx={7} fill="#f6c944" stroke="#b8942a" strokeWidth={0.8} />
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={7.5} fontWeight={800} fill="#1a1025" letterSpacing={0.8}>ASC</text>
                </g>
              </g>
            );
          })()}

          {/* planets */}
          {planetsWithOffset.map(({p,jitter,rOff})=>{
            const delta = normalize(p.longitude - ascLon);
            const ang = 180 - delta + jitter*0.6;
            const pr = rPlanet + rOff;
            const pos = polar(cx,cy,pr, ang);
            const meta = PLANET_META[p.planet] ?? { th: p.planet, color: "#a78bfa", short: "•" };
            const isHover = hover?.planet===p.planet && hover?.sign===p.sign && hover?.degree===p.degree;
            return (
              <g key={p.planet} onMouseEnter={()=>setHover(p)} onMouseLeave={()=>setHover(null)} style={{ cursor:"pointer" }} >
                {/* line to center */}
                <line x1={pos.x} y1={pos.y} x2={polar(cx,cy,rHouseInner+6, ang).x} y2={polar(cx,cy,rHouseInner+6, ang).y} stroke={meta.color} strokeOpacity={0.22} strokeWidth={0.8} strokeDasharray="2 3" />
                <circle cx={pos.x} cy={pos.y} r={isHover?14:11} fill={isHover? meta.color:"rgba(18,13,32,0.96)"} stroke={meta.color} strokeWidth={isHover?2:1.4} style={{ filter: isHover? "drop-shadow(0 0 8px rgba(212,175,55,0.45))":"drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }} />
                <text x={pos.x} y={pos.y+0.5} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={800} fill={isHover? "#0a0614": meta.color}>{meta.short}</text>
                {p.retrograde && <text x={pos.x+8} y={pos.y-9} fontSize={7} fontWeight={800} fill="#ef4444">℞</text>}
              </g>
            );
          })}

          {/* center mandala */}
          <g>
            <circle cx={cx} cy={cy} r={36} fill="rgba(18,13,32,0.92)" stroke="rgba(201,168,76,0.22)" strokeWidth={1.2} />
            <circle cx={cx} cy={cy} r={30} fill="none" stroke="rgba(201,168,76,0.14)" strokeWidth={0.9} />
            <circle cx={cx} cy={cy} r={22} fill="none" stroke="rgba(167,139,250,0.10)" strokeWidth={0.8} />
            {/* star */}
            <path d={(() => {
              const pts: string[]=[]; const R=14, r=6;
              for(let i=0;i<10;i++){ const a=(i*36-90)*Math.PI/180; const rr=i%2===0?R:r; pts.push(`${cx+rr*Math.cos(a)},${cy+rr*Math.sin(a)}`); }
              return `M ${pts.join(" L ")} Z`;
            })()} fill="rgba(201,168,76,0.14)" stroke="rgba(201,168,76,0.32)" strokeWidth={0.9} />
            <circle cx={cx} cy={cy} r={2.6} fill="#f6c944" style={{ filter:"drop-shadow(0 0 6px rgba(212,175,55,0.7))"}} />
            <line x1={cx-18} y1={cy} x2={cx+18} y2={cy} stroke="rgba(201,168,76,0.18)" strokeWidth={0.7} />
            <line x1={cx} y1={cy-18} x2={cx} y2={cy+18} stroke="rgba(201,168,76,0.18)" strokeWidth={0.7} />
            <text x={cx} y={cy+46} textAnchor="middle" fontSize={7} letterSpacing={1.6} fontWeight={800} fill="rgba(255,255,255,0.28)">SEALO</text>
          </g>
        </svg>

        {/* hover tooltip */}
        {hover && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-2" style={{ background:"rgba(18,13,32,0.92)", color:"white", border:"1px solid rgba(212,175,55,0.22)", backdropFilter:"blur(8px)" }}>
              <span style={{ color: PLANET_META[hover.planet]?.color }}>{PLANET_META[hover.planet]?.short}</span>
              {PLANET_META[hover.planet]?.th} · {ZODIAC_SIGNS.find(z=>z.id===hover.sign)?.nameTh} {hover.degree}° {hover.house?`· เรือน ${hover.house}`:""} {hover.retrograde?"℞":""}
            </div>
          </div>
        )}
      </div>

      {/* house legend */}
      <div className="w-full grid grid-cols-3 gap-1.5">
        {chart.cusps?.slice(0,6).map((_,i)=>{
          const meanings = HOUSE_MEANINGS_TH[i+1];
          const hasPlanet = chart.planets.some(p=>p.house===i+1);
          return (
            <div key={i} className="rounded-xl px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: hasPlanet? "rgba(167,139,250,0.08)":"var(--bg-card)", border:`1px solid ${hasPlanet?"rgba(167,139,250,0.16)":"var(--border-subtle)"}`}}>
              <span className="text-[9px] font-extrabold w-5 h-5 rounded-full grid place-items-center shrink-0" style={{ background: hasPlanet? "var(--primary)":"var(--bg)", color: hasPlanet?"white":"var(--text-muted)" }}>{i+1}</span>
              <span className="text-[10.5px] font-semibold truncate" style={{ color:"var(--text)" }}>{meanings.th.split("·")[0]?.trim()}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-center" style={{ color:"var(--text-muted)"}}>Whole Sign · ลัคนา {chart.ascendant? `${ZODIAC_SIGNS.find(z=>z.id===chart.ascendant!.sign)?.nameTh} ${chart.ascendant.degree}°` : chart.rising? ZODIAC_SIGNS.find(z=>z.id===chart.rising)?.nameTh:""} · {chart.timezone} · บ้านคือราศี </p>
    </div>
  );
}
