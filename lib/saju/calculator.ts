// Textbook Saju (사주) — Four Pillars with Five Elements (오행)
// Uses lunar-javascript for lunisolar + jeolgi accurate month pillar
// Stem → element, Branch → hidden stems → element counts, weakest = min count

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
import type { FiveElement, SajuChart, SajuPillar } from "./types";

// 10 heavenly stems → element
const STEM_ELEMENT: Record<string, FiveElement> = {
  "갑": "wood", "을": "wood",
  "병": "fire", "정": "fire",
  "무": "earth", "기": "earth",
  "경": "metal", "신": "metal",
  "임": "water", "계": "water",
  // Chinese variants (lunar-javascript returns Chinese)
  "甲": "wood", "乙": "wood",
  "丙": "fire", "丁": "fire",
  "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal",
  "壬": "water", "癸": "water",
};

// 12 branches → main element (for quick) + hidden stems map for precise
const BRANCH_MAIN: Record<string, FiveElement> = {
  "인": "wood", "묘": "wood", // 寅卯
  "사": "fire", "오": "fire", // 巳午
  "진": "earth", "술": "earth", "축": "earth", "미": "earth", // 辰戌丑未
  "신": "metal", "유": "metal", // 申酉
  "해": "water", "자": "water", // 亥子
  // Chinese
  "寅": "wood", "卯": "wood",
  "巳": "fire", "午": "fire",
  "辰": "earth", "戌": "earth", "丑": "earth", "未": "earth",
  "申": "metal", "酉": "metal",
  "亥": "water", "子": "water",
};

// Hidden stems per branch (지장간) — 2-3 stems, weight 1 each for counts
const BRANCH_HIDDEN: Record<string, string[]> = {
  "자": ["임","계"], "子": ["壬","癸"],
  "축": ["기","계","신"], "丑": ["己","癸","辛"],
  "인": ["무","병","갑"], "寅": ["戊","丙","甲"],
  "묘": ["갑","을"], "卯": ["甲","乙"],
  "진": ["을","계","무"], "辰": ["乙","癸","戊"],
  "사": ["무","경","병"], "巳": ["戊","庚","丙"],
  "오": ["병","기","정"], "午": ["丙","己","丁"],
  "미": ["정","을","기"], "未": ["丁","乙","己"],
  "신": ["무","임","경"], "申": ["戊","壬","庚"],
  "유": ["경","신"], "酉": ["庚","辛"],
  "술": ["신","정","무"], "戌": ["辛","丁","戊"],
  "해": ["무","갑","임"], "亥": ["戊","甲","壬"],
};

function countElements(pillars: { year: SajuPillar; month: SajuPillar; day: SajuPillar; hour: SajuPillar }): { counts: Record<FiveElement, number>; countsWithHidden: Record<FiveElement, number> } {
  const counts: Record<FiveElement, number> = { wood:0, fire:0, earth:0, metal:0, water:0 };
  const withHidden = { wood:0, fire:0, earth:0, metal:0, water:0 } as Record<FiveElement, number>;
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    const se = STEM_ELEMENT[p.stem] ?? STEM_ELEMENT[p.stemHanja];
    if (se) { counts[se]++; withHidden[se]++; }
    const be = BRANCH_MAIN[p.branch] ?? BRANCH_MAIN[p.branchHanja] ?? BRANCH_MAIN[p.branch];
    if (be) { counts[be]++; }
    const hidden = BRANCH_HIDDEN[p.branch] ?? BRANCH_HIDDEN[p.branchHanja] ?? [];
    for (const h of hidden) {
      const he = STEM_ELEMENT[h];
      if (he) withHidden[he]++;
    }
  }
  return { counts, countsWithHidden: withHidden };
}

export async function calculateSaju(date: string, time: string, _place: string, _lat?: number, _lon?: number): Promise<SajuChart> {
  // Dynamic import lunar-javascript (ESM compatible via require)
  // lunar-javascript exposes Solar.fromYmdHms
  // Use true solar time correction omitted for now; use wall time KST/Bangkok as is (textbook allows ±30min tolerance)
  // @ts-ignore
  const mod = await import("lunar-javascript");
  // @ts-ignore
  const Solar = mod.Solar ?? mod.default?.Solar;
  const [y,m,d] = date.split("-").map(Number);
  const [hh,mm] = time.split(":").map(Number);
  if (!Solar) throw new Error("lunar-javascript not available");
  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
  const lunar = solar.getLunar();
  const eight = lunar.getEightChar(); // Four pillars
  // eight.getYear() etc return strings like "甲辰"
  const yearGanZhi = eight.getYear(); // e.g. "甲辰"
  const monthGanZhi = eight.getMonth();
  const dayGanZhi = eight.getDay();
  const timeGanZhi = eight.getTime();

  function toPillar(gz: string): SajuPillar {
    const stem = gz[0] ?? "";
    const branch = gz[1] ?? "";
    const el = STEM_ELEMENT[stem] ?? "earth";
    const bel = BRANCH_MAIN[branch] ?? "earth";
    return { stem, branch, stemHanja: stem, branchHanja: branch, element: el, branchElement: bel };
  }

  const pillars = {
    year: toPillar(yearGanZhi),
    month: toPillar(monthGanZhi),
    day: toPillar(dayGanZhi),
    hour: toPillar(timeGanZhi),
  };

  const { counts, countsWithHidden } = countElements(pillars);
  // weakest = min counts (withHidden for remedy), if tie pick non-dayMaster
  const dayMaster = pillars.day.stem;
  const dayEl = STEM_ELEMENT[dayMaster] ?? "earth";
  let weakest: FiveElement = "wood";
  let min = Infinity;
  for (const el of ["wood","fire","earth","metal","water"] as FiveElement[]) {
    const c = countsWithHidden[el];
    if (c < min || (c===min && el !== dayEl)) { min=c; weakest=el; }
  }
  let strongest: FiveElement = "wood";
  let max = -1;
  for (const el of ["wood","fire","earth","metal","water"] as FiveElement[]) {
    const c = countsWithHidden[el];
    if (c > max) { max=c; strongest=el; }
  }
  const total = (Object.values(countsWithHidden) as number[]).reduce((a,b)=>a+b,0) || 1;
  const balance = (["wood","fire","earth","metal","water"] as FiveElement[]).map(el=>({ element: el, count: countsWithHidden[el], pct: Math.round(countsWithHidden[el]/total*100) }));
  return {
    pillars,
    elementCounts: counts,
    elementCountsWithHidden: countsWithHidden,
    weakest,
    strongest,
    dayMaster,
    dayMasterElement: dayEl,
    balance,
    source: "calculated",
    generatedAt: new Date().toISOString(),
  };
}

export const REMEDY_MAP: Record<FiveElement, { direct: string[]; control: string[]; planets: string[]; descTh: string }> = {
  wood: { direct: ["jupiter"], control: ["venus"], planets: ["jupiter","venus"], descTh: "ไม้ขาด → เสริมด้วย Jupiter (พฤหัส ขยาย) / Venus (ศุกร์ ควบคุม)" },
  fire: { direct: ["sun","mars"], control: ["moon"], planets: ["sun","mars"], descTh: "ไฟขาด → เสริมด้วย Sun/Mars" },
  earth: { direct: ["saturn"], control: ["jupiter"], planets: ["saturn"], descTh: "ดินขาด → เสริมด้วย Saturn" },
  metal: { direct: ["venus"], control: ["mars"], planets: ["venus"], descTh: "ทองขาด → เสริมด้วย Venus / Saturn" },
  water: { direct: ["moon","mercury"], control: ["saturn"], planets: ["moon","neptune"], descTh: "น้ำขาด → เสริมด้วย Moon/Neptune" },
};
