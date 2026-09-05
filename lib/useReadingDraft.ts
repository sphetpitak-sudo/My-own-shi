"use client";

import { useState, useEffect, useCallback } from "react";
import type { DrawnCard, SpreadType } from "@/lib/cards";
import { normalizeDraftTopic, type DraftTopic } from "@/lib/reading-flow";

export interface ReadingDraft {
  spreadType: SpreadType;
  question: string;
  drawnCards: DrawnCard[] | null;
  step: "spread" | "topic" | "question" | "draw" | "result";
  /** Absent in drafts written before Phase D — treated as "not chosen". */
  topic?: DraftTopic;
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
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      localStorage.removeItem(KEY);
      return null;
    }

    // Validate fields
    const validSpreads = ["single", "three_card", "celtic"];
    const validSteps = ["spread", "topic", "question", "draw", "result"];

    if (!validSpreads.includes(parsed.spreadType)) {
      localStorage.removeItem(KEY);
      return null;
    }

    if (!validSteps.includes(parsed.step)) {
      localStorage.removeItem(KEY);
      return null;
    }

    if (typeof parsed.updatedAt !== "number" || isNaN(parsed.updatedAt)) {
      localStorage.removeItem(KEY);
      return null;
    }

    // expire after 24h
    if (Date.now() - parsed.updatedAt > 24 * 60 * 60 * 1000 || parsed.updatedAt > Date.now() + 60_000) {
      localStorage.removeItem(KEY);
      return null;
    }

    const topic = normalizeDraftTopic(parsed.topic);
    return {
      spreadType: parsed.spreadType as SpreadType,
      question: typeof parsed.question === "string" ? parsed.question : "",
      drawnCards: Array.isArray(parsed.drawnCards) ? (parsed.drawnCards as DrawnCard[]) : null,
      step: parsed.step as ReadingDraft["step"],
      ...(topic ? { topic } : {}),
      updatedAt: parsed.updatedAt,
    };
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
