export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export const FIVE_ELEMENT_TH: Record<FiveElement, string> = {
  wood: "ไม้", fire: "ไฟ", earth: "ดิน", metal: "ทอง", water: "น้ำ",
};

export interface SajuPillar { stem: string; branch: string; stemHanja: string; branchHanja: string; element: FiveElement; branchElement: FiveElement }
export interface SajuChart {
  pillars: { year: SajuPillar; month: SajuPillar; day: SajuPillar; hour: SajuPillar };
  elementCounts: Record<FiveElement, number>;
  elementCountsWithHidden: Record<FiveElement, number>;
  weakest: FiveElement;
  strongest: FiveElement;
  dayMaster: string; // stem of day pillar
  dayMasterElement: FiveElement;
  balance: Array<{ element: FiveElement; count: number; pct: number }>;
  source: "calculated";
  generatedAt: string;
}
