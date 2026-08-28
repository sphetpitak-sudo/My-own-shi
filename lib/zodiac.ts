import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/astrology/types";

export type { ZodiacSign };

export interface ChineseZodiacAnimal {
  yearTh: string;
  animal: string;
  symbol: string;
}

export interface ZodiacFortune {
  signId: ZodiacSign;
  signNameTh: string;
  signSymbol: string;
  signRange: string;
  animal: ChineseZodiacAnimal;
  date: string;
  overview: string;
  study: string;
  love: string;
  money: string;
  health: string;
  stress: string;
  lucky: { number: number; color: string; colorTh: string };
  source: "ai" | "fallback";
}

// Thai 12-year animal cycle, indexed by (year - 4) % 12
const CHINESE_ZODIAC: ChineseZodiacAnimal[] = [
  { yearTh: "ปีชวด", animal: "หนู", symbol: "🐀" },
  { yearTh: "ปีฉลู", animal: "วัว", symbol: "🐂" },
  { yearTh: "ปีขาล", animal: "เสือ", symbol: "🐅" },
  { yearTh: "ปีเถาะ", animal: "กระต่าย", symbol: "🐇" },
  { yearTh: "ปีมะโรง", animal: "มังกร", symbol: "🐉" },
  { yearTh: "ปีมะเส็ง", animal: "งู", symbol: "🐍" },
  { yearTh: "ปีมะเมีย", animal: "ม้า", symbol: "🐎" },
  { yearTh: "ปีมะแม", animal: "แพะ", symbol: "🐐" },
  { yearTh: "ปีวอก", animal: "ลิง", symbol: "🐒" },
  { yearTh: "ปีระกา", animal: "ไก่", symbol: "🐓" },
  { yearTh: "ปีจอ", animal: "หมา", symbol: "🐕" },
  { yearTh: "ปีกุน", animal: "หมู", symbol: "🐖" },
];

const OVERVIEWS = [
  "พลังงานของคุณวันนี้สดใสกว่าที่คิด ความคิดไหลลื่น และมีแรงบันดาลใจใหม่ ๆ เกิดขึ้น ใช้จังหวะนี้ลงมือทำสิ่งที่วางแผนไว้นานแล้ว",
  "เป็นวันที่เหมาะกับการพักและทบทวนตัวเอง อย่ารีบร้อนกับทุกเรื่อง พลังของคุณจะกลับมาเต็มที่เมื่อใจสงบ",
  "วันนี้มีเรื่องให้ตัดสินใจหลายอย่างพร้อมกัน ให้เวลากับการคิดอย่างรอบคอบ แล้วเลือกทางที่ทำให้ใจสบายที่สุด",
  "ความพยายามที่สะสมมาเริ่มเห็นผลชัดเจน เก็บเกี่ยวสิ่งที่ทำไว้ พร้อมเปิดรับโอกาสใหม่ที่กำลังเดินทางมา",
  "วันนี้อาจมีอุปสรรคเล็ก ๆ ขัดจังหวะบ้าง แต่นั่นคือบททดสอบ จงยืนหยัดและเดินต่ออย่างมั่นคง",
  "เป็นวันดีสำหรับการเริ่มต้นสิ่งใหม่ ใจของคุณพร้อม โลกก็พร้อมสนับสนุน ลองก้าวออกจากคอมฟอร์ตโซนดู",
  "พลังงานรอบตัวค่อนข้างผสมปนเป ทั้งเรื่องดีและเรื่องท้าทาย จงใช้สัญชาตญาณเป็นเข็มทิศนำทาง",
  "คนรอบข้างให้ความร่วมมือดีในวันนี้ ใช้พลังของทีมและคนใกล้ตัวให้เกิดประโยชน์สูงสุด",
];

const STUDY_WORK = [
  "งาน/การเรียนของคุณวันนี้มีโอกาสก้าวหน้า ซ่อนอยู่ในรายละเอียดเล็ก ๆ ลองสังเกตและอย่ามองข้ามสิ่งที่ดูง่าย",
  "เหมาะกับการเจรจา นำเสนอ และแลกเปลี่ยนไอเดีย ความชัดเจนของคุณจะชนะใจคนรอบข้าง",
  "ภาระอาจเพิ่มขึ้นเล็กน้อย แต่รับมือไหว ขอแค่จัดลำดับความสำคัญให้ดี อย่าทำทุกอย่างพร้อมกัน",
  "มีแนวโน้มว่าจะมีคนชื่นชมผลงานของคุณ ลองรับข้อเสนอหรือโอกาสที่เข้ามาอย่างจริงจัง",
  "ควรระวังเรื่องการสื่อสาร พูดให้ชัดเจน หลีกเลี่ยงการนินทา และอย่าเซ็นรับรองอะไรที่ยังไม่แน่ใจ",
  "พลังงานเหมาะกับงานที่ต้องใช้สมาธิ เคลียร์งานยาก ๆ ที่ค้างไว้ให้เสร็จ จะรู้สึกเบาสบายขึ้น",
  "เป็นวันดีสำหรับการเรียนรู้สิ่งใหม่ในสายงาน ทักษะที่เพิ่มขึ้นวันนี้คุ้มค่าในระยะยาว",
  "จังหวะของงานกำลังไปได้ดี อย่าหยุดครึ่งทาง เดินหน้าต่อด้วยความมั่นใจ",
];

const LOVE = [
  "ความรักต้องการความจริงใจมากกว่าคำพูดสวยหรู ลองเปิดใจคุยกันตรง ๆ แล้วทุกอย่างจะง่ายขึ้น",
  "คนโสดมีโอกาสพบคนที่ถูกจังหวะ เปิดใจเข้าสังคมให้มากขึ้น ส่วนคนมีคู่ให้ใช้เวลากับคนสำคัญ",
  "ความสัมพันธ์อาจมีเรื่องที่ต้องปรับจูนเล็กน้อย จงรับฟังมากกว่าพูด และให้อภัยเร็ว ๆ",
  "หัวใจของคุณค่อนข้างละเอียดอ่อนในวันนี้ ให้ความอบอุ่นกับคนรัก และอย่าปิดบังความรู้สึก",
  "พลังแห่งความโรแมนติกโอบรอบตัวคุณ ลองเซอร์ไพรส์คนสำคัญเล็ก ๆ น้อย ๆ ความสัมพันธ์จะสดใสขึ้น",
  "เรื่องหัวใจควรเดินอย่างค่อยเป็นค่อยไป อย่าเพิ่งรีบสรุป ปล่อยให้ความสัมพันธ์เติบโตตามธรรมชาติ",
  "เหมาะกับการทบทวนความสัมพันธ์ว่าไปในทิศทางที่คุณต้องการจริง ๆ หรือไม่ แล้วค่อยตัดสินใจ",
  "ความเข้าอกเข้าใจคือกุญแจของวันนี้ พยายามมองมุมของอีกฝ่ายก่อนจะรู้สึกน้อยใจ",
];

const MONEY = [
  "เรื่องเงินวันนี้ค่อนข้างนิ่ง ยังไม่ควรตัดสินใจลงทุนหรือใช้จ่ายก้อนใหญ่ รอให้แน่ใจก่อน",
  "มีโอกาสได้เงินก้อนเล็ก ๆ ที่ไม่คาดคิด เก็บไว้ก่อน อย่าเพิ่งใช้ทันที",
  "เหมาะกับการวางแผนการเงินระยะยาว ลองจัดสัดส่วนรายรับรายจ่ายให้ชัดเจน",
  "ระวังค่าใช้จ่ายฟุ่มเฟือย อยู่กับงบประมาณที่วางไว้จะปลอดภัยกว่า",
  "โชคด้านการเงินปานกลาง เน้นความมั่นคงมากกว่าการเสี่ยง",
  "เป็นวันดีสำหรับการเคลียร์หนี้หรือปิดภาระที่ค้างไว้ จะรู้สึกเบาสบายขึ้น",
  "มีแนวโน้มว่ารายได้จะเพิ่มขึ้นจากความพยายามที่ผ่านมา จัดการอย่างมีสติ",
  "เรื่องเงินต้องการความรอบคอบเป็นพิเศษ อย่าตกลงอะไรที่ยังไม่อ่านรายละเอียดให้ครบ",
];

const HEALTH = [
  "พลังงานร่างกายอยู่ในเกณฑ์ดี ใช้โอกาสนี้ออกกำลังกายหรือเคลื่อนไหวร่างกายให้มากขึ้น",
  "ควรพักผ่อนให้เพียงพอ อย่าหักโหมจนเกินไป ร่างกายกำลังส่งสัญญาณให้ช้าลงบ้าง",
  "เหมาะกับการดูแลสุขภาพจิต ลองนั่งสมาธิหรือทำกิจกรรมที่ผ่อนคลาย",
  "ระวังเรื่องอาหารการกิน หลีกเลี่ยงของมันหรือของหวานมากเกินไปในวันนี้",
  "พลังงานกำลังดี ฟิตพร้อมสำหรับกิจกรรมใหม่ ๆ แต่อย่าลืมวอร์มอัพร่างกายก่อนเสมอ",
  "ฟังสัญญาณของร่างกาย ถ้ารู้สึกเหนื่อยก็หยุดพัก ไม่ใช่เรื่องผิด",
  "เหมาะกับการดื่มน้ำมาก ๆ และพักสายตาจากจอ เพื่อให้ร่างกายสดชื่นทั้งวัน",
  "สุขภาพใจต้องการการดูแลในวันนี้ หาเวลาอยู่กับตัวเองหรือสิ่งที่ทำให้ยิ้มได้",
];

const STRESS = [
  "ความเครียดวันนี้อยู่ในระดับจัดการได้ แต่ให้ระวังเรื่องงานที่กองค้าง ลองแบ่งเป็นชิ้นเล็ก ๆ ทีละก้าว",
  "ใจของคุณค่อนข้างกังวลเรื่องอนาคต แต่อย่าลืมว่าคุณเคยผ่านเรื่องยาก ๆ มาแล้ว เชื่อมั่นในตัวเอง",
  "มีสิ่งที่ทำให้ว้าวุ่นใจอยู่บ้าง ควรหาเวลาหายใจลึก ๆ และจัดระเบียบความคิดก่อนตัดสินใจ",
  "ความเครียดส่วนใหญ่มาจากการอยากควบคุมทุกอย่าง ลองปล่อยวางบางเรื่องที่ไม่อยู่ในมือคุณ",
  "วันนี้ใจอาจเต้นเร็วจากความเร่งรีบ ลองกำหนดลมหายใจช้า ๆ 5 ครั้ง แล้วทุกอย่างจะนิ่งลง",
  "มีเรื่องที่ต้องรับผิดชอบหลายอย่าง แต่ไม่จำเป็นต้องทำพร้อมกัน ให้เวลากับตัวเองบ้าง",
  "ความเครียดจากความคาดหวังสูง ลองลดเป้าหมายของวันนี้ให้เป็นจริงได้ แล้วความสุขจะตามมา",
  "พลังงานของวันค่อนข้างตึง ลองหาเวลาออกไปเดินรับอากาศนอกห้อง จะช่วยให้สมองปลอดโปร่งขึ้น",
];

const COLORS = [
  { name: "ทอง", hex: "#d4af37" },
  { name: "ม่วง", hex: "#a78bfa" },
  { name: "ชมพู", hex: "#f472b6" },
  { name: "เขียวมรกต", hex: "#14b8a6" },
  { name: "คราม", hex: "#818cf8" },
  { name: "อำพัน", hex: "#fbbf24" },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function monthDay(month: number, day: number): number {
  return month * 100 + day;
}

// Determine Western/Tropical zodiac sign from birth month + day
export function getZodiacSign(year: number, month: number, day: number): ZodiacSign {
  const md = monthDay(month, day);
  if (md >= 321 && md <= 419) return "aries";
  if (md >= 420 && md <= 520) return "taurus";
  if (md >= 521 && md <= 620) return "gemini";
  if (md >= 621 && md <= 722) return "cancer";
  if (md >= 723 && md <= 822) return "leo";
  if (md >= 823 && md <= 922) return "virgo";
  if (md >= 923 && md <= 1022) return "libra";
  if (md >= 1023 && md <= 1121) return "scorpio";
  if (md >= 1122 && md <= 1221) return "sagittarius";
  if (md >= 1222 || md <= 119) return "capricorn";
  if (md >= 120 && md <= 218) return "aquarius";
  return "pisces";
}

// Determine Thai 12-year animal (Chun Zi / นักษัตร), using the Feb 4 solar boundary
export function getChineseZodiac(year: number, month: number, day: number): ChineseZodiacAnimal {
  const boundary = new Date(year, 1, 4).getTime();
  const dob = new Date(year, month - 1, day).getTime();
  const offsetYear = dob >= boundary ? year : year - 1;
  const idx = (((offsetYear - 4) % 12) + 12) % 12;
  return CHINESE_ZODIAC[idx]!;
}

export function isValidBirthDate(year: number, month: number, day: number): boolean {
  const now = new Date();
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return false;
  if (year < 1900 || year > now.getFullYear()) return false;
  if (d.getTime() > now.getTime()) return false;
  // Ensure the date is real (e.g. reject 31 Feb)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function buildZodiacFortune(
  birthDate: string,
  date: string
): ZodiacFortune {
  const [y, m, d] = birthDate.split("-").map(Number);
  const signId = getZodiacSign(y!, m!, d!);
  const sign = ZODIAC_SIGNS.find((s) => s.id === signId)!;
  const animal = getChineseZodiac(y!, m!, d!);

  const seed = hashSeed(`${signId}:${animal.yearTh}:${date}`);

  return {
    signId,
    signNameTh: sign.nameTh,
    signSymbol: sign.symbol,
    signRange: sign.range,
    animal,
    date,
    overview: OVERVIEWS[seed % OVERVIEWS.length]!,
    study: STUDY_WORK[(seed >> 3) % STUDY_WORK.length]!,
    love: LOVE[(seed >> 5) % LOVE.length]!,
    money: MONEY[(seed >> 7) % MONEY.length]!,
    health: HEALTH[(seed >> 9) % HEALTH.length]!,
    stress: STRESS[(seed >> 11) % STRESS.length]!,
    lucky: {
      number: (seed % 99) + 1,
      color: COLORS[(seed >> 13) % COLORS.length]!.hex,
      colorTh: COLORS[(seed >> 13) % COLORS.length]!.name,
    },
    source: "fallback",
  };
}
