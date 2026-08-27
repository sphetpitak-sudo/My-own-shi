export type Suit = "major" | "cups" | "wands" | "swords" | "pentacles";

export interface TarotCard {
  id: number;
  name: string;
  nameTh: string;
  suit: Suit;
  imageFile: string;
  upright: string;
  uprightTh: string;
  reversed: string;
  reversedTh: string;
}

export type SpreadType = "single" | "three_card" | "celtic";

export interface SpreadPosition {
  label: string;
  labelTh: string;
  x: number;
  y: number;
}

export interface Spread {
  id: SpreadType;
  name: string;
  nameTh: string;
  cardCount: number;
  cost: number;
  description: string;
  descriptionTh: string;
  positions: SpreadPosition[];
}

export interface DrawnCard {
  card: TarotCard;
  position: SpreadPosition;
  reversed: boolean;
  index: number;
}

export const SPREADS: Record<SpreadType, Spread> = {
  single: {
    id: "single",
    name: "Single Card",
    nameTh: "ไพ่ใบเดียว",
    cardCount: 1,
    cost: 5,
    description: "A quick answer to a yes/no or short question.",
    descriptionTh: "คำตอบสั้นๆ สำหรับคำถามปัจจุบัน",
    positions: [{ label: "Answer", labelTh: "คำตอบ", x: 50, y: 50 }],
  },
  three_card: {
    id: "three_card",
    name: "Three Card",
    nameTh: "ไพ่สามใบ",
    cardCount: 3,
    cost: 15,
    description: "Past, Present, Future — see the full timeline.",
    descriptionTh: "อดีต ปัจจุบัน อนาคต — ดูไทม์ไลน์ทั้งหมด",
    positions: [
      { label: "Past", labelTh: "อดีต", x: 20, y: 50 },
      { label: "Present", labelTh: "ปัจจุบัน", x: 50, y: 50 },
      { label: "Future", labelTh: "อนาคต", x: 80, y: 50 },
    ],
  },
  celtic: {
    id: "celtic",
    name: "Celtic Cross",
    nameTh: "กางเขนเคลติก",
    cardCount: 10,
    cost: 50,
    description: "The classic 10-card spread for deep insight.",
    descriptionTh: "Spread Classic 10 ใบ สำหรับการวิเคราะห์ลึก",
    positions: [
      { label: "Present", labelTh: "ปัจจุบัน", x: 35, y: 50 },
      { label: "Challenge", labelTh: "อุปสรรค", x: 50, y: 50 },
      { label: "Foundation", labelTh: "รากฐาน", x: 35, y: 80 },
      { label: "Recent Past", labelTh: "อดีตใกล้", x: 35, y: 20 },
      { label: "Best Outcome", labelTh: "ผลลัพธ์ที่ดี", x: 35, y: 5 },
      { label: "Near Future", labelTh: "อนาคตใกล้", x: 65, y: 80 },
      { label: "Your Attitude", labelTh: "ทัศนคติ", x: 65, y: 60 },
      { label: "External Influence", labelTh: "อิทธิพลรอบข้าง", x: 65, y: 40 },
      { label: "Hopes & Fears", labelTh: "ความหวัง & ความกลัว", x: 65, y: 20 },
      { label: "Final Outcome", labelTh: "ผลลัพธ์สุดท้าย", x: 80, y: 50 },
    ],
  },
};

const majorArcana: TarotCard[] = [
  { id: 0, name: "The Fool", nameTh: "เดอะ ฟูล", suit: "major", imageFile: "00_Fool.jpg", upright: "New beginnings, innocence, spontaneity", uprightTh: "การเริ่มต้นใหม่ ความบริสุทธิ์ ความเป็นธรรมชาติ", reversed: "Recklessness, risk-taking, foolishness", reversedTh: "ความประมาท การเสี่ยงโชค ความโง่เขลา" },
  { id: 1, name: "The Magician", nameTh: "เดอะ เมจิเชียน", suit: "major", imageFile: "01_Magician.jpg", upright: "Manifestation, resourcefulness, power", uprightTh: "การแสดงออก ความมั่งคั่ง พลังอำนาจ", reversed: "Manipulation, poor planning, untapped talents", reversedTh: "การจัดการ แผนไม่ดี ความสามารถที่ไม่ได้ใช้" },
  { id: 2, name: "The High Priestess", nameTh: "เดอะ ไฮ พรีสเทส", suit: "major", imageFile: "02_High_Priestess.jpg", upright: "Intuition, sacred knowledge, mystery", uprightTh: "สัญชาตญาณ ความรู้ศักดิ์สิทธิ์ ความลึกลับ", reversed: "Secrets, withdrawal, silence", reversedTh: "ความลับ การถอนตัว ความเงียบ" },
  { id: 3, name: "The Empress", nameTh: "เดอะ เอ็มเพรส", suit: "major", imageFile: "03_Empress.jpg", upright: "Femininity, beauty, nature, abundance", uprightTh: "ความเป็นผู้หญิง ความงาม ธรรมชาติ ความอุดมสมบูรณ์", reversed: "Creative block, dependence, emptiness", reversedTh: "อุปสรรคทางความคิด การพึ่งพา ความว่างเปล่า" },
  { id: 4, name: "The Emperor", nameTh: "เดอะ  emperor", suit: "major", imageFile: "04_Emperor.jpg", upright: "Authority, establishment, structure", uprightTh: "อำนาจ สถาบัน โครงสร้าง", reversed: "Tyranny, rigidity, coldness", reversedTh: "การกดขี่ ความเข้มงวด ความเย็นชา" },
  { id: 5, name: "The Hierophant", nameTh: "เดอะ ไฮโรแฟนท์", suit: "major", imageFile: "05_Hierophant.jpg", upright: "Spiritual wisdom, tradition, conformity", uprightTh: "ปัญญาทางจิตวิญญาณ ประเพณี การปฏิบัติตาม", reversed: "Personal beliefs, freedom, challenging the status quo", reversedTh: "ความเชื่อส่วนตัว ความเป็นอิสระ การท้าทาย" },
  { id: 6, name: "The Lovers", nameTh: "เดอะ เลิฟเวอร์ส", suit: "major", imageFile: "06_Lovers.jpg", upright: "Love, harmony, relationships, values alignment", uprightTh: "ความรัก ความกลมเกลียว ความสัมพันธ์ ค่านิยม", reversed: "Self-love, disharmony, imbalance", reversedTh: "ความรักตนเอง ความไม่กลมเกลียว ความไม่สมดุล" },
  { id: 7, name: "The Chariot", nameTh: "เดอะ ชาริอ็อต", suit: "major", imageFile: "07_Chariot.jpg", upright: "Control, willpower, success, determination", uprightTh: "การควบคุม ความมุ่งมั่น ความสำเร็จ ความตั้งใจ", reversed: "Self-discipline, opposition, no direction", reversedTh: "วินัยในตนเอง ความขัดแย้ง ไม่มีทิศทาง" },
  { id: 8, name: "Strength", nameTh: "สเตรนท์", suit: "major", imageFile: "08_Strength.jpg", upright: "Courage, persuasion, influence, compassion", uprightTh: "ความกล้าหาญ การโน้มน้าว อิทธิพล ความเมตตา", reversed: "Self-doubt, weakness, insecurity", reversedTh: "ความสงสัยในตนเอง ความอ่อนแอ ความไม่มั่นคง" },
  { id: 9, name: "The Hermit", nameTh: "เดอะ เฮอร์มิท", suit: "major", imageFile: "09_Hermit.jpg", upright: "Soul-searching, introspection, solitude", uprightTh: "การค้นหาจิตวิญญาณ การไตร่ตรอง ความโดดเดี่ยว", reversed: "Isolation, loneliness, withdrawal", reversedTh: "ความโดดเดี่ยว ความเหงา การถอนตัว" },
  { id: 10, name: "Wheel of Fortune", nameTh: "เดอะ วีล ออฟ ฟอร์จูน", suit: "major", imageFile: "10_Wheel_of_Fortune.jpg", upright: "Good luck, karma, life cycles, destiny", uprightTh: "โชคดี กรรม วัฏจักรชีวิต โชคชะตา", reversed: "Bad luck, resistance to change, breaking cycles", reversedTh: "โชคร้าย ความต้านทานการเปลี่ยนแปลง การทำลายวัฏจักร" },
  { id: 11, name: "Justice", nameTh: "จัสติส", suit: "major", imageFile: "11_Justice.jpg", upright: "Justice, fairness, truth, law", uprightTh: "ความยุติธรรม ความเป็นธรรม ความจริง กฎหมาย", reversed: "Unfairness, dishonesty, lack of accountability", reversedTh: "ความไม่ยุติธรรม ความไม่ซื่อสัตย์ ไม่รับผิดชอบ" },
  { id: 12, name: "The Hanged Man", nameTh: "เดอะ แฮงด์ แมน", suit: "major", imageFile: "12_Hanged_Man.jpg", upright: "Pause, surrender, letting go, new perspectives", uprightTh: "การหยุดพัก การยอมแพ้ การปล่อยไป มุมมองใหม่", reversed: "Delays, resistance, stalling, indecision", reversedTh: "ความล่าช้า ความต้านทาน การชะลอ ความลังเล" },
  { id: 13, name: "Death", nameTh: "เดธ", suit: "major", imageFile: "13_Death.jpg", upright: "Endings, change, transformation, transition", uprightTh: "จุดจบ การเปลี่ยนแปลง การเปลี่ยนแปลง การเปลี่ยนผ่าน", reversed: "Resistance to change, personal transformation delayed", reversedTh: "ความต้านทานการเปลี่ยนแปลง การเปลี่ยนแปลงส่วนตัวล่าช้า" },
  { id: 14, name: "Temperance", nameTh: "เทมเพอแรนซ์", suit: "major", imageFile: "14_Temperance.jpg", upright: "Balance, moderation, patience, purpose", uprightTh: "ความสมดุล ความพอประมาณ ความอดทน จุดมุ่งหมาย", reversed: "Imbalance, excess, self-healing needed", reversedTh: "ความไม่สมดุล ความมากเกินไป ต้องรักษาตนเอง" },
  { id: 15, name: "The Devil", nameTh: "เดอะ เดวิล", suit: "major", imageFile: "15_Devil.jpg", upright: "Shadow self, attachment, addiction, restriction", uprightTh: "เงามืด การยึดติด การติดยา การจำกัด", reversed: "Releasing limiting beliefs, exploring dark thoughts", reversedTh: "การปล่อยความเชื่อที่จำกัด การสำรวจความคิดมืด" },
  { id: 16, name: "The Tower", nameTh: "เดอะ ทาวเวอร์", suit: "major", imageFile: "16_Tower.jpg", upright: "Sudden change, upheaval, chaos, revelation", uprightTh: "การเปลี่ยนแปลงกะทันหัน ความวุ่นวาย ความโกลาหล การเปิดเผย", reversed: "Personal transformation, fear of change, averting disaster", reversedTh: "การเปลี่ยนแปลงส่วนตัว ความกลัวการเปลี่ยนแปลง การหลีกเลี่ยงหายนะ" },
  { id: 17, name: "The Star", nameTh: "เดอะ สตาร์", suit: "major", imageFile: "17_Star.jpg", upright: "Hope, faith, purpose, renewal, spirituality", uprightTh: "ความหวัง ความศรัทธา จุดมุ่งหมาย การต่ออายุ จิตวิญญาณ", reversed: "Lack of faith, despair, self-trust issues", reversedTh: "ไม่มีความศรัทธา ความสิ้นหวัง ปัญหาความไว้วางใจตนเอง" },
  { id: 18, name: "The Moon", nameTh: "เดอะ มูน", suit: "major", imageFile: "18_Moon.jpg", upright: "Illusion, fear, anxiety, subconscious", uprightTh: "ภาพลวงตา ความกลัว ความวิตกกังวล จิตใต้สำนึก", reversed: "Release of fear, repressed emotion, inner confusion", reversedTh: "การปล่อยความกลัว อารมณ์ที่กดไว้ ความสับสนภายใน" },
  { id: 19, name: "The Sun", nameTh: "เดอะ ซัน", suit: "major", imageFile: "19_Sun.jpg", upright: "Positivity, fun, warmth, success, vitality", uprightTh: "ความคิดบวก ความสนุก ความอบอุ่น ความสำเร็จ ชีวิตชีวา", reversed: "Inner child issues, feeling down, overly optimistic", reversedTh: "ปัญหาเด็กภายใน รู้สึกแย่ มองโลกในแง่ดีเกินไป" },
  { id: 20, name: "Judgement", nameTh: "จัดจ์เม้นท์", suit: "major", imageFile: "20_Judgement.jpg", upright: "Judgement, rebirth, inner calling, absolution", uprightTh: "การพิพากษา การเกิดใหม่ การเรียกภายใน การอภัยโทษ", reversed: "Self-doubt, refusal of self-examination", reversedTh: "ความสงสัยในตนเอง การปฏิเสธการตรวจสอบตนเอง" },
  { id: 21, name: "The World", nameTh: "เดอะ เวิลด์", suit: "major", imageFile: "21_World.jpg", upright: "Completion, integration, accomplishment, travel", uprightTh: "ความสมบูรณ์ การรวมตัว ความสำเร็จ การเดินทาง", reversed: "Seeking personal closure, shortcuts, delays", reversedTh: "การค้นหาความสมบูรณ์ส่วนตัว ทางลัด ความล่าช้า" },
];

const cups: TarotCard[] = [
  { id: 22, name: "Ace of Cups", nameTh: "เอซแห่งถ้วย", suit: "cups", imageFile: "Cups01.jpg", upright: "Love, new feelings, emotional awakening", uprightTh: "ความรัก ความรู้สึกใหม่ การตื่นทางอารมณ์", reversed: "Emotional loss, blocked creativity, emptiness", reversedTh: "การสูญเสียอารมณ์ ความคิดสร้างสรรค์ที่ถูกบล็อก ความว่างเปล่า" },
  { id: 23, name: "Two of Cups", nameTh: "สองแห่งถ้วย", suit: "cups", imageFile: "Cups02.jpg", upright: "Unified love, partnership, mutual attraction", uprightTh: "ความรักที่เป็นหนึ่ง ความเป็นคู่ แรงดึงดูดร่วมกัน", reversed: "Self-love needed, break-up, imbalance in relationship", reversedTh: "ต้องรักตนเอง ความแตกหัก ความไม่สมดุลในความสัมพันธ์" },
  { id: 24, name: "Three of Cups", nameTh: "สามแห่งถ้วย", suit: "cups", imageFile: "Cups03.jpg", upright: "Celebration, friendship, creativity, community", uprightTh: "การเฉลิมฉลอง มิตรภาพ ความคิดสร้างสรรค์ ชุมชน", reversed: "Independence, solitude, gossip", reversedTh: "ความเป็นอิสระ ความโดดเดี่ยว การนินทา" },
  { id: 25, name: "Four of Cups", nameTh: "สี่แห่งถ้วย", suit: "cups", imageFile: "Cups04.jpg", upright: "Meditation, contemplation, apathy, reevaluation", uprightTh: "การทำสมาธิ การใคร่ครวญ ความเฉยเมย การประเมินใหม่", reversed: "Retreat, withdrawal, checking in with yourself", reversedTh: "การถอยกลับ การถอนตัว การตรวจสอบตนเอง" },
  { id: 26, name: "Five of Cups", nameTh: "ห้าแห่งถ้วย", suit: "cups", imageFile: "Cups05.jpg", upright: "Regret, failure, disappointment, pessimism", uprightTh: "ความเสียใจ ความล้มเหลว ความผิดหวัง ความมองโลกในแง่ร้าย", reversed: "Personal setbacks overcome, self-forgiveness", reversedTh: "การเอาชนะอุปสรรคส่วนตัว การให้อภัยตนเอง" },
  { id: 27, name: "Six of Cups", nameTh: "หกแห่งถ้วย", suit: "cups", imageFile: "Cups06.jpg", upright: "Revisiting the past, childhood memories, innocence", uprightTh: "การทบทวนอดีต ความทรงจำในวัยเด็ก ความบริสุทธิ์", reversed: "Living in the past, forgiveness needed, naivety", reversedTh: "การใช้ชีวิตในอดีต ต้องให้อภัย ความไร้เดียงสา" },
  { id: 28, name: "Seven of Cups", nameTh: "เจ็ดแห่งถ้วย", suit: "cups", imageFile: "Cups07.jpg", upright: "Fantasy, illusion, wishful thinking, choices", uprightTh: "จินตนาการ ภาพลวงตา การคิดหวัง ทางเลือก", reversed: "Personal alignment, action taken, confusion cleared", reversedTh: "การจัดตำแหน่งส่วนตัว การกระทำที่ทำแล้ว ความสับสนที่คลี่คลาย" },
  { id: 29, name: "Eight of Cups", nameTh: "แปดแห่งถ้วย", suit: "cups", imageFile: "Cups08.jpg", upright: "Disappointment, abandonment, withdrawal, escapism", uprightTh: "ความผิดหวัง การถูกละทิ้ง การถอนตัว หนีความจริง", reversed: "Trying one more time, indecision, aimless drifting", reversedTh: "ลองอีกครั้ง ความลังเล การลอยไปลอยมา" },
  { id: 30, name: "Nine of Cups", nameTh: "เก้าแห่งถ้วย", suit: "cups", imageFile: "Cups09.jpg", upright: "Contentment, satisfaction, gratitude, wish come true", uprightTh: "ความพึงพอใจ ความพอใจ ความกตัญญู ความปรารถนาเป็นจริง", reversed: "Inner happiness, materialism, dissatisfaction", reversedTh: "ความสุขภายใน วัตถุนิยม ความไม่พอใจ" },
  { id: 31, name: "Ten of Cups", nameTh: "สิบแห่งถ้วย", suit: "cups", imageFile: "Cups10.jpg", upright: "Divine love, blissful relationships, harmony, alignment", uprightTh: "ความรักศักดิ์สิทธิ์ ความสัมพันธ์ที่มีความสุข ความกลมเกลียว การจัดตำแหน่ง", reversed: "Disconnection, misaligned values, broken family", reversedTh: "การขาดการเชื่อมต่อ ค่านิยมที่ไม่ตรงกัน ครอบครัวที่แตกสลาย" },
  { id: 32, name: "Page of Cups", nameTh: "เพจแห่งถ้วย", suit: "cups", imageFile: "Cups11.jpg", upright: "Creative opportunity, intuitive messages, curiosity", uprightTh: "โอกาสทางความคิดสร้างสรรค์ ข้อความจากสัญชาตญาณ ความอยากรู้", reversed: "Emotional immaturity, insecurity, creative block", reversedTh: "ความไม่เป็นผู้ใหญ่ทางอารมณ์ ความไม่มั่นคง การบล็อกความคิดสร้างสรรค์" },
  { id: 33, name: "Knight of Cups", nameTh: "อัศวินแห่งถ้วย", suit: "cups", imageFile: "Cups12.jpg", upright: "Creativity, romance, charm, imagination, beauty", uprightTh: "ความคิดสร้างสรรค์ โรแมนซิก ความมีเสน่ห์ จินตนาการ ความงาม", reversed: "Overactive imagination, unrealistic, jealousy", reversedTh: "จินตนาการที่ทำงานหนักเกินไป ไม่เป็นจริง ความหึงหวง" },
  { id: 34, name: "Queen of Cups", nameTh: "ควีนแห่งถ้วย", suit: "cups", imageFile: "Cups13.jpg", upright: "Compassionate, caring, emotionally stable", uprightTh: "ความเมตตา การดูแล อารมณ์มั่นคง", reversed: "Inner feelings, self-care needed, co-dependency", reversedTh: "ความรู้สึกภายใน ต้องดูแลตนเอง การพึ่งพาอาศัย" },
  { id: 35, name: "King of Cups", nameTh: "คิงแห่งถ้วย", suit: "cups", imageFile: "Cups14.jpg", upright: "Emotionally balanced, compassionate, diplomatic", uprightTh: "อารมณ์สมดุล ความเมตตา การทูต", reversed: "Self-compassion deficit, inner feelings, moodiness", reversedTh: "การขาดความเมตตาตนเอง ความรู้สึกภายใน ความอารมณ์ร้าย" },
];

const pentacles: TarotCard[] = [
  { id: 36, name: "Ace of Pentacles", nameTh: "เอซแห่งเหรียญ", suit: "pentacles", imageFile: "Pents01.jpg", upright: "New financial opportunity, prosperity, abundance", uprightTh: "โอกาสทางการเงินใหม่ ความมั่งคั่ง ความอุดมสมบูรณ์", reversed: "Lost opportunity, lack of planning, lack of foresight", reversedTh: "โอกาสที่หายไป การไม่วางแผน ไม่มีการมองการณ์ไกล" },
  { id: 37, name: "Two of Pentacles", nameTh: "สองแห่งเหรียญ", suit: "pentacles", imageFile: "Pents02.jpg", upright: "Multiple priorities, time management, prioritization", uprightTh: "หลายลำดับความสำคัญ การจัดการเวลา การจัดลำดับ", reversed: "Over-committed, disorganization, financial instability", reversedTh: "มีมากเกินไป ไม่มีระเบียบ ความไม่มั่นคงทางการเงิน" },
  { id: 38, name: "Three of Pentacles", nameTh: "สามแห่งเหรียญ", suit: "pentacles", imageFile: "Pents03.jpg", upright: "Teamwork, collaboration, learning, implementation", uprightTh: "การทำงานเป็นทีม การร่วมมือ การเรียนรู้ การนำไปใช้", reversed: "Disharmony, misalignment, working alone", reversedTh: "ความไม่กลมเกลียว ความไม่ตรงกัน การทำงานคนเดียว" },
  { id: 39, name: "Four of Pentacles", nameTh: "สี่แห่งเหรียญ", suit: "pentacles", imageFile: "Pents04.jpg", upright: "Saving, security, conserving, scarcity mindset", uprightTh: "การออม ความปลอดภัย การอนุรักษ์ จิตใจที่ขาดแคลน", reversed: "Over-spending, generosity, letting go of control", reversedTh: "การใช้จ่ายเกิน ความใจกว้าง การปล่อยการควบคุม" },
  { id: 40, name: "Five of Pentacles", nameTh: "ห้าแห่งเหรียญ", suit: "pentacles", imageFile: "Pents05.jpg", upright: "Financial loss, poverty, lack mindset, isolation", uprightTh: "การสูญเสียทางการเงิน ความยากจน จิตใจที่ขาดแคลน ความโดดเดี่ยว", reversed: "Recovery from loss, spiritual poverty overcome", reversedTh: "การกู้คืนจากการสูญเสีย การเอาชนะความยากจนทางจิตวิญญาณ" },
  { id: 41, name: "Six of Pentacles", nameTh: "หกแห่งเหรียญ", suit: "pentacles", imageFile: "Pents06.jpg", upright: "Giving, receiving, sharing wealth, generosity", uprightTh: "การให้ การรับ การแบ่งปันความมั่งคั่ง ความใจกว้าง", reversed: "Self-care needed, strings attached, debts", reversedTh: "ต้องดูแลตนเอง มีเงื่อนไข หนี้สิน" },
  { id: 42, name: "Seven of Pentacles", nameTh: "เจ็ดแห่งเหรียญ", suit: "pentacles", imageFile: "Pents07.jpg", upright: "Long-term view, sustainable results, perseverance", uprightTh: "มุมมองระยะยาว ผลลัพธ์ที่ยั่งยืน ความอดทน", reversed: "Lack of progress, procrastination, investments not paying off", reversedTh: "ไม่มีความก้าวหน้า การผัดวันประกันพรุ่ง การลงทุนไม่คุ้ม" },
  { id: 43, name: "Eight of Pentacles", nameTh: "แปดแห่งเหรียญ", suit: "pentacles", imageFile: "Pents08.jpg", upright: "Apprenticeship, repetitive tasks, mastery, skill development", uprightTh: "การฝึกงาน งานซ้ำๆ ความเชี่ยวชาญ การพัฒนาทักษะ", reversed: "Self-development, perfectionism, misdirected activity", reversedTh: "การพัฒนาตนเอง ความสมบูรณ์แบบ _ACTIVITYที่ไม่ถูกทิศทาง" },
  { id: 44, name: "Nine of Pentacles", nameTh: "เก้าแห่งเหรียญ", suit: "pentacles", imageFile: "Pents09.jpg", upright: "Abundance, luxury, self-sufficiency, financial independence", uprightTh: "ความอุดมสมบูรณ์ ความหรูหรา ความเป็นเอกเทศ ความเป็นอิสระทางการเงิน", reversed: "Self-worth issues, overinvestment, superficial values", reversedTh: "ปัญหาคุณค่าในตนเอง การลงทุนมากเกินไป ค่านิยมที่ผิวเผิน" },
  { id: 45, name: "Ten of Pentacles", nameTh: "สิบแห่งเหรียญ", suit: "pentacles", imageFile: "Pents10.jpg", upright: "Wealth, financial security, family, long-term success", uprightTh: "ความมั่งคั่ง ความปลอดภัยทางการเงิน ครอบครัว ความสำเร็จระยะยาว", reversed: "Financial failure, loneliness, family disputes", reversedTh: "ความล้มเหลวทางการเงิน ความโดดเดี่ยว ข้อพิพาทในครอบครัว" },
  { id: 46, name: "Page of Pentacles", nameTh: "เพจแห่งเหรียญ", suit: "pentacles", imageFile: "Pents11.jpg", upright: "Ambition, desire, diligence, dedication, underway", uprightTh: "ความทะเยอทะยาน ความปรารถนา ความขยันหมั่นเพียร ความทุ่มเท กำลังดำเนินอยู่", reversed: "Lack of progress, procrastination, learn from setbacks", reversedTh: "ไม่มีความก้าวหน้า การผัดวันประกันพรุ่ง เรียนรู้จากความล้มเหลว" },
  { id: 47, name: "Knight of Pentacles", nameTh: "อัศวินแห่งเหรียญ", suit: "pentacles", imageFile: "Pents12.jpg", upright: "Hard work, productivity, routine, conservatism", uprightTh: "การทำงานหนัก ผลผลิต กิจวัตร อนุรักษนิยม", reversed: "Self-discipline needed, laziness, obsessiveness", reversedTh: "ต้องมีวินัยในตนเอง ความเกียจคร้าน ความหมกมุ่น" },
  { id: 48, name: "Queen of Pentacles", nameTh: "ควีนแห่งเหรียญ", suit: "pentacles", imageFile: "Pents13.jpg", upright: "Nurturing, practical, providing, down-to-earth", uprightTh: "การเลี้ยงดู ความเป็นจริง การให้ ความมั่นคง", reversed: "Financial independence needed, self-care deficit", reversedTh: "ต้องเป็นอิสระทางการเงิน การขาดการดูแลตนเอง" },
  { id: 49, name: "King of Pentacles", nameTh: "คิงแห่งเหรียญ", suit: "pentacles", imageFile: "Pents14.jpg", upright: "Wealth, business, leadership, security, discipline", uprightTh: "ความมั่งคั่ง ธุรกิจ ความเป็นผู้นำ ความปลอดภัย วินัย", reversed: "Financially inept, obsessed with money, stubborn", reversedTh: "ไม่เก่งทางการเงิน หมกมุ่นกับเงิน ดื้อดึง" },
];

const swords: TarotCard[] = [
  { id: 50, name: "Ace of Swords", nameTh: "เอซแห่งดาบ", suit: "swords", imageFile: "Swords01.jpg", upright: "Breakthrough, clarity, sharp mind, truth, success", uprightTh: "จุดเปลี่ยน ความชัดเจน จิตใจเฉียบคม ความจริง ความสำเร็จ", reversed: "Inner clarity needed, re-think idea, confusion", reversedTh: "ต้องมีความชัดเจนจากภายใน คิดใหม่ ความสับสน" },
  { id: 51, name: "Two of Swords", nameTh: "สองแห่งดาบ", suit: "swords", imageFile: "Swords02.jpg", upright: "Difficult decisions, avoidance, stalemate", uprightTh: "การตัดสินใจที่ยาก การหลีกเลี่ยง ทางตัน", reversed: "Indecision, confusion, information overload", reversedTh: "ความลังเล ความสับสน ข้อมูลล้นเกิน" },
  { id: 52, name: "Three of Swords", nameTh: "สามแห่งดาบ", suit: "swords", imageFile: "Swords03.jpg", upright: "Heartbreak, emotional pain, sorrow, grief, hurt", uprightTh: "ความปวดร้าว ความเจ็บปวดทางอารมณ์ ความโศกเศร้า ความเสียใจ", reversed: "Recovery, forgiveness, releasing pain, optimism", reversedTh: "การกู้คืน การให้อภัย การปล่อยความเจ็บปวด ความมองโลกในแง่ดี" },
  { id: 53, name: "Four of Swords", nameTh: "สี่แห่งดาบ", suit: "swords", imageFile: "Swords04.jpg", upright: "Rest, relaxation, meditation, contemplation, recovery", uprightTh: "พักผ่อน ผ่อนคลาย การทำสมาธิ การใคร่ครวญ การฟื้นฟู", reversed: "Exhaustion, burn-out, stagnation, need for solitude", reversedTh: "ความเหนื่อยล้า การเผาไหม้หมด ความหยุดนิ่ง ต้องอยู่คนเดียว" },
  { id: 54, name: "Five of Swords", nameTh: "ห้าแห่งดาบ", suit: "swords", imageFile: "Swords05.jpg", upright: "Conflict, disagreements, competition, defeat, winning at all costs", uprightTh: "ความขัดแย้ง ความไม่เห็นด้วย การแข่งขัน ความพ่ายแพ้ ชนะทุกวิถีทาง", reversed: "Reconciliation, making amends, past resentment", reversedTh: "การปรองดอง การแก้ไข ความขุ่นเคืองในอดีต" },
  { id: 55, name: "Six of Swords", nameTh: "หกแห่งดาบ", suit: "swords", imageFile: "Swords06.jpg", upright: "Transition, change, rite of passage, releasing baggage", uprightTh: "การเปลี่ยนผ่าน การเปลี่ยนแปลง พิธีกรรม การปล่อยสัมภาระ", reversed: "Personal transition, resistance, unfinished business", reversedTh: "การเปลี่ยนผ่านส่วนตัว ความต้านทาน งานที่ยังไม่เสร็จ" },
  { id: 56, name: "Seven of Swords", nameTh: "เจ็ดแห่งดาบ", suit: "swords", imageFile: "Swords07.jpg", upright: "Deception, trickery, tactics, strategy, resourcefulness", uprightTh: "การหลอกลวง ความเจ้าเล่ห์ ยุทธวิธี กลยุทธ์ ความคล่องตัว", reversed: "Coming clean, rethinking approach, conscience", reversedTh: "การพูดความจริง การคิดใหม่ ความรู้สึกผิดชอบชั่วดี" },
  { id: 57, name: "Eight of Swords", nameTh: "แปดแห่งดาบ", suit: "swords", imageFile: "Swords08.jpg", upright: "Imprisonment, entrapment, self-victimization, restriction", uprightTh: "การถูกคุมขัง การถูกกักขัง การทำร้ายตนเอง การจำกัด", reversed: "Self-acceptance, new perspective, freedom", reversedTh: "การยอมรับตนเอง มุมมองใหม่ ความเป็นอิสระ" },
  { id: 58, name: "Nine of Swords", nameTh: "เก้าแห่งดาบ", suit: "swords", imageFile: "Swords09.jpg", upright: "Anxiety, worry, fear, depression, nightmares", uprightTh: "ความวิตกกังวล ความกลัว ความซึมเศร้า ฝันร้าย", reversed: "Inner turmoil, deep-seated fears, confusion cleared", reversedTh: "ความวุ่นวายภายใน ความกลัวที่ฝังลึก ความสับสนที่คลี่คลาย" },
  { id: 59, name: "Ten of Swords", nameTh: "สิบแห่งดาบ", suit: "swords", imageFile: "Swords10.jpg", upright: "Painful endings, deep wounds, betrayal, loss, crisis", uprightTh: "จุดจบที่เจ็บปวด แผลลึก การทรยศ การสูญเสีย วิกฤต", reversed: "Recovery, regeneration, resisting an inevitable end", reversedTh: "การกู้คืน การฟื้นฟู การต้านทานจุดจบที่หลีกเลี่ยงไม่ได้" },
  { id: 60, name: "Page of Swords", nameTh: "เพจแห่งดาบ", suit: "swords", imageFile: "Swords11.jpg", upright: "New ideas, curiosity, thirst for knowledge, new communication", uprightTh: "ความคิดใหม่ ความอยากรู้ ความกระหายความรู้ การสื่อสารใหม่", reversed: "Self-expression issues, hurtful words, haste", reversedTh: "ปัญหาการแสดงออก คำพูดที่ทำร้าย ความเร่งรีบ" },
  { id: 61, name: "Knight of Swords", nameTh: "อัศวินแห่งดาบ", suit: "swords", imageFile: "Swords12.jpg", upright: "Ambitious, action-oriented, driven, perfectionist", uprightTh: "ทะเยอทะยาน ขับเคลื่อนด้วยการกระทำ มุ่งมั่น สมบูรณ์แบบ", reversed: "Impulsive, burnout, self-sabotage, overly aggressive", reversedTh: "หุนหันพลันแล่น การเผาไหม้หมด การทำร้ายตนเอง ก้าวร้าวเกินไป" },
  { id: 62, name: "Queen of Swords", nameTh: "ควีนแห่งดาบ", suit: "swords", imageFile: "Swords13.jpg", upright: "Independent, clear boundaries, direct communication", uprightTh: "เป็นอิสระ ขอบเขตที่ชัดเจน การสื่อสารที่ตรงไปตรงมา", reversed: "Cold-hearted, cruel, bitterness, overly emotional", reversedTh: "ใจเย็นชา ความโหดร้าย ความขมขื่น อารมณ์มากเกินไป" },
  { id: 63, name: "King of Swords", nameTh: "คิงแห่งดาบ", suit: "swords", imageFile: "Swords14.jpg", upright: "Mental clarity, intellectual power, authority, truth", uprightTh: "ความชัดเจนทางจิตใจ พลังทางปัญญา อำนาจ ความจริง", reversed: "Manipulation, cruelty, abuse of power", reversedTh: "การจัดการ ความโหดร้าย การใช้อำนาจในทางที่ผิด" },
];

const wands: TarotCard[] = [
  { id: 64, name: "Ace of Wands", nameTh: "เอซแห่งไม้", suit: "wands", imageFile: "Wands01.jpg", upright: "Inspiration, new opportunities, growth, potential", uprightTh: "แรงบันดาลใจ โอกาสใหม่ การเติบโต ศักยภาพ", reversed: "Delays, lack of direction, distractions", reversedTh: "ความล่าช้า ไม่มีทิศทาง สิ่งรบกวน" },
  { id: 65, name: "Two of Wands", nameTh: "สองแห่งไม้", suit: "wands", imageFile: "Wands02.jpg", upright: "Future planning, progress, decisions, discovery", uprightTh: "การวางแผนอนาคต ความก้าวหน้า การตัดสินใจ การค้นพบ", reversed: "Fear of change, playing it safe, bad planning", reversedTh: "ความกลัวการเปลี่ยนแปลง การเล่นปลอดภัย แผนไม่ดี" },
  { id: 66, name: "Three of Wands", nameTh: "สามแห่งไม้", suit: "wands", imageFile: "Wands03.jpg", upright: "Progress, expansion, foresight, overseas opportunities", uprightTh: "ความก้าวหน้า การขยายตัว การมองการณ์ไกล โอกาสต่างประเทศ", reversed: "Obstacles, delays, frustration, setbacks", reversedTh: "อุปสรรค ความล่าช้า ความหงุดหงิด ความล้มเหลว" },
  { id: 67, name: "Four of Wands", nameTh: "สี่แห่งไม้", suit: "wands", imageFile: "Wands04.jpg", upright: "Celebration, joy, harmony, relaxation, homecoming", uprightTh: "การเฉลิมฉลอง ความสุข ความกลมเกลียว การผ่อนคลาย การกลับบ้าน", reversed: "Personal celebration, inner harmony, conflict with others", reversedTh: "การเฉลิมฉลองส่วนตัว ความกลมเกลียวภายใน ความขัดแย้งกับผู้อื่น" },
  { id: 68, name: "Five of Wands", nameTh: "ห้าแห่งไม้", suit: "wands", imageFile: "Wands05.jpg", upright: "Conflict, disagreements, competition, tension", uprightTh: "ความขัดแย้ง ความไม่เห็นด้วย การแข่งขัน ความตึงเครียด", reversed: "Inner conflict, avoiding conflict, peace after struggle", reversedTh: "ความขัดแย้งภายใน การหลีกเลี่ยงความขัดแย้ง ความสงบหลังการต่อสู้" },
  { id: 69, name: "Six of Wands", nameTh: "หกแห่งไม้", suit: "wands", imageFile: "Wands06.jpg", upright: "Success, public recognition, progress, self-confidence", uprightTh: "ความสำเร็จ การยอมรับในที่สาธารณะ ความก้าวหน้า ความมั่นใจในตนเอง", reversed: "Private achievement, fall from grace, egotism", reversedTh: "ความสำเร็จส่วนตัว การล้มจากความสง่า ความเห็นแก่ตัว" },
  { id: 70, name: "Seven of Wands", nameTh: "เจ็ดแห่งไม้", suit: "wands", imageFile: "Wands07.jpg", upright: "Challenge, competition, protection, perseverance", uprightTh: "ความท้าทาย การแข่งขัน การปกป้อง ความอดทน", reversed: "Exhaustion, giving up, overwhelmed", reversedTh: "ความเหนื่อยล้า การยอมแพ้ รู้สึกท่วมท้น" },
  { id: 71, name: "Eight of Wands", nameTh: "แปดแห่งไม้", suit: "wands", imageFile: "Wands08.jpg", upright: "Speed, action, air travel, movement, swift change", uprightTh: "ความเร็ว การกระทำ การเดินทางทางอากาศ การเคลื่อนไหว การเปลี่ยนแปลงอย่างรวดเร็ว", reversed: "Delays, frustration, waiting, slowing down", reversedTh: "ความล่าช้า ความหงุดหงิด การรอคอย การชะลอ" },
  { id: 72, name: "Nine of Wands", nameTh: "เก้าแห่งไม้", suit: "wands", imageFile: "Wands09.jpg", upright: "Resilience, grit, last stand, persistence, boundaries", uprightTh: "ความยืดหยุ่น ความอดทน การต่อสู้ครั้งสุดท้าย ความเพียร ขอบเขต", reversed: "Exhaustion, fatigue, paranoia, defensiveness", reversedTh: "ความเหนื่อยล้า ความอ่อนเพลี ความหวาดระแวง การป้องกันตัว" },
  { id: 73, name: "Ten of Wands", nameTh: "สิบแห่งไม้", suit: "wands", imageFile: "Wands10.jpg", upright: "Burden, extra responsibility, hard work, completion", uprightTh: "ภาระ ความรับผิดชอบเพิ่มเติม การทำงานหนัก ความสมบูรณ์", reversed: "Releasing burdens, delegating, burnout avoided", reversedTh: "การปล่อยภาระ การมอบหมาย การหลีกเลี่ยงการเผาไหม้หมด" },
  { id: 74, name: "Page of Wands", nameTh: "เพจแห่งไม้", suit: "wands", imageFile: "Wands11.jpg", upright: "Enthusiasm, exploration, discovery, free spirit", uprightTh: "ความกระตือรือร้น การสำรวจ การค้นพบ จิตใจอิสระ", reversed: "Setbacks to new ideas, lack of direction, procrastination", reversedTh: "อุปสรรคต่อความคิดใหม่ ไม่มีทิศทาง การผัดวันประกันพรุ่ง" },
  { id: 75, name: "Knight of Wands", nameTh: "อัศวินแห่งไม้", suit: "wands", imageFile: "Wands12.jpg", upright: "Energy, passion, inspired action, adventure, impulsiveness", uprightTh: "พลังงาน ความหลงใหล การกระทำที่ได้รับแรงบันดาลใจ การผจญภัย ความหุนหันพลันแล่น", reversed: "Haste, scattered energy, frustration, delays", reversedTh: "ความเร่งรีบ พลังงานที่กระจัดกระจาย ความหงุดหงิด ความล่าช้า" },
  { id: 76, name: "Queen of Wands", nameTh: "ควีนแห่งไม้", suit: "wands", imageFile: "Wands13.jpg", upright: "Courage, confidence, independence, determination, warmth", uprightTh: "ความกล้าหาญ ความมั่นใจ ความเป็นอิสระ ความมุ่งมั่น ความอบอุ่น", reversed: "Selfishness, jealousy, insecure, demanding", reversedTh: "ความเห็นแก่ตัว ความหึงหวง ความไม่มั่นคง ความเรียกร้อง" },
  { id: 77, name: "King of Wands", nameTh: "คิงแห่งไม้", suit: "wands", imageFile: "Wands14.jpg", upright: "Natural-born leader, vision, respect, integrity", uprightTh: "ผู้นำโดยธรรมชาติ วิสัยทัศน์ ความเคารพ ความซื่อสัตย์", reversed: "Impulsive, overbearing, unrealistic expectations", reversedTh: "หุนหันพลันแล่น เจ้ากี้เจ้าการ ความคาดหวังที่ไม่สมจริง" },
];

export const ALL_CARDS: TarotCard[] = [
  ...majorArcana,
  ...cups,
  ...pentacles,
  ...swords,
  ...wands,
];

export function shuffleDeck(): TarotCard[] {
  const deck = [...ALL_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function drawCards(spread: Spread): DrawnCard[] {
  const shuffled = shuffleDeck();
  return spread.positions.map((position, index) => ({
    card: shuffled[index],
    position,
    reversed: Math.random() < 0.5,
    index,
  }));
}
