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
  love?: { upright: string; reversed: string };
  career?: { upright: string; reversed: string };
  study?: { upright: string; reversed: string };
  finance?: { upright: string; reversed: string };
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
  { id: 0, name: "The Fool", nameTh: "เดอะ ฟูล", suit: "major", imageFile: "00_Fool.jpg", upright: "New beginnings, innocence, spontaneity", uprightTh: "การเริ่มต้นใหม่ ความบริสุทธิ์ ความเป็นธรรมชาติ", reversed: "Recklessness, risk-taking, foolishness", reversedTh: "ความประมาท การเสี่ยงโชค ความโง่เขลา",
    love: { upright: "全新的感情开始，敞开心扉", reversed: "盲目投入，不切实际的期待" },
    career: { upright: "新的职业机会，勇于尝试", reversed: "冲动决定，缺乏规划" },
    study: { upright: "好奇心驱动学习，思维开放", reversed: "注意力分散，缺乏方向" },
    finance: { upright: "新的财务机会，小额投资", reversed: "冲动消费，财务风险" },
  },
  { id: 1, name: "The Magician", nameTh: "เดอะ เมจิเชียน", suit: "major", imageFile: "01_Magician.jpg", upright: "Manifestation, resourcefulness, power", uprightTh: "การแสดงออก ความมั่งคั่ง พลังอำนาจ", reversed: "Manipulation, poor planning, untapped talents", reversedTh: "การจัดการ แผนไม่ดี ความสามารถที่ไม่ได้ใช้",
    love: { upright: "用行动表达爱意，有魅力", reversed: "操控感情，不真诚" },
    career: { upright: "发挥才能，项目成功", reversed: "才能未被利用，计划不周" },
    study: { upright: "学习能力强，善于运用资源", reversed: "学习方法不当，缺乏专注" },
    finance: { upright: "财务规划得当，收入增长", reversed: "财务欺骗，投资失误" },
  },
  { id: 2, name: "The High Priestess", nameTh: "เดอะ ไฮ พรีสเทส", suit: "major", imageFile: "02_High_Priestess.jpg", upright: "Intuition, sacred knowledge, mystery", uprightTh: "สัญชาตญาณ ความรู้ศักดิ์สิทธิ์ ความลึกลับ", reversed: "Secrets, withdrawal, silence", reversedTh: "ความลับ การถอนตัว ความเงียบ",
    love: { upright: "直觉告诉你真相，保持耐心", reversed: "隐藏的情感，沟通不畅" },
    career: { upright: "相信直觉，等待时机", reversed: "信息不透明，秘密" },
    study: { upright: "深层学习，内在智慧", reversed: "学习受阻，缺乏方向" },
    finance: { upright: "财务直觉准确，谨慎投资", reversed: "财务信息不明，隐藏风险" },
  },
  { id: 3, name: "The Empress", nameTh: "เดอะ เอ็มเพรส", suit: "major", imageFile: "03_Empress.jpg", upright: "Femininity, beauty, nature, abundance", uprightTh: "ความเป็นผู้หญิง ความงาม ธรรมชาติ ความอุดมสมบูรณ์", reversed: "Creative block, dependence, emptiness", reversedTh: "อุปสรรคทางความคิด การพึ่งพา ความว่างเปล่า",
    love: { upright: "感情丰富，关系和谐", reversed: "过度依赖，缺乏安全感" },
    career: { upright: "创意丰富，项目丰收", reversed: "创意枯竭，过度依赖他人" },
    study: { upright: "学习环境良好，吸收力强", reversed: "学习压力大，缺乏动力" },
    finance: { upright: "财务稳定，收入增长", reversed: "财务依赖，缺乏独立" },
  },
  { id: 4, name: "The Emperor", nameTh: "เดอะ  emperor", suit: "major", imageFile: "04_Emperor.jpg", upright: "Authority, establishment, structure", uprightTh: "อำนาจ สถาบัน โครงสร้าง", reversed: "Tyranny, rigidity, coldness", reversedTh: "การกดขี่ ความเข้มงวด ความเย็นชา",
    love: { upright: "稳定的关系，承诺", reversed: "控制欲强，情感冷漠" },
    career: { upright: "领导力强，事业稳定", reversed: "专制管理，缺乏灵活性" },
    study: { upright: "学习有计划，自律", reversed: "学习压力大，缺乏弹性" },
    finance: { upright: "财务规划好，稳定增长", reversed: "财务控制过严，缺乏弹性" },
  },
  { id: 5, name: "The Hierophant", nameTh: "เดอะ ไฮโรแฟนท์", suit: "major", imageFile: "05_Hierophant.jpg", upright: "Spiritual wisdom, tradition, conformity", uprightTh: "ปัญญาทางจิตวิญญาณ ประเพณี การปฏิบัติตาม", reversed: "Personal beliefs, freedom, challenging the status quo", reversedTh: "ความเชื่อส่วนตัว ความเป็นอิสระ การท้าทาย",
    love: { upright: "传统关系，价值观一致", reversed: "打破传统，寻求自由" },
    career: { upright: "遵循规则，获得认可", reversed: "挑战权威，寻求突破" },
    study: { upright: "系统学习，跟随导师", reversed: "独立思考，挑战传统" },
    finance: { upright: "稳健理财，遵循规则", reversed: "打破常规，寻求新路" },
  },
  { id: 6, name: "The Lovers", nameTh: "เดอะ เลิฟเวอร์ส", suit: "major", imageFile: "06_Lovers.jpg", upright: "Love, harmony, relationships, values alignment", uprightTh: "ความรัก ความกลมเกลียว ความสัมพันธ์ ค่านิยม", reversed: "Self-love, disharmony, imbalance", reversedTh: "ความรักตนเอง ความไม่กลมเกลียว ความไม่สมดุล",
    love: { upright: "真爱，灵魂伴侣，和谐", reversed: "关系不和，价值观冲突" },
    career: { upright: "工作选择符合价值观", reversed: "工作与价值观冲突" },
    study: { upright: "学习兴趣浓厚，选择正确", reversed: "学习方向迷茫" },
    finance: { upright: "财务决策符合理财观", reversed: "财务决策犹豫不决" },
  },
  { id: 7, name: "The Chariot", nameTh: "เดอะ ชาริอ็อต", suit: "major", imageFile: "07_Chariot.jpg", upright: "Control, willpower, success, determination", uprightTh: "การควบคุม ความมุ่งมั่น ความสำเร็จ ความตั้งใจ", reversed: "Self-discipline, opposition, no direction", reversedTh: "วินัยในตนเอง ความขัดแย้ง ไม่มีทิศทาง",
    love: { upright: "主动追求，克服困难", reversed: "感情失控，缺乏方向" },
    career: { upright: "事业前进，克服障碍", reversed: "缺乏自律，方向不明" },
    study: { upright: "学习目标明确，全力以赴", reversed: "学习分心，缺乏毅力" },
    finance: { upright: "财务目标明确，努力实现", reversed: "财务失控，缺乏规划" },
  },
  { id: 8, name: "Strength", nameTh: "สเตรนท์", suit: "major", imageFile: "08_Strength.jpg", upright: "Courage, persuasion, influence, compassion", uprightTh: "ความกล้าหาญ การโน้มน้าว อิทธิพล ความเมตตา", reversed: "Self-doubt, weakness, insecurity", reversedTh: "ความสงสัยในตนเอง ความอ่อนแอ ความไม่มั่นคง",
    love: { upright: "用耐心和理解经营感情", reversed: "缺乏自信，感情脆弱" },
    career: { upright: "用软实力影响他人", reversed: "自我怀疑，缺乏勇气" },
    study: { upright: "学习毅力强，克服困难", reversed: "学习信心不足" },
    finance: { upright: "财务自律，稳步增长", reversed: "财务缺乏信心" },
  },
  { id: 9, name: "The Hermit", nameTh: "เดอะ เฮอร์มิท", suit: "major", imageFile: "09_Hermit.jpg", upright: "Soul-searching, introspection, solitude", uprightTh: "การค้นหาจิตวิญญาณ การไตร่ตรอง ความโดดเดี่ยว", reversed: "Isolation, loneliness, withdrawal", reversedTh: "ความโดดเดี่ยว ความเหงา การถอนตัว",
    love: { upright: "需要独处思考感情", reversed: "过度孤立，缺乏沟通" },
    career: { upright: "独自工作，深入思考", reversed: "过度孤立，缺乏团队合作" },
    study: { upright: "独立学习，深入研究", reversed: "学习孤立，缺乏交流" },
    finance: { upright: "独立理财，谨慎决策", reversed: "财务孤立，缺乏建议" },
  },
  { id: 10, name: "Wheel of Fortune", nameTh: "เดอะ วีล ออฟ ฟอร์จูน", suit: "major", imageFile: "10_Wheel_of_Fortune.jpg", upright: "Good luck, karma, life cycles, destiny", uprightTh: "โชคดี กรรม วัฏจักรชีวิต โชคชะตา", reversed: "Bad luck, resistance to change, breaking cycles", reversedTh: "โชคร้าย ความต้านทานการเปลี่ยนแปลง การทำลายวัฏจักร",
    love: { upright: "缘分到来，关系转折", reversed: "感情波折，抗拒改变" },
    career: { upright: "事业转折，机会来临", reversed: "事业不顺，抗拒变化" },
    study: { upright: "学习运势好，有突破", reversed: "学习受阻，需要调整" },
    finance: { upright: "财务好转，运气来临", reversed: "财务波动，需要耐心" },
  },
  { id: 11, name: "Justice", nameTh: "จัสติส", suit: "major", imageFile: "11_Justice.jpg", upright: "Justice, fairness, truth, law", uprightTh: "ความยุติธรรม ความเป็นธรรม ความจริง กฎหมาย", reversed: "Unfairness, dishonesty, lack of accountability", reversedTh: "ความไม่ยุติธรรม ความไม่ซื่อสัตย์ ไม่รับผิดชอบ",
    love: { upright: "关系公平，相互尊重", reversed: "关系不公，缺乏诚信" },
    career: { upright: "工作公平，获得应得回报", reversed: "职场不公，缺乏责任" },
    study: { upright: "学习公平评估，成绩公正", reversed: "评估不公，学习受挫" },
    finance: { upright: "财务公平，合法收入", reversed: "财务不公，法律风险" },
  },
  { id: 12, name: "The Hanged Man", nameTh: "เดอะ แฮงด์ แมน", suit: "major", imageFile: "12_Hanged_Man.jpg", upright: "Pause, surrender, letting go, new perspectives", uprightTh: "การหยุดพัก การยอมแพ้ การปล่อยไป มุมมองใหม่", reversed: "Delays, resistance, stalling, indecision", reversedTh: "ความล่าช้า ความต้านทาน การชะลอ ความลังเล",
    love: { upright: "暂停感情，换位思考", reversed: "感情拖延，犹豫不决" },
    career: { upright: "工作暂停，重新评估", reversed: "工作拖延，缺乏行动" },
    study: { upright: "学习暂停，换个角度", reversed: "学习拖延，犹豫不决" },
    finance: { upright: "财务暂停，重新规划", reversed: "财务拖延，缺乏决策" },
  },
  { id: 13, name: "Death", nameTh: "เดธ", suit: "major", imageFile: "13_Death.jpg", upright: "Endings, change, transformation, transition", uprightTh: "จุดจบ การเปลี่ยนแปลง การเปลี่ยนแปลง การเปลี่ยนผ่าน", reversed: "Resistance to change, personal transformation delayed", reversedTh: "ความต้านทานการเปลี่ยนแปลง การเปลี่ยนแปลงส่วนตัวล่าช้า",
    love: { upright: "关系结束或重大转变", reversed: "抗拒改变，停滞不前" },
    career: { upright: "工作结束或转型", reversed: "抗拒职业变化" },
    study: { upright: "学习方式重大改变", reversed: "抗拒学习变化" },
    finance: { upright: "财务重大变化", reversed: "抗拒财务调整" },
  },
  { id: 14, name: "Temperance", nameTh: "เทมเพอแรนซ์", suit: "major", imageFile: "14_Temperance.jpg", upright: "Balance, moderation, patience, purpose", uprightTh: "ความสมดุล ความพอประมาณ ความอดทน จุดมุ่งหมาย", reversed: "Imbalance, excess, self-healing needed", reversedTh: "ความไม่สมดุล ความมากเกินไป ต้องรักษาตนเอง",
    love: { upright: "感情平衡，耐心经营", reversed: "感情失衡，需要调整" },
    career: { upright: "工作生活平衡", reversed: "工作过度，需要休息" },
    study: { upright: "学习节奏适当", reversed: "学习压力过大" },
    finance: { upright: "收支平衡，理性消费", reversed: "财务失衡，过度消费" },
  },
  { id: 15, name: "The Devil", nameTh: "เดอะ เดวิล", suit: "major", imageFile: "15_Devil.jpg", upright: "Shadow self, attachment, addiction, restriction", uprightTh: "เงามืด การยึดติด การติดยา การจำกัด", reversed: "Releasing limiting beliefs, exploring dark thoughts", reversedTh: "การปล่อยความเชื่อที่จำกัด การสำรวจความคิดมืด",
    love: { upright: "感情束缚，不健康依恋", reversed: "摆脱不健康关系" },
    career: { upright: "工作束缚，不健康环境", reversed: "摆脱工作束缚" },
    study: { upright: "学习上瘾，过度压力", reversed: "摆脱学习压力" },
    finance: { upright: "财务束缚，债务问题", reversed: "摆脱财务困境" },
  },
  { id: 16, name: "The Tower", nameTh: "เดอะ ทาวเวอร์", suit: "major", imageFile: "16_Tower.jpg", upright: "Sudden change, upheaval, chaos, revelation", uprightTh: "การเปลี่ยนแปลงกะทันหัน ความวุ่นวาย ความโกลาหล การเปิดเผย", reversed: "Personal transformation, fear of change, averting disaster", reversedTh: "การเปลี่ยนแปลงส่วนตัว ความกลัวการเปลี่ยนแปลง การหลีกเลี่ยงหายนะ",
    love: { upright: "感情突然变化，关系动荡", reversed: "避免感情灾难" },
    career: { upright: "工作突然变化，动荡不安", reversed: "避免职业危机" },
    study: { upright: "学习环境突变", reversed: "避免学习危机" },
    finance: { upright: "财务突然变化，损失", reversed: "避免财务灾难" },
  },
  { id: 17, name: "The Star", nameTh: "เดอะ สตาร์", suit: "major", imageFile: "17_Star.jpg", upright: "Hope, faith, purpose, renewal, spirituality", uprightTh: "ความหวัง ความศรัทธา จุดมุ่งหมาย การต่ออายุ จิตวิญญาณ", reversed: "Lack of faith, despair, self-trust issues", reversedTh: "ไม่มีความศรัทธา ความสิ้นหวัง ปัญหาความไว้วางใจตนเอง",
    love: { upright: "感情充满希望，新开始", reversed: "感情失望，缺乏信心" },
    career: { upright: "事业充满希望，新机会", reversed: "事业失望，缺乏方向" },
    study: { upright: "学习有目标，充满动力", reversed: "学习迷茫，缺乏信心" },
    finance: { upright: "财务前景乐观", reversed: "财务失望，缺乏信心" },
  },
  { id: 18, name: "The Moon", nameTh: "เดอะ มูน", suit: "major", imageFile: "18_Moon.jpg", upright: "Illusion, fear, anxiety, subconscious", uprightTh: "ภาพลวงตา ความกลัว ความวิตกกังวล จิตใต้สำนึก", reversed: "Release of fear, repressed emotion, inner confusion", reversedTh: "การปล่อยความกลัว อารมณ์ที่กดไว้ ความสับสนภายใน",
    love: { upright: "感情中有幻觉和不安", reversed: "释放恐惧，感情清晰" },
    career: { upright: "工作中有不确定感", reversed: "工作焦虑消除" },
    study: { upright: "学习中有焦虑和不安", reversed: "学习焦虑缓解" },
    finance: { upright: "财务中有不确定性", reversed: "财务焦虑消除" },
  },
  { id: 19, name: "The Sun", nameTh: "เดอะ ซัน", suit: "major", imageFile: "19_Sun.jpg", upright: "Positivity, fun, warmth, success, vitality", uprightTh: "ความคิดบวก ความสนุก ความอบอุ่น ความสำเร็จ ชีวิตชีวา", reversed: "Inner child issues, feeling down, overly optimistic", reversedTh: "ปัญหาเด็กภายใน รู้สึกแย่ มองโลกในแง่ดีเกินไป",
    love: { upright: "感情幸福，关系温暖", reversed: "感情过度乐观" },
    career: { upright: "事业成功，充满活力", reversed: "事业过度乐观" },
    study: { upright: "学习成功，充满动力", reversed: "学习过度自信" },
    finance: { upright: "财务成功，收入增长", reversed: "财务过度乐观" },
  },
  { id: 20, name: "Judgement", nameTh: "จัดจ์เม้นท์", suit: "major", imageFile: "20_Judgement.jpg", upright: "Judgement, rebirth, inner calling, absolution", uprightTh: "การพิพากษา การเกิดใหม่ การเรียกภายใน การอภัยโทษ", reversed: "Self-doubt, refusal of self-examination", reversedTh: "ความสงสัยในตนเอง การปฏิเสธการตรวจสอบตนเอง",
    love: { upright: "感情重新评估，新开始", reversed: "自我怀疑，拒绝反思" },
    career: { upright: "事业重新评估，新机会", reversed: "自我怀疑，拒绝改变" },
    study: { upright: "学习重新评估，新方向", reversed: "自我怀疑，拒绝反思" },
    finance: { upright: "财务重新评估，新机会", reversed: "自我怀疑，拒绝改变" },
  },
  { id: 21, name: "The World", nameTh: "เดอะ เวิลด์", suit: "major", imageFile: "21_World.jpg", upright: "Completion, integration, accomplishment, travel", uprightTh: "ความสมบูรณ์ การรวมตัว ความสำเร็จ การเดินทาง", reversed: "Seeking personal closure, shortcuts, delays", reversedTh: "การค้นหาความสมบูรณ์ส่วนตัว ทางลัด ความล่าช้า",
    love: { upright: "感情圆满，关系完整", reversed: "寻求感情结束" },
    career: { upright: "事业成功，目标达成", reversed: "寻求捷径，延迟" },
    study: { upright: "学习完成，目标达成", reversed: "寻求捷径，学习延迟" },
    finance: { upright: "财务目标达成", reversed: "寻求捷径，财务延迟" },
  },
];

const cups: TarotCard[] = [
  { id: 22, name: "Ace of Cups", nameTh: "เอซแห่งถ้วย", suit: "cups", imageFile: "Cups01.jpg", upright: "Love, new feelings, emotional awakening", uprightTh: "ความรัก ความรู้สึกใหม่ การตื่นทางอารมณ์", reversed: "Emotional loss, blocked creativity, emptiness", reversedTh: "การสูญเสียอารมณ์ ความคิดสร้างสรรค์ที่ถูกบล็อก ความว่างเปล่า",
    love: { upright: "新的感情机会，心动的感觉", reversed: "感情受阻，无法表达爱意" },
    career: { upright: "新的创意机会，工作有热情", reversed: "创意受阻，工作缺乏热情" },
    study: { upright: "学习有新动力，思维活跃", reversed: "学习动力不足" },
    finance: { upright: "新的财务机会", reversed: "财务机会受阻" },
  },
  { id: 23, name: "Two of Cups", nameTh: "สองแห่งถ้วย", suit: "cups", imageFile: "Cups02.jpg", upright: "Unified love, partnership, mutual attraction", uprightTh: "ความรักที่เป็นหนึ่ง ความเป็นคู่ แรงดึงดูดร่วมกัน", reversed: "Self-love needed, break-up, imbalance in relationship", reversedTh: "ต้องรักตนเอง ความแตกหัก ความไม่สมดุลในความสัมพันธ์",
    love: { upright: "双向奔赴，灵魂伴侣", reversed: "关系失衡，需要自爱" },
    career: { upright: "合作关系良好，互相尊重", reversed: "合作关系失衡" },
    study: { upright: "学习伙伴互补，共同进步", reversed: "学习关系失衡" },
    finance: { upright: "财务合作顺利", reversed: "财务关系失衡" },
  },
  { id: 24, name: "Three of Cups", nameTh: "สามแห่งถ้วย", suit: "cups", imageFile: "Cups03.jpg", upright: "Celebration, friendship, creativity, community", uprightTh: "การเฉลิมฉลอง มิตรภาพ ความคิดสร้างสรรค์ ชุมชน", reversed: "Independence, solitude, gossip", reversedTh: "ความเป็นอิสระ ความโดดเดี่ยว การนินทา",
    love: { upright: "社交场合遇到对象，朋友变恋人", reversed: "感情中第三者介入" },
    career: { upright: "团队合作愉快，庆祝成功", reversed: "职场八卦，缺乏团队支持" },
    study: { upright: "学习小组互助，氛围好", reversed: "学习孤立，缺乏支持" },
    finance: { upright: "多人合作获利", reversed: "财务纠纷" },
  },
  { id: 25, name: "Four of Cups", nameTh: "สี่แห่งถ้วย", suit: "cups", imageFile: "Cups04.jpg", upright: "Meditation, contemplation, apathy, reevaluation", uprightTh: "การทำสมาธิ การใคร่ครวญ ความเฉยเมย การประเมินใหม่", reversed: "Retreat, withdrawal, checking in with yourself", reversedTh: "การถอยกลับ การถอนตัว การตรวจสอบตนเอง",
    love: { upright: "对感情麻木，错过机会", reversed: "重新审视感情需求" },
    career: { upright: "工作倦怠，缺乏动力", reversed: "重新评估职业方向" },
    study: { upright: "学习倦怠，缺乏兴趣", reversed: "重新审视学习目标" },
    finance: { upright: "对财务麻木，错过机会", reversed: "重新评估财务状况" },
  },
  { id: 26, name: "Five of Cups", nameTh: "ห้าแห่งถ้วย", suit: "cups", imageFile: "Cups05.jpg", upright: "Regret, failure, disappointment, pessimism", uprightTh: "ความเสียใจ ความล้มเหลว ความผิดหวัง ความมองโลกในแง่ร้าย", reversed: "Personal setbacks overcome, self-forgiveness", reversedTh: "การเอาชนะอุปสรรคส่วนตัว การให้อภัยตนเอง",
    love: { upright: "感情失望，沉溺过去", reversed: "走出感情阴影" },
    career: { upright: "工作失误，后悔决定", reversed: "从失败中学习" },
    study: { upright: "学习失利，灰心丧气", reversed: "从挫折中恢复" },
    finance: { upright: "财务损失，后悔消费", reversed: "从财务损失中恢复" },
  },
  { id: 27, name: "Six of Cups", nameTh: "หกแห่งถ้วย", suit: "cups", imageFile: "Cups06.jpg", upright: "Revisiting the past, childhood memories, innocence", uprightTh: "การทบทวนอดีต ความทรงจำในวัยเด็ก ความบริสุทธิ์", reversed: "Living in the past, forgiveness needed, naivety", reversedTh: "การใช้ชีวิตในอดีต ต้องให้อภัย ความไร้เดียงสา",
    love: { upright: "旧情复燃，回忆美好", reversed: "沉溺过去，无法前进" },
    career: { upright: "重拾旧项目，怀旧", reversed: "固守过去，拒绝改变" },
    study: { upright: "重温旧知识，基础扎实", reversed: "学习方法过时" },
    finance: { upright: "旧账收回，过去投资回报", reversed: "财务依赖过去" },
  },
  { id: 28, name: "Seven of Cups", nameTh: "เจ็ดแห่งถ้วย", suit: "cups", imageFile: "Cups07.jpg", upright: "Fantasy, illusion, wishful thinking, choices", uprightTh: "จินตนาการ ภาพลวงตา การคิดหวัง ทางเลือก", reversed: "Personal alignment, action taken, confusion cleared", reversedTh: "การจัดตำแหน่งส่วนตัว การกระทำที่ทำแล้ว ความสับสนที่คลี่คลาย",
    love: { upright: "感情中有幻想，选择太多", reversed: "感情方向清晰" },
    career: { upright: "职业选择太多，犹豫不决", reversed: "职业方向明确" },
    study: { upright: "学习目标太多，分心", reversed: "学习方向明确" },
    finance: { upright: "财务幻想，不切实际", reversed: "财务决策清晰" },
  },
  { id: 29, name: "Eight of Cups", nameTh: "แปดแห่งถ้วย", suit: "cups", imageFile: "Cups08.jpg", upright: "Disappointment, abandonment, withdrawal, escapism", uprightTh: "ความผิดหวัง การถูกละทิ้ง การถอนตัว หนีความจริง", reversed: "Trying one more time, indecision, aimless drifting", reversedTh: "ลองอีกครั้ง ความลังเล การลอยไปลอยมา",
    love: { upright: "离开不健康的感情", reversed: "犹豫是否离开" },
    career: { upright: "离开不满意的工作", reversed: "犹豫是否跳槽" },
    study: { upright: "放弃不适合的学习方向", reversed: "犹豫是否转专业" },
    finance: { upright: "放弃不划算的投资", reversed: "犹豫是否止损" },
  },
  { id: 30, name: "Nine of Cups", nameTh: "เก้าแห่งถ้วย", suit: "cups", imageFile: "Cups09.jpg", upright: "Contentment, satisfaction, gratitude, wish come true", uprightTh: "ความพึงพอใจ ความพอใจ ความกตัญญู ความปรารถนาเป็นจริง", reversed: "Inner happiness, materialism, dissatisfaction", reversedTh: "ความสุขภายใน วัตถุนิยม ความไม่พอใจ",
    love: { upright: "感情满足，愿望成真", reversed: "内心不满足" },
    career: { upright: "工作满意，成就感", reversed: "工作不满足" },
    study: { upright: "学习有收获，满足感", reversed: "学习不满足" },
    finance: { upright: "财务满足，愿望达成", reversed: "财务不满足" },
  },
  { id: 31, name: "Ten of Cups", nameTh: "สิบแห่งถ้วย", suit: "cups", imageFile: "Cups10.jpg", upright: "Divine love, blissful relationships, harmony, alignment", uprightTh: "ความรักศักดิ์สิทธิ์ ความสัมพันธ์ที่มีความสุข ความกลมเกลียว การจัดตำแหน่ง", reversed: "Disconnection, misaligned values, broken family", reversedTh: "การขาดการเชื่อมต่อ ค่านิยมที่ไม่ตรงกัน ครอบครัวที่แตกสลาย",
    love: { upright: "幸福美满，灵魂契合", reversed: "关系破裂，价值观不合" },
    career: { upright: "工作环境和谐，团队融洽", reversed: "团队不合，缺乏归属" },
    study: { upright: "学习氛围好，同学融洽", reversed: "学习环境不佳" },
    finance: { upright: "家庭财务稳定", reversed: "家庭财务纠纷" },
  },
  { id: 32, name: "Page of Cups", nameTh: "เพจแห่งถ้วย", suit: "cups", imageFile: "Cups11.jpg", upright: "Creative opportunity, intuitive messages, curiosity", uprightTh: "โอกาสทางความคิดสร้างสรรค์ ข้อความจากสัญชาตญาณ ความอยากรู้", reversed: "Emotional immaturity, insecurity, creative block", reversedTh: "ความไม่เป็นผู้ใหญ่ทางอารมณ์ ความไม่มั่นคง การบล็อกความคิดสร้างสรรค์",
    love: { upright: "收到表白，感情萌芽", reversed: "感情幼稚，不成熟" },
    career: { upright: "创意灵感，新机会", reversed: "创意不足，不成熟" },
    study: { upright: "学习好奇心强", reversed: "学习不成熟" },
    finance: { upright: "小额财务机会", reversed: "财务不成熟" },
  },
  { id: 33, name: "Knight of Cups", nameTh: "อัศวินแห่งถ้วย", suit: "cups", imageFile: "Cups12.jpg", upright: "Creativity, romance, charm, imagination, beauty", uprightTh: "ความคิดสร้างสรรค์ โรแมนซิก ความมีเสน่ห์ จินตนาการ ความงาม", reversed: "Overactive imagination, unrealistic, jealousy", reversedTh: "จินตนาการที่ทำงานหนักเกินไป ไม่เป็นจริง ความหึงหวง",
    love: { upright: "浪漫追求，有魅力", reversed: "幻想太多，不切实际" },
    career: { upright: "创意工作，有魅力", reversed: "不切实际，嫉妒" },
    study: { upright: "学习有创意", reversed: "学习不切实际" },
    finance: { upright: "创意理财", reversed: "财务幻想" },
  },
  { id: 34, name: "Queen of Cups", nameTh: "ควีนแห่งถ้วย", suit: "cups", imageFile: "Cups13.jpg", upright: "Compassionate, caring, emotionally stable", uprightTh: "ความเมตตา การดูแล อารมณ์มั่นคง", reversed: "Inner feelings, self-care needed, co-dependency", reversedTh: "ความรู้สึกภายใน ต้องดูแลตนเอง การพึ่งพาอาศัย",
    love: { upright: "善解人意，情感稳定", reversed: "过度依赖，需要自爱" },
    career: { upright: "关怀下属，情绪稳定", reversed: "过度付出，需要自保" },
    study: { upright: "学习耐心，善解人意", reversed: "学习情绪化" },
    finance: { upright: "理财稳健，关怀他人", reversed: "财务依赖" },
  },
  { id: 35, name: "King of Cups", nameTh: "คิงแห่งถ้วย", suit: "cups", imageFile: "Cups14.jpg", upright: "Emotionally balanced, compassionate, diplomatic", uprightTh: "อารมณ์สมดุล ความเมตตา การทูต", reversed: "Self-compassion deficit, inner feelings, moodiness", reversedTh: "การขาดความเมตตาตนเอง ความรู้สึกภายใน ความอารมณ์ร้าย",
    love: { upright: "情感成熟，善解人意", reversed: "情绪不稳定，冷漠" },
    career: { upright: "领导有方，善于协调", reversed: "情绪化管理" },
    study: { upright: "学习心态成熟", reversed: "学习情绪化" },
    finance: { upright: "理财成熟，稳重", reversed: "财务情绪化" },
  },
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
