import {
  AstroTime,
  Body,
  Observer,
  Equator,
  Ecliptic,
  SiderealTime,
} from "astronomy-engine";
import type { BirthChart, BirthInput, ZodiacSign, Planet, PlanetPosition } from "./types";
import { ZODIAC_SIGNS } from "./types";

/**
 * Real astrology calculator using astronomy-engine.
 * Calculates accurate planetary positions based on birth date, time, and location.
 */
export interface AstrologyCalculator {
  calculate(input: BirthInput): Promise<BirthChart>;
  isReady(): boolean;
  source(): "calculated" | "mock";
}

const PLANETS: Planet[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

const PLANET_ASTRONOMY_MAP: Record<Planet, Body> = {
  sun: Body.Sun,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

function longitudeToSign(longitude: number): ZodiacSign {
  // Normalize to 0-360
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const signs: ZodiacSign[] = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
  ];
  return signs[signIndex];
}

function longitudeToDegree(longitude: number): number {
  const norm = ((longitude % 360) + 360) % 360;
  return Math.round(norm % 30 * 100) / 100;
}

function isRetrograde(): boolean {
  // astronomy-engine doesn't directly provide retrograde status
  // We'll use a simple heuristic: check if the planet's ecliptic longitude is decreasing
  // For a more accurate implementation, we'd need to check over a time window
  return false; // Simplified for now
}

function calculateAscendant(time: AstroTime, observer: Observer): ZodiacSign {
  // Calculate Local Sidereal Time (LST)
  // GMST is in hours, convert to degrees
  const gmstHours = SiderealTime(time); // Greenwich Mean Sidereal Time in hours
  const lstHours = gmstHours + observer.longitude / 15; // Local Sidereal Time in hours
  const lstDeg = (lstHours * 15) % 360; // Convert to degrees
  
  // Obliquity of the ecliptic (approximate, J2000)
  const oblDeg = 23.4393;
  
  // Observer latitude in degrees
  const latDeg = observer.latitude;
  
  // Convert to radians
  const lstRad = (lstDeg * Math.PI) / 180;
  const latRad = (latDeg * Math.PI) / 180;
  const oblRad = (oblDeg * Math.PI) / 180;
  
  // Calculate ascendant using the formula:
  // asc = atan2(-cos(LST), sin(LST) * cos(lat) + tan(obl) * sin(lat))
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(latRad) + Math.tan(oblRad) * Math.sin(latRad);
  const ascRad = Math.atan2(y, x);
  
  // Convert to degrees and normalize to 0-360
  let ascDeg = (ascRad * 180) / Math.PI;
  ascDeg = ((ascDeg % 360) + 360) % 360;
  
  return longitudeToSign(ascDeg);
}

function parsePlaceToCoords(place: string): { lat: number; lon: number } {
  // Simple geocoding fallback - in production, use a proper geocoding API
  const knownPlaces: Record<string, { lat: number; lon: number }> = {
    "bangkok": { lat: 13.7563, lon: 100.5018 },
    "กรุงเทพ": { lat: 13.7563, lon: 100.5018 },
    "กรุงเทพมหานคร": { lat: 13.7563, lon: 100.5018 },
    "chiang mai": { lat: 18.7883, lon: 98.9853 },
    "เชียงใหม่": { lat: 18.7883, lon: 98.9853 },
    "phuket": { lat: 7.8861, lon: 98.2964 },
    "ภูเก็ต": { lat: 7.8861, lon: 98.2964 },
    "pattaya": { lat: 12.9236, lon: 100.8825 },
    "พัทยา": { lat: 12.9236, lon: 100.8825 },
  };
  
  const lower = place.toLowerCase().trim();
  for (const [key, coords] of Object.entries(knownPlaces)) {
    if (lower.includes(key)) return coords;
  }
  // Default to Bangkok
  return { lat: 13.7563, lon: 100.5018 };
}

export class RealAstrologyCalculator implements AstrologyCalculator {
  isReady(): boolean {
    return true;
  }
  source(): "calculated" | "mock" {
    return "calculated";
  }

  async calculate(input: BirthInput): Promise<BirthChart> {
    const { date, time, place } = input;
    
    // Parse birth date and time
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    
    // Create astronomy-engine time object (UTC)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const astroTime = new AstroTime(utcDate);
    
    // Parse location
    const { lat, lon } = parsePlaceToCoords(place);
    
    // Calculate observer location
    const observer = new Observer(lat, lon, 0);
    
    // Calculate planetary positions
    const planets: PlanetPosition[] = [];
    
    for (const planet of PLANETS) {
      const body = PLANET_ASTRONOMY_MAP[planet];
      const eq = Equator(body, astroTime, observer, true, true);
      const ecl = Ecliptic(eq.vec);
      
      const longitude = ecl.elon;
      const sign = longitudeToSign(longitude);
      const degree = longitudeToDegree(longitude);
      const retrograde = isRetrograde();
      
      planets.push({
        planet,
        sign,
        degree,
        retrograde,
      });
    }
    
    // Calculate Ascendant (Rising sign)
    const rising = calculateAscendant(astroTime, observer);
    
    // Find Sun and Moon positions
    const sunPos = planets.find(p => p.planet === "sun")!;
    const moonPos = planets.find(p => p.planet === "moon")!;
    
    // Generate summary based on Sun sign
    const sunSignDesc = ZODIAC_SIGNS.find(s => s.id === sunPos.sign)!;
    
    return {
      source: "calculated",
      generatedAt: new Date().toISOString(),
      sun: { planet: "sun", sign: sunPos.sign, degree: sunPos.degree, retrograde: sunPos.retrograde },
      moon: { planet: "moon", sign: moonPos.sign, degree: moonPos.degree, retrograde: moonPos.retrograde },
      rising,
      planets,
      summary: {
        personality: sunSignDesc.nameEn,
        personalityTh: sunSignDesc.nameTh,
        strengths: [],
        strengthsTh: [],
        challenges: [],
        challengesTh: [],
      },
    };
  }
}

export class MockAstrologyCalculator implements AstrologyCalculator {
  isReady(): boolean {
    return true;
  }
  source(): "calculated" | "mock" {
    return "mock";
  }

  async calculate(input: BirthInput): Promise<BirthChart> {
    const sun = sunSignFromDate(input.date);
    const desc = SIGN_DESCRIPTIONS[sun];
    const allSigns = ZODIAC_SIGNS.map((s) => s.id);
    const hash = input.date + input.time + input.place;
    const simple = Array.from(hash).reduce((a, c) => a + c.charCodeAt(0), 0);

    const pickSign = (offset: number) =>
      allSigns[(simple + offset) % allSigns.length];

    const moon = pickSign(3);
    const rising = pickSign(7);

    return {
      source: "mock",
      generatedAt: new Date().toISOString(),
      sun: { planet: "sun", sign: sun, degree: 12 },
      moon: { planet: "moon", sign: moon, degree: 4 },
      rising,
      planets: [
        { planet: "sun", sign: sun, degree: 12 },
        { planet: "moon", sign: moon, degree: 4 },
        { planet: "mercury", sign: pickSign(11), degree: 18 },
        { planet: "venus", sign: pickSign(2), degree: 9 },
        { planet: "mars", sign: pickSign(5), degree: 22 },
      ],
      summary: {
        personality: desc.personality,
        personalityTh: desc.personalityTh,
        strengths: desc.strengths,
        strengthsTh: desc.strengthsTh,
        challenges: desc.challenges,
        challengesTh: desc.challengesTh,
      },
    };
  }
}

// Default to real calculator, but allow fallback to mock via env
const USE_MOCK = process.env.ASTROLOGY_MOCK === "true";

export const astrologyProvider: AstrologyCalculator = USE_MOCK 
  ? new MockAstrologyCalculator() 
  : new RealAstrologyCalculator();

// Legacy functions for backward compatibility
const SIGN_BY_MONTH_DAY: { sign: ZodiacSign; from: [number, number] }[] = [
  { sign: "capricorn", from: [12, 22] },
  { sign: "aquarius", from: [1, 20] },
  { sign: "pisces", from: [2, 19] },
  { sign: "aries", from: [3, 21] },
  { sign: "taurus", from: [4, 20] },
  { sign: "gemini", from: [5, 21] },
  { sign: "cancer", from: [6, 21] },
  { sign: "leo", from: [7, 23] },
  { sign: "virgo", from: [8, 23] },
  { sign: "libra", from: [9, 23] },
  { sign: "scorpio", from: [10, 23] },
  { sign: "sagittarius", from: [11, 22] },
];

function sunSignFromDate(date: string): ZodiacSign {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "aries";
  const month = d.getMonth() + 1;
  const day = d.getDate();

  for (let i = 0; i < SIGN_BY_MONTH_DAY.length; i++) {
    const [m, dayStart] = SIGN_BY_MONTH_DAY[i].from;
    if (m === month && day >= dayStart) {
      const next = SIGN_BY_MONTH_DAY[(i + 1) % SIGN_BY_MONTH_DAY.length];
      if (i === 0) {
        if (month === 12) return "capricorn";
        return next.sign;
      }
      return SIGN_BY_MONTH_DAY[i].sign;
    }
  }
  return "capricorn";
}

const SIGN_DESCRIPTIONS: Record<ZodiacSign, { personality: string; personalityTh: string; strengths: string[]; strengthsTh: string[]; challenges: string[]; challengesTh: string[] }> = {
  aries: { personality: "Pioneering, energetic, and direct", personalityTh: "กล้าหาญ เป็นผู้นำ และกระตือรือร้น", strengths: ["Courage", "Initiative", "Honesty"], strengthsTh: ["ความกล้าหาญ", "ความคิดริเริ่ม", "ความจริงใจ"], challenges: ["Impatience", "Impulsiveness"], challengesTh: ["ใจร้อน", "หุนหันพลันแล่น"] },
  taurus: { personality: "Grounded, sensual, and reliable", personalityTh: "มั่นคง หรูหรา และไว้ใจได้", strengths: ["Patience", "Loyalty", "Practicality"], strengthsTh: ["ความอดทน", "ความภักดี", "ความเป็นจริง"], challenges: ["Stubbornness", "Resistance to change"], challengesTh: ["ดื้อรั้น", "ต่อต้านการเปลี่ยนแปลง"] },
  gemini: { personality: "Curious, versatile, and expressive", personalityTh: "ช่างสงสัย หลากหลาย และชอบสื่อสาร", strengths: ["Adaptability", "Wit", "Communication"], strengthsTh: ["ปรับตัวเก่ง", "มีไหวพริบ", "สื่อสารเก่ง"], challenges: ["Restlessness", "Indecision"], challengesTh: ["ใจไม่อยู่กับที่", "ลังเล"] },
  cancer: { personality: "Nurturing, intuitive, and protective", personalityTh: "เอาใจใส่ มีสัญชาตญาณ และปกป้องคนที่รัก", strengths: ["Empathy", "Loyalty", "Imagination"], strengthsTh: ["เข้าอกเข้าใจ", "ซื่อสัตย์", "จินตนาการ"], challenges: ["Moodiness", "Over-sensitivity"], challengesTh: ["อารมณ์แปรปรวน", "อ่อนไหวเกินไป"] },
  leo: { personality: "Confident, generous, and dramatic", personalityTh: "มั่นใจ ใจกว้าง และมีเสน่ห์", strengths: ["Leadership", "Warmth", "Creativity"], strengthsTh: ["ภาวะผู้นำ", "อบอุ่น", "สร้างสรรค์"], challenges: ["Pride", "Need for attention"], challengesTh: ["ถือตัว", "ต้องการความสนใจ"] },
  virgo: { personality: "Analytical, detail-oriented, and helpful", personalityTh: "ช่างวิเคราะห์ ใส่ใจรายละเอียด และชอบช่วยเหลือ", strengths: ["Precision", "Reliability", "Service"], strengthsTh: ["แม่นยำ", "ไว้ใจได้", "ชอบบริการ"], challenges: ["Self-criticism", "Worry"], challengesTh: ["วิพากษ์ตนเอง", "วิตกจริต"] },
  libra: { personality: "Diplomatic, charming, and fair", personalityTh: "เป็นทูต มีเสน่ห์ และยุติธรรม", strengths: ["Balance", "Grace", "Partnership"], strengthsTh: ["สมดุล", "สง่างาม", "เป็นหุ้นส่วนที่ดี"], challenges: ["Indecision", "People-pleasing"], challengesTh: ["ลังเล", "ทำเพื่อคนอื่นมากเกินไป"] },
  scorpio: { personality: "Intense, magnetic, and transformative", personalityTh: "เข้มข้น มีเสน่ห์ และเปลี่ยนแปลงตัวเอง", strengths: ["Passion", "Loyalty", "Insight"], strengthsTh: ["มี passion", "ซื่อสัตย์", "มองลึก"], challenges: ["Jealousy", "Secrecy"], challengesTh: ["หึงหวง", "เก็บความลับ"] },
  sagittarius: { personality: "Adventurous, optimistic, and philosophical", personalityTh: "รักการผจญภัย มองโลกในแง่ดี และชอบความหมาย", strengths: ["Honesty", "Enthusiasm", "Vision"], strengthsTh: ["จริงใจ", "กระตือรือร้น", "มีวิสัยทัศน์"], challenges: ["Tactlessness", "Restlessness"], challengesTh: ["พูดตรงเกินไป", "ใจร้อน"] },
  capricorn: { personality: "Ambitious, disciplined, and wise", personalityTh: "ทะเยอทะยาน มีวินัย และฉลาด", strengths: ["Discipline", "Patience", "Strategy"], strengthsTh: ["วินัย", "อดทน", "มีกลยุทธ์"], challenges: ["Pessimism", "Workaholism"], challengesTh: ["มองโลกในแง่ร้าย", "ทำงานหนักเกินไป"] },
  aquarius: { personality: "Original, independent, and humanitarian", personalityTh: "เป็นตัวของตัวเอง อิสระ และเห็นอกเห็นใจผู้อื่น", strengths: ["Vision", "Independence", "Innovation"], strengthsTh: ["วิสัยทัศน์", "เป็นอิสระ", "สร้างสรรค์สิ่งใหม่"], challenges: ["Detachment", "Stubbornness"], challengesTh: ["ถอนตัว", "ดื้อรั้น"] },
  pisces: { personality: "Compassionate, artistic, and intuitive", personalityTh: "เมตตา ศิลปิน และมีสัญชาตญาณ", strengths: ["Empathy", "Creativity", "Compassion"], strengthsTh: ["เข้าอกเข้าใจ", "สร้างสรรค์", "เมตตา"], challenges: ["Escapism", "Over-idealism"], challengesTh: ["หนีปัญหา", "มองโลกในแง่ดีเกินไป"] },
};
