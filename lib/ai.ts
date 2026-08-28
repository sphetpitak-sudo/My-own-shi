import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.opentyphoon.ai/v1",
  });
}

// Extract a JSON object from an AI response (handles markdown fences / stray text)
export function extractJSON(text: string): Record<string, unknown> | null {
  let t = (text || "").trim();
  // strip ```json ... ``` fences
  t = t.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
  try {
    const parsed = JSON.parse(t);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  // find first {...}
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(t.slice(start, end + 1));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
  }
  return null;
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && isFinite(v)) return Math.round(v);
  if (typeof v === "string") {
    const n = parseInt(v.replace(/[^\d]/g, ""), 10);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

// Thai lucky-color name -> hex
const COLOR_MAP: Record<string, string> = {
  ทอง: "#d4af37",
  ม่วง: "#a78bfa",
  ชมพู: "#f472b6",
  "เขียวมรกต": "#14b8a6",
  คราม: "#818cf8",
  อำพัน: "#fbbf24",
};

export function colorToHex(name: string, fallbackHex = "#d4af37"): { hex: string; name: string } {
  const n = (name || "").trim();
  const hex = COLOR_MAP[n] || fallbackHex;
  // If unknown, return the raw name if it looks like a hex color
  const finalName = /^#[0-9a-fA-F]{6}$/.test(n) ? "ทอง" : n || "ทอง";
  return { hex, name: finalName };
}

// ============================================
// In-memory rate limiting (per process)
// ============================================
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  if (rateBuckets.size > 2000) rateBuckets.clear();
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    rateBuckets.set(key, arr);
    return false;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  return true;
}

// ============================================
// In-memory daily cache (per process)
// Keeps daily readings stable within a day & reduces AI cost
// ============================================
const fortuneCache = new Map<string, { at: number; value: unknown }>();

export function getCachedFortune(key: string, ttlMs: number): unknown | null {
  const hit = fortuneCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    fortuneCache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCachedFortune(key: string, value: unknown): void {
  if (fortuneCache.size > 2000) fortuneCache.clear();
  fortuneCache.set(key, { at: Date.now(), value });
}
