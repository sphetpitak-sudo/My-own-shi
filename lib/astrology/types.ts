export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export const ZODIAC_SIGNS: { id: ZodiacSign; nameTh: string; nameEn: string; symbol: string; range: string }[] = [
  { id: "aries", nameTh: "ราศีเมษ", nameEn: "Aries", symbol: "♈", range: "21 มี.ค. - 19 เม.ย." },
  { id: "taurus", nameTh: "ราศีพฤษภ", nameEn: "Taurus", symbol: "♉", range: "20 เม.ย. - 20 พ.ค." },
  { id: "gemini", nameTh: "ราศีเมถุน", nameEn: "Gemini", symbol: "♊", range: "21 พ.ค. - 20 มิ.ย." },
  { id: "cancer", nameTh: "ราศีกรกฎ", nameEn: "Cancer", symbol: "♋", range: "21 มิ.ย. - 22 ก.ค." },
  { id: "leo", nameTh: "ราศีสิงห์", nameEn: "Leo", symbol: "♌", range: "23 ก.ค. - 22 ส.ค." },
  { id: "virgo", nameTh: "ราศีกันย์", nameEn: "Virgo", symbol: "♍", range: "23 ส.ค. - 22 ก.ย." },
  { id: "libra", nameTh: "ราศีตุลย์", nameEn: "Libra", symbol: "♎", range: "23 ก.ย. - 22 ต.ค." },
  { id: "scorpio", nameTh: "ราศีพิจิก", nameEn: "Scorpio", symbol: "♏", range: "23 ต.ค. - 21 พ.ย." },
  { id: "sagittarius", nameTh: "ราศีธนู", nameEn: "Sagittarius", symbol: "♐", range: "22 พ.ย. - 21 ธ.ค." },
  { id: "capricorn", nameTh: "ราศีมังกร", nameEn: "Capricorn", symbol: "♑", range: "22 ธ.ค. - 19 ม.ค." },
  { id: "aquarius", nameTh: "ราศีกุมภ์", nameEn: "Aquarius", symbol: "♒", range: "20 ม.ค. - 18 ก.พ." },
  { id: "pisces", nameTh: "ราศีมีน", nameEn: "Pisces", symbol: "♓", range: "19 ก.พ. - 20 มี.ค." },
];

export type Planet =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  degree: number;
  longitude: number; // 0-360 ecliptic longitude
  house?: number;
  retrograde?: boolean;
}

export interface BirthChart {
  sun: PlanetPosition;
  moon: PlanetPosition;
  rising?: ZodiacSign; // legacy sign only
  ascendant?: { sign: ZodiacSign; degree: number; longitude: number };
  planets: PlanetPosition[];
  cusps?: number[]; // 12 house cusps 0-360 (Whole Sign: cusps[i] = ascendant + i*30)
  houseSystem?: "whole_sign" | "placidus";
  lat: number;
  lon: number;
  timezone: string;
  tzOffsetMinutes: number;
  summary: {
    personality: string;
    personalityTh: string;
    strengths: string[];
    strengthsTh: string[];
    challenges: string[];
    challengesTh: string[];
  };
  source: "calculated" | "mock";
  generatedAt: string;
}

export interface BirthInput {
  date: string;
  time: string;
  place: string;
  lat?: number;
  lon?: number;
  tzOffsetMinutes?: number; // e.g., 420 for Asia/Bangkok (+07:00)
}
