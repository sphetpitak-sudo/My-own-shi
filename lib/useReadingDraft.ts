"use client";

import { useState, useEffect, useCallback } from "react";
import type { DrawnCard, SpreadType } from "@/lib/cards";

export interface ReadingDraft {
  spreadType: SpreadType;
  question: string;
  drawnCards: DrawnCard[] | null;
  step: "spread" | "question" | "draw" | "result";
  updatedAt: number;
}

const KEY = "sealo_reading_draft";

export function saveDraft(draft: Omit<ReadingDraft, "updatedAt">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch {}
}

export function loadDraft(): ReadingDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadingDraft;
    // expire after 24h
    if (Date.now() - parsed.updatedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function useReadingDraft() {
  const [draft, setDraft] = useState<ReadingDraft | null>(null);
  useEffect(() => {
    setDraft(loadDraft());
  }, []);
  const refresh = useCallback(() => setDraft(loadDraft()), []);
  return { draft, refresh, clear: clearDraft };
}
