export interface Spread {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  cardCount: number;
  cost: number;
  positions: { name: string; nameTh: string }[];
}

export const SPREADS: Record<string, Spread> = {
  single: {
    id: "single",
    name: "Single Card",
    nameTh: "ไพ่ใบเดียว",
    description: "A quick answer to your question",
    descriptionTh: "คำตอบรวดเร็วสำหรับคำถามของคุณ",
    cardCount: 1,
    cost: 5,
    positions: [{ name: "Answer", nameTh: "คำตอบ" }],
  },
  three_card: {
    id: "three_card",
    name: "Three Card",
    nameTh: "ไพ่สามใบ",
    description: "Past, Present, Future",
    descriptionTh: "อดีต ปัจจุบัน อนาคต",
    cardCount: 3,
    cost: 15,
    positions: [
      { name: "Past", nameTh: "อดีต" },
      { name: "Present", nameTh: "ปัจจุบัน" },
      { name: "Future", nameTh: "อนาคต" },
    ],
  },
  celtic: {
    id: "celtic",
    name: "Celtic Cross",
    nameTh: "กางเขนเซลติก",
    description: "The most comprehensive tarot spread",
    descriptionTh: "การทำนายไพ่ทาโรต์ที่สมบูรณ์ที่สุด",
    cardCount: 10,
    cost: 50,
    positions: [
      { name: "Present", nameTh: "ปัจจุบัน" },
      { name: "Challenge", nameTh: "อุปสรรค" },
      { name: "Past", nameTh: "อดีต" },
      { name: "Future", nameTh: "อนาคต" },
      { name: "Above", nameTh: "เป้าหมาย" },
      { name: "Below", nameTh: "รากฐาน" },
      { name: "Advice", nameTh: "คำแนะนำ" },
      { name: "Environment", nameTh: "สิ่งแวดล้อม" },
      { name: "Hopes", nameTh: "ความหวัง" },
      { name: "Outcome", nameTh: "ผลลัพธ์" },
    ],
  },
};
