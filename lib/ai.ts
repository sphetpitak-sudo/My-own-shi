import OpenAI from "openai";

// ============================================
// Centralised OpenAI / OpenTyphoon client (singleton, connection reuse)
// ============================================
let _client: OpenAI | null = null;

export const AI_MODEL = "typhoon-v2.5-30b-a3b-instruct" as const;
export const AI_BASE_URL = "https://api.opentyphoon.ai/v1" as const;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPEN_TYPHOON_API_KEY;
  if (!apiKey) throw new Error("OPEN_TYPHOON_API_KEY is not set");
  _client = new OpenAI({ apiKey, baseURL: AI_BASE_URL });
  return _client;
}

// ============================================
// Central model configuration — single source of truth
// ============================================
export const AI_PARAMS = {
  reading: {
    single: { temperature: 0.7, max_tokens: 600, timeoutMs: 32_000, firstTokenMs: 18_000 },
    three_card: { temperature: 0.7, max_tokens: 800, timeoutMs: 38_000, firstTokenMs: 18_000 },
    celtic: { temperature: 0.7, max_tokens: 1100, timeoutMs: 50_000, firstTokenMs: 22_000 },
  },
  followup: { temperature: 0.7, max_tokens: 400, timeoutMs: 25_000, firstTokenMs: 15_000 },
  oracle: {
    single: { temperature: 0.7, max_tokens: 500, timeoutMs: 35_000, firstTokenMs: 18_000 },
    three: { temperature: 0.7, max_tokens: 900, timeoutMs: 45_000, firstTokenMs: 18_000 },
  },
  daily: { temperature: 0.7, max_tokens: 400, timeoutMs: 18_000 },
  zodiac: { temperature: 0.7, max_tokens: 500, timeoutMs: 22_000 },
} as const;

// ============================================
// Content limits (server-enforced, before token spend)
// ============================================
export const LIMITS = {
  questionMax: 500,
  followQuestionMax: 200,
  positionLabelMax: 50,
  interpretationMax: 9500, // DB check is 10000; keep headroom for insert
  promptInjectionExtra: 1500, // max overall user payload size guard
} as const;

// Escape user-controlled text so it cannot become an instruction.
// Replaces our fence markers and normalises XML-like brackets.
export function sanitizeForPrompt(input: string, maxLen: number): string {
  let s = (input || "").trim().slice(0, maxLen);
  // Neutralise our own fences if the user typed them
  s = s.replace(/<\/?(user_question|cards|context|question|cards_block)>/gi, (m) => m.replace(/</g, "‹").replace(/>/g, "›"));
  s = s.replace(/---(USER|CARDS|CONTEXT)(_START|_END)---/g, (m) => m.replace(/-/g, "—"));
  // Collapse excessive newlines / control tricks
  s = s.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n");
  return s;
}

// Validate positionLabel charset: Thai/EN/numbers/space/punctuation only
// Rejects Zalgo / emoji / control that bloats tokens.
export function isValidPositionLabel(s: string): boolean {
  if (typeof s !== "string") return false;
  if (s.length === 0 || s.length > LIMITS.positionLabelMax) return false;
  // Allow Thai range ก-๛, basic Latin, digits, space, -_.(),/
  return /^[\u0E00-\u0E7FA-Za-z0-9 \-_.(),\/]+$/.test(s);
}

// Extract a JSON object from an AI response (handles markdown fences / stray text)
export function extractJSON(text: string): Record<string, unknown> | null {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
  try {
    const parsed = JSON.parse(t);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
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
  const finalName = /^#[0-9a-fA-F]{6}$/.test(n) ? "ทอง" : n || "ทอง";
  return { hex, name: finalName };
}

// ============================================
// In-memory rate limiting (per process) — fallback only; primary is DB RPC
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
// In-memory daily cache (per process) — best-effort, not authoritative
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
