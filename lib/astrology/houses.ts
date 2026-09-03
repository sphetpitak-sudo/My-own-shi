// Whole Sign houses — each house = 30° sign, House 1 starts at ascendant sign 0°
// Used because astronomy-engine has no Placidus implementation.
// This matches Thai popular Whole Sign and is deterministic at polar latitudes.

import type { PlanetPosition } from "./types";

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

export function getWholeSignCusps(ascLongitude: number): number[] {
  const ascNorm = normalizeLon(ascLongitude);
  // Whole sign: cusp = start of sign containing asc
  const ascSignStart = Math.floor(ascNorm / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => normalizeLon(ascSignStart + i * 30));
}

export function houseOf(longitude: number, ascLongitude: number): number {
  // Whole sign: which sign offset from ascendant sign
  const ascSignIdx = Math.floor(normalizeLon(ascLongitude) / 30);
  const lonSignIdx = Math.floor(normalizeLon(longitude) / 30);
  return ((lonSignIdx - ascSignIdx + 12) % 12) + 1;
}

export function assignHouses(planets: PlanetPosition[], ascLongitude: number): { planets: PlanetPosition[]; cusps: number[] } {
  const cusps = getWholeSignCusps(ascLongitude);
  return {
    cusps,
    planets: planets.map((p) => ({ ...p, house: houseOf(p.longitude, ascLongitude) })),
  };
}

export const HOUSE_MEANINGS_TH: Record<number, { th: string; en: string }> = {
  1: { th: "ตนุลัคน์ · ตัวตน", en: "Self" },
  2: { th: "กดุมภะ · ทรัพย์สิน", en: "Resources" },
  3: { th: "สหัชชะ · สื่อสาร", en: "Communication" },
  4: { th: "พันธุ · บ้าน/รากฐาน", en: "Home" },
  5: { th: "ปุตตะ · สร้างสรรค์/รัก", en: "Creativity" },
  6: { th: "อริ · งาน/สุขภาพ", en: "Service" },
  7: { th: "ปัตนิ · คู่ครอง", en: "Partnership" },
  8: { th: "มรณะ · ลึกซึ้ง", en: "Transformation" },
  9: { th: "ศุภะ · ปรัชญา/ทางไกล", en: "Philosophy" },
  10: { th: "กัมมะ · การงาน", en: "Career" },
  11: { th: "ลาภะ · มิตร/ความหวัง", en: "Gains" },
  12: { th: "วินาศ · จิตวิญญาณ", en: "Spirituality" },
};
