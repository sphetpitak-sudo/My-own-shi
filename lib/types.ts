import type { DrawnCard, SpreadType } from "@/lib/cards";

export type { DrawnCard, SpreadType };

export interface Reading {
  id: string;
  user_id: string;
  spread_type: SpreadType;
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
  type: "admin_grant" | "reading_purchase" | "daily_bonus" | "referral" | "refund";
  description: string;
  admin_id: string | null;
  created_at: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  points: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}
