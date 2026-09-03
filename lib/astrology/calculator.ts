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
  return Math.round((norm % 30) * 100) / 100;
}

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

// Real retrograde: compare ecliptic longitude delta over ±1 day
function isRetrogradePlanet(body: Body, time: AstroTime, observer: Observer): boolean {
  if (body === Body.Sun || body === Body.Moon) return false;
  try {
    const dt = 1; // 1 day
    const tMinus = new AstroTime(new Date(time.date.getTime() - dt * 86400000));
    const tPlus = new AstroTime(new Date(time.date.getTime() + dt * 86400000));
    const lonMinus = Ecliptic(Equator(body, tMinus, observer, true, true).vec).elon;
    const lonPlus = Ecliptic(Equator(body, tPlus, observer, true, true).vec).elon;
    let d = lonPlus - lonMinus;
    // normalize -180..180
    d = ((d + 540) % 360) - 180;
    return d < 0;
  } catch {
    return false;
  }
}

function calculateAscendant(time: AstroTime, observer: Observer): { sign: ZodiacSign; degree: number; longitude: number } {
  const gmstHours = SiderealTime(time);
  const lstHours = gmstHours + observer.longitude / 15;
  const lstDeg = ((lstHours * 15) % 360 + 360) % 360;
  // Use true obliquity approx via astronomy-engine would be ideal, keep J2000 for now but with small correction for date
  // Approx obliquity decreases ~0.013°/century; for 2026 ~23.4369°
  const yearsSinceJ2000 = (time.date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / (36525 * 86400000);
  const oblDeg = 23.439291 - 0.0130042 * yearsSinceJ2000;
  const latDeg = observer.latitude;
  const lstRad = (lstDeg * Math.PI) / 180;
  const latRad = (latDeg * Math.PI) / 180;
  const oblRad = (oblDeg * Math.PI) / 180;
  const y = -Math.cos(lstRad);
  const x = Math.sin(lstRad) * Math.cos(latRad) + Math.tan(oblRad) * Math.sin(latRad);
  const ascRad = Math.atan2(y, x);
  let ascDeg = (ascRad * 180) / Math.PI;
  ascDeg = normalizeLon(ascDeg);
  return { sign: longitudeToSign(ascDeg), degree: longitudeToDegree(ascDeg), longitude: ascDeg };
}

// Extended place database with tz info — fallback to Bangkok +07:00
type PlaceInfo = { lat: number; lon: number; tz: string; offset: number };
const PLACE_DB: Array<{ keys: string[]; info: PlaceInfo }> = [
  { keys: ["bangkok", "กรุงเทพ", "กรุงเทพมหานคร"], info: { lat: 13.7563, lon: 100.5018, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["chiang mai", "เชียงใหม่"], info: { lat: 18.7883, lon: 98.9853, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["phuket", "ภูเก็ต"], info: { lat: 7.8861, lon: 98.2964, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["pattaya", "พัทยา"], info: { lat: 12.9236, lon: 100.8825, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["khon kaen", "ขอนแก่น"], info: { lat: 16.4419, lon: 102.835, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["udon", "อุดรธานี", "อุดร"], info: { lat: 17.4156, lon: 102.7859, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["chiang rai", "เชียงราย"], info: { lat: 19.9072, lon: 99.8309, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["hat yai", "หาดใหญ่"], info: { lat: 7.0084, lon: 100.4747, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["nakhon", "โคราช", "นครราชสีมา"], info: { lat: 14.979, lon: 102.0978, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["ubon", "อุบลราชธานี"], info: { lat: 15.2287, lon: 104.856, tz: "Asia/Bangkok", offset: 420 } },
  { keys: ["tokyo", "โตเกียว"], info: { lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo", offset: 540 } },
  { keys: ["osaka"], info: { lat: 34.6937, lon: 135.5023, tz: "Asia/Tokyo", offset: 540 } },
  { keys: ["seoul", "โซล"], info: { lat: 37.5665, lon: 126.978, tz: "Asia/Seoul", offset: 540 } },
  { keys: ["singapore", "สิงคโปร์"], info: { lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore", offset: 480 } },
  { keys: ["london"], info: { lat: 51.5072, lon: -0.1276, tz: "Europe/London", offset: 0 } },
  { keys: ["new york", "นิวยอร์ก"], info: { lat: 40.7128, lon: -74.006, tz: "America/New_York", offset: -300 } },
  { keys: ["los angeles", "แอลเอ"], info: { lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles", offset: -480 } },
];

function getPlaceInfo(place: string): PlaceInfo {
  const lower = place.toLowerCase().trim();
  for (const entry of PLACE_DB) {
    if (entry.keys.some((k) => lower.includes(k))) return entry.info;
  }
  return { lat: 13.7563, lon: 100.5018, tz: "Asia/Bangkok", offset: 420 };
}

function createAstroTime(date: string, time: string, offsetMinutes: number): AstroTime {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  // Input is wall time in place's tz => UTC = wall - offset
  const wallAsUTC = Date.UTC(year, month - 1, day, hour, minute, 0);
  const utcMillis = wallAsUTC - offsetMinutes * 60000;
  return new AstroTime(new Date(utcMillis));
}

// Whole Sign houses: cusp[i] = ascLon + i*30, house = floor((planetLon - ascLon + 360)%360 /30)+1
function assignWholeSignHouses(planets: PlanetPosition[], ascLon: number): { planets: PlanetPosition[]; cusps: number[] } {
  const cusps = Array.from({ length: 12 }, (_, i) => normalizeLon(ascLon + i * 30));
  const withHouses = planets.map((p) => ({
    ...p,
    house: Math.floor((normalizeLon(p.longitude - ascLon) / 30)) + 1,
  }));
  return { planets: withHouses, cusps };
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
    let lat = input.lat;
    let lon = input.lon;
    let tzOffset = input.tzOffsetMinutes;
    let tz = "Asia/Bangkok";
    if (lat == null || lon == null || tzOffset == null) {
      const info = getPlaceInfo(place);
      lat = lat ?? info.lat;
      lon = lon ?? info.lon;
      tzOffset = tzOffset ?? info.offset;
      tz = info.tz;
    } else {
      // if coords provided, guess tz from offset
      tz = offsetToTz(tzOffset);
    }

    const astroTime = createAstroTime(date, time, tzOffset);
    const observer = new Observer(lat, lon, 0);

    const planets: PlanetPosition[] = [];
    for (const planet of PLANETS) {
      const body = PLANET_ASTRONOMY_MAP[planet];
      const eq = Equator(body, astroTime, observer, true, true);
      const ecl = Ecliptic(eq.vec);
      const longitude = normalizeLon(ecl.elon);
      const sign = longitudeToSign(longitude);
      const degree = longitudeToDegree(longitude);
      const retrograde = isRetrogradePlanet(body, astroTime, observer);
      planets.push({ planet, sign, degree, longitude, retrograde });
    }

    const asc = calculateAscendant(astroTime, observer);
    const { planets: withHouses, cusps } = assignWholeSignHouses(planets, asc.longitude);

    // Re-find sun/moon with houses
    const sunPos = withHouses.find((p) => p.planet === "sun")!;
    const moonPos = withHouses.find((p) => p.planet === "moon")!;
    const sunSignDesc = ZODIAC_SIGNS.find((s) => s.id === sunPos.sign)!;

    return {
      source: "calculated",
      generatedAt: new Date().toISOString(),
      sun: { planet: "sun", sign: sunPos.sign, degree: sunPos.degree, longitude: sunPos.longitude, retrograde: sunPos.retrograde, house: sunPos.house },
      moon: { planet: "moon", sign: moonPos.sign, degree: moonPos.degree, longitude: moonPos.longitude, retrograde: moonPos.retrograde, house: moonPos.house },
      rising: asc.sign,
      ascendant: asc,
      planets: withHouses,
      cusps,
      houseSystem: "whole_sign",
      lat,
      lon,
      timezone: tz,
      tzOffsetMinutes: tzOffset,
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

function offsetToTz(offset: number): string {
  if (offset === 420) return "Asia/Bangkok";
  if (offset === 540) return "Asia/Tokyo";
  if (offset === 480) return "Asia/Singapore";
  if (offset === 0) return "UTC";
  return `UTC${offset >= 0 ? "+" : ""}${Math.floor(offset / 60)}:${String(Math.abs(offset % 60)).padStart(2, "0")}`;
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
      allSigns[(simple + offset) % allSigns.length] as ZodiacSign;

    const moon = pickSign(3);
    const rising = pickSign(7);
    const info = getPlaceInfo(input.place);
    const ascLon = (ZODIAC_SIGNS.findIndex((s) => s.id === rising) * 30 + 12);
    return {
      source: "mock",
      generatedAt: new Date().toISOString(),
      sun: { planet: "sun", sign: sun, degree: 12, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===sun)*30+12, house: 1 },
      moon: { planet: "moon", sign: moon, degree: 4, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===moon)*30+4, house: 2 },
      rising,
      ascendant: { sign: rising, degree: 12, longitude: ascLon },
      planets: [
        { planet: "sun", sign: sun, degree: 12, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===sun)*30+12, house: 1 },
        { planet: "moon", sign: moon, degree: 4, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===moon)*30+4, house: 2 },
        { planet: "mercury", sign: pickSign(11), degree: 18, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===pickSign(11))*30+18, house: 3 },
        { planet: "venus", sign: pickSign(2), degree: 9, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===pickSign(2))*30+9, house: 5 },
        { planet: "mars", sign: pickSign(5), degree: 22, longitude: ZODIAC_SIGNS.findIndex(s=>s.id===pickSign(5))*30+22, house: 6 },
      ],
      cusps: Array.from({ length: 12 }, (_, i) => normalizeLon(ascLon + i * 30)),
      houseSystem: "whole_sign",
      lat: info.lat,
      lon: info.lon,
      timezone: info.tz,
      tzOffsetMinutes: info.offset,
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
