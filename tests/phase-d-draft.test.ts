// @vitest-environment jsdom
// ============================================
// Phase D2 — draft topic persistence (lib-level, localStorage)
// - save stores an explicitly chosen topic
// - restore returns it; legacy drafts (no topic) stay topic-less
// - invalid topic values are dropped, rest of draft survives
// ============================================

import { describe, it, expect, beforeEach } from "vitest";
import {
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/useReadingDraft";
import { normalizeDraftTopic } from "@/lib/reading-flow";

beforeEach(() => {
  localStorage.clear();
});

describe("draft topic persistence", () => {
  it("saves and restores an explicitly chosen topic", () => {
    saveDraft({ spreadType: "three_card", question: "q?", drawnCards: null, step: "question", topic: "love" });
    expect(loadDraft()).toMatchObject({ topic: "love", question: "q?" });
  });

  it("legacy drafts without topic restore gracefully as topic-less", () => {
    localStorage.setItem(
      "sealo_reading_draft",
      JSON.stringify({ spreadType: "single", question: "q?", drawnCards: null, step: "topic", updatedAt: Date.now() })
    );
    const d = loadDraft();
    expect(d).not.toBeNull();
    expect(d?.topic).toBeUndefined();
    expect(d?.spreadType).toBe("single");
  });

  it("invalid topic values are dropped but the draft survives", () => {
    localStorage.setItem(
      "sealo_reading_draft",
      JSON.stringify({ spreadType: "single", question: "q?", drawnCards: null, step: "topic", topic: "mars", updatedAt: Date.now() })
    );
    const d = loadDraft();
    expect(d?.topic).toBeUndefined();
    expect(d?.question).toBe("q?");
  });

  it("clearDraft removes everything including topic", () => {
    saveDraft({ spreadType: "single", question: "q?", drawnCards: null, step: "topic", topic: "career" });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});

describe("normalizeDraftTopic", () => {
  it.each([["love", "love"], ["general", "general"], ["mars", undefined], [null, undefined], [42, undefined]])(
    "%s -> %s",
    (raw, expected) => {
      expect(normalizeDraftTopic(raw)).toBe(expected);
    }
  );
});
