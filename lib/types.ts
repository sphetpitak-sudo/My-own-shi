export interface TarotCard {
  id: number;
  name: string;
  nameTh: string;
  arcana: "major" | "minor";
  suit: "wands" | "cups" | "swords" | "pents" | null;
  number: number;
  imageFile: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
}

export interface DrawnCard {
  card: TarotCard;
  position: string;
  reversed: boolean;
}

export interface Reading {
  id: string;
  user_id: string;
  spread_type: "single" | "three_card" | "celtic";
  cards: DrawnCard[];
  question: string;
  interpretation: string;
  points_spent: number;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  points: number;
  is_admin: boolean;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "admin_grant" | "reading_purchase" | "daily_bonus" | "referral";
  description: string;
  admin_id: string | null;
  created_at: string;
}

export type SpreadType = "single" | "three_card" | "celtic";
