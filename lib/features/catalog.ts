import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Heart,
  Briefcase,
  GraduationCap,
  Wallet,
  Activity,
  Sun,
  Moon,
  Star,
  Hash,
  Compass,
  Eye,
  Zap,
  Calendar,
  CalendarDays,
  CircleHelp,
  type IconNode,
} from "lucide-react";

export type FeatureCategory =
  | "tarot"
  | "astrology"
  | "oracle"
  | "quick"
  | "daily"
  | "numerology";

export type FeatureStatus = "live" | "beta" | "soon";

export interface FeatureMeta {
  id: string;
  category: FeatureCategory;
  title: string;
  titleTh: string;
  subtitle: string;
  subtitleTh: string;
  description?: string;
  descriptionTh?: string;
  icon: LucideIcon | IconNode;
  status: FeatureStatus;
  cost: number;
  route: string;
  theme: "violet" | "gold" | "rose" | "teal" | "indigo" | "amber";
  badge?: string;
  badgeTh?: string;
  premium?: boolean;
}

export const CATEGORY_META: Record<
  FeatureCategory,
  { label: string; labelTh: string; icon: LucideIcon; tone: string }
> = {
  tarot: { label: "Tarot", labelTh: "ไพ่ทาโรต์", icon: Sparkles, tone: "violet" },
  astrology: { label: "Astrology", labelTh: "ดาราศาสตร์", icon: Star, tone: "indigo" },
  oracle: { label: "Oracle", labelTh: "ลางสังหรณ์", icon: Eye, tone: "rose" },
  quick: { label: "Quick", labelTh: "ถามด่วน", icon: Zap, tone: "amber" },
  daily: { label: "Daily", labelTh: "รายวัน", icon: Sun, tone: "gold" },
  numerology: { label: "Numerology", labelTh: "ตัวเลข", icon: Hash, tone: "teal" },
};

export const FEATURES: FeatureMeta[] = [
  {
    id: "tarot-three-card",
    category: "tarot",
    title: "Three Card Reading",
    titleTh: "ไพ่สามใบ",
    subtitle: "Past · Present · Future",
    subtitleTh: "อดีต · ปัจจุบัน · อนาคต",
    descriptionTh: "การอ่านไพ่แบบคลาสสิก 3 ใบ เหมาะสำหรับมองภาพรวมของสถานการณ์",
    icon: Sparkles,
    status: "live",
    cost: 15,
    route: "/dashboard/reading?spread=three_card",
    theme: "violet",
    badge: "แนะนำ",
    badgeTh: "แนะนำ",
  },
  {
    id: "tarot-single",
    category: "tarot",
    title: "Single Card",
    titleTh: "ไพ่ใบเดียว",
    subtitle: "Quick answer",
    subtitleTh: "คำตอบสั้น ๆ",
    descriptionTh: "เปิดไพ่เพียงใบเดียว เหมาะกับคำถามง่าย ๆ ที่ต้องการคำตอบไว",
    icon: Sparkles,
    status: "live",
    cost: 5,
    route: "/dashboard/reading?spread=single",
    theme: "violet",
  },
  {
    id: "tarot-celtic",
    category: "tarot",
    title: "Celtic Cross",
    titleTh: "กางเขนเคลติก",
    subtitle: "10-card deep spread",
    subtitleTh: "Spread 10 ใบสำหรับการวิเคราะห์ลึก",
    descriptionTh: "การอ่านไพ่แบบดั้งเดิม 10 ใบ ครอบคลุมทุกมิติของชีวิต",
    icon: Star,
    status: "live",
    cost: 50,
    route: "/dashboard/reading?spread=celtic",
    theme: "violet",
    premium: true,
    badge: "พรีเมียม",
    badgeTh: "พรีเมียม",
  },
  {
    id: "yes-no",
    category: "quick",
    title: "Yes or No",
    titleTh: "ถามใช่หรือไม่",
    subtitle: "Quick oracle pull",
    subtitleTh: "คำตอบจากไพ่ 1 ใบ",
    descriptionTh: "ถามคำถามสั้น ๆ แล้วให้ไพ่ช่วยตอบ เหมาะกับการตัดสินใจเล็ก ๆ",
    icon: CircleHelp,
    status: "live",
    cost: 3,
    route: "/dashboard/yesno",
    theme: "amber",
  },
  {
    id: "oracle",
    category: "oracle",
    title: "Oracle Cards",
    titleTh: "ไพ่ลางสังหรณ์",
    subtitle: "Intuitive messages",
    subtitleTh: "ข้อความจากจักรวาล",
    descriptionTh: "ไพ่ออราเคิลให้ข้อความสั้นกระชับ เน้นความรู้สึกและสัญชาตญาณ",
    icon: Eye,
    status: "soon",
    cost: 5,
    route: "/dashboard/oracle",
    theme: "rose",
  },
  {
    id: "daily-fortune",
    category: "daily",
    title: "Daily Fortune",
    titleTh: "ดูดวงรายวัน",
    subtitle: "Today's message",
    subtitleTh: "ข้อความประจำวันของคุณ",
    descriptionTh: "รับข้อความ ไพ่ และคำแนะนำประจำวัน อัปเดตทุกเช้า",
    icon: Sun,
    status: "live",
    cost: 0,
    route: "/dashboard/daily",
    theme: "gold",
    badge: "ฟรี",
    badgeTh: "ฟรี",
  },
  {
    id: "birth-chart",
    category: "astrology",
    title: "Birth Chart",
    titleTh: "แผนที่ดวงดาว",
    subtitle: "Natal astrology map",
    subtitleTh: "แผนที่เกิดส่วนบุคคล",
    descriptionTh: "สร้างแผนที่ดวงดาวจากวัน เวลา และสถานที่เกิด เพื่อดูตำแหน่งดาวเคราะห์",
    icon: Compass,
    status: "soon",
    cost: 25,
    route: "/dashboard/birthchart",
    theme: "indigo",
    badge: "เร็ว ๆ นี้",
    badgeTh: "เร็ว ๆ นี้",
  },
  {
    id: "love",
    category: "tarot",
    title: "Love Reading",
    titleTh: "ความรัก",
    subtitle: "Relationships insight",
    subtitleTh: "คำทำนายเรื่องความรัก",
    descriptionTh: "ไพ่เฉพาะทางสำหรับคำถามเรื่องความสัมพันธ์และความรัก",
    icon: Heart,
    status: "soon",
    cost: 10,
    route: "/dashboard/reading?spread=three_card",
    theme: "rose",
  },
  {
    id: "career",
    category: "tarot",
    title: "Career & Work",
    titleTh: "การงาน",
    subtitle: "Path to success",
    subtitleTh: "เส้นทางอาชีพ",
    descriptionTh: "วิเคราะห์สถานการณ์การงาน การเงิน และการตัดสินใจในอาชีพ",
    icon: Briefcase,
    status: "soon",
    cost: 10,
    route: "/dashboard/reading?spread=three_card",
    theme: "teal",
  },
  {
    id: "study",
    category: "tarot",
    title: "Study & Exam",
    titleTh: "การเรียน",
    subtitle: "Learning insight",
    subtitleTh: "คำแนะนำเรื่องการเรียน",
    descriptionTh: "ค้นหาแนวทางการเรียน การสอบ และการพัฒนาตนเอง",
    icon: GraduationCap,
    status: "soon",
    cost: 10,
    route: "/dashboard/reading?spread=three_card",
    theme: "violet",
  },
  {
    id: "finance",
    category: "tarot",
    title: "Finance & Money",
    titleTh: "การเงิน",
    subtitle: "Wealth guidance",
    subtitleTh: "คำแนะนำการเงิน",
    descriptionTh: "มุมมองเรื่องการเงิน การลงทุน และการใช้จ่าย",
    icon: Wallet,
    status: "soon",
    cost: 10,
    route: "/dashboard/reading?spread=three_card",
    theme: "amber",
  },
  {
    id: "health",
    category: "tarot",
    title: "Health & Wellness",
    titleTh: "สุขภาพ",
    subtitle: "Body & mind",
    subtitleTh: "กายและใจ",
    descriptionTh: "คำแนะนำเรื่องการดูแลสุขภาพกายและใจ (ไม่ใช่การวินิจฉัยทางการแพทย์)",
    icon: Activity,
    status: "soon",
    cost: 10,
    route: "/dashboard/reading?spread=three_card",
    theme: "teal",
  },
  {
    id: "monthly",
    category: "daily",
    title: "Monthly Reading",
    titleTh: "ดวงรายเดือน",
    subtitle: "Theme of the month",
    subtitleTh: "ธีมประจำเดือน",
    descriptionTh: "ภาพรวมพลังงานประจำเดือน พร้อมคำแนะนำรายสัปดาห์",
    icon: CalendarDays,
    status: "soon",
    cost: 15,
    route: "/dashboard/daily",
    theme: "violet",
  },
  {
    id: "lucky-number",
    category: "numerology",
    title: "Lucky Numbers",
    titleTh: "ตัวเลขมงคล",
    subtitle: "Daily numbers",
    subtitleTh: "ตัวเลขประจำวัน",
    descriptionTh: "เลขมงคลประจำวัน เลขเด่น และเลขที่ควรหลีกเลี่ยง",
    icon: Hash,
    status: "soon",
    cost: 0,
    route: "/dashboard/daily",
    theme: "teal",
  },
  {
    id: "weekly",
    category: "daily",
    title: "Weekly Outlook",
    titleTh: "ดวงรายสัปดาห์",
    subtitle: "7-day forecast",
    subtitleTh: "พยากรณ์ 7 วัน",
    descriptionTh: "ภาพรวมพลังงานในแต่ละวันของสัปดาห์",
    icon: Calendar,
    status: "soon",
    cost: 5,
    route: "/dashboard/daily",
    theme: "gold",
  },
  {
    id: "moon-phase",
    category: "astrology",
    title: "Moon Phase",
    titleTh: "ดวงจันทร์",
    subtitle: "Lunar energy",
    subtitleTh: "พลังจันทร์",
    descriptionTh: "สถานะดวงจันทร์วันนี้ เหมาะกับการทำอะไร",
    icon: Moon,
    status: "soon",
    cost: 0,
    route: "/dashboard/daily",
    theme: "indigo",
  },
];

export function getFeature(id: string): FeatureMeta | undefined {
  return FEATURES.find((f) => f.id === id);
}

export function getFeaturesByCategory(category: FeatureCategory): FeatureMeta[] {
  return FEATURES.filter((f) => f.category === category);
}

export function getLiveFeatures(): FeatureMeta[] {
  return FEATURES.filter((f) => f.status === "live");
}

export function getFeaturedFeatures(): FeatureMeta[] {
  return FEATURES.filter((f) => f.status === "live").slice(0, 4);
}
