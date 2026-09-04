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
    single: { temperature: 0.7, max_tokens: 1500, timeoutMs: 45_000, firstTokenMs: 18_000 },
    three_card: { temperature: 0.7, max_tokens: 2200, timeoutMs: 60_000, firstTokenMs: 20_000 },
    celtic: { temperature: 0.7, max_tokens: 4000, timeoutMs: 90_000, firstTokenMs: 25_000 },
  },
  followup: { temperature: 0.7, max_tokens: 800, timeoutMs: 30_000, firstTokenMs: 18_000 },
  oracle: {
    single: { temperature: 0.7, max_tokens: 1200, timeoutMs: 45_000, firstTokenMs: 18_000 },
    three: { temperature: 0.7, max_tokens: 1800, timeoutMs: 60_000, firstTokenMs: 20_000 },
  },
  daily: { temperature: 0.7, max_tokens: 800, timeoutMs: 25_000 },
  zodiac: { temperature: 0.7, max_tokens: 1000, timeoutMs: 30_000 },
  birthchart: { temperature: 0.7, max_tokens: 1200, timeoutMs: 30_000 },
  chat: { temperature: 0.7, max_tokens: 1000, timeoutMs: 30_000, firstTokenMs: 18_000 },
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
  // Neutralise our own fences if the user typed them (reading + chat)
  s = s.replace(/<\/?(user_question|cards|context|question|cards_block|user_message|tool_context|conversation_history)>/gi, (m) => m.replace(/</g, "‹").replace(/>/g, "›"));
  s = s.replace(/---(USER|CARDS|CONTEXT|CHAT)(_START|_END)---/g, (m) => m.replace(/-/g, "—"));
  // Collapse excessive newlines / control tricks
  s = s.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n");
  return s;
}

// Validate positionLabel charset: Thai/EN/numbers/space/punctuation only
// Rejects Zalgo / emoji / control that bloats tokens.
export function isValidPositionLabel(s: string): boolean {
  if (typeof s !== "string") return false;
  if (s.length === 0 || s.length > LIMITS.positionLabelMax) return false;
  // Allow Thai range ก-๛, basic Latin, digits, space, -_.(),/ and & (for "Hopes & Fears")
  return /^[\u0E00-\u0E7FA-Za-z0-9 \-_.(),\/&]+$/.test(s);
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
// Phase 1 — AI resilience: retry + centralized stream creation + breaker
// RULE: retry is ONLY allowed pre-stream (before the first SSE enqueue).
// Retrying after streaming started risks double-spend / duplicate rows.
// ============================================

export const RETRY_DEFAULTS = {
  maxAttempts: 2, // 1 initial + 1 retry
  baseDelayMs: 1000, // linear backoff: 1s before attempt 2
} as const;

/** True for transient pre-stream failures worth one retry. */
export function isRetryableAiError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.message === "AI_CREATE_TIMEOUT") return true;
  if (err.name === "AbortError") return true;
  const status = (err as { status?: unknown }).status;
  if (status === 502 || status === 503 || status === 429) return true;
  const code = (err as { code?: unknown }).code;
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") return true;
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run an async AI-create callback with one safe retry.
 * The callback MUST be pre-stream (no side effects visible to the user).
 */
export async function withAiRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    shouldRetry?: (err: unknown, attempt: number) => boolean;
    onRetry?: (err: unknown, attempt: number) => void;
  }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? RETRY_DEFAULTS.maxAttempts;
  const baseDelayMs = opts?.baseDelayMs ?? RETRY_DEFAULTS.baseDelayMs;
  const shouldRetry = opts?.shouldRetry ?? isRetryableAiError;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt >= Math.max(1, maxAttempts) || !shouldRetry(err, attempt)) throw err;
      try {
        opts?.onRetry?.(err, attempt);
      } catch {}
      await sleep(baseDelayMs * attempt);
    }
  }
  throw lastErr;
}

export interface AiStreamHandle<T> {
  stream: T;
  /** Abort the AI call and clear all timers/listeners. */
  abort: () => void;
  /** Remove client-abort listener + clear create-timeout (call on every exit). */
  detach: () => void;
}

/**
 * Centralized pre-stream setup (replaces per-route copy-paste):
 * client-disconnect forwarding + create-timeout abort + safe retry.
 * First-token watchdog stays with stream consumption (see armFirstTokenGuard).
 */
export async function createAiStream<T>(opts: {
  create: (signal: AbortSignal) => Promise<T>;
  requestSignal?: AbortSignal | null;
  timeoutMs: number;
  onRetry?: (err: unknown, attempt: number) => void;
}): Promise<AiStreamHandle<T>> {
  const abortController = new AbortController();
  const onClientAbort = () => {
    try {
      abortController.abort();
    } catch {}
  };
  if (opts.requestSignal) {
    if (opts.requestSignal.aborted) abortController.abort();
    else opts.requestSignal.addEventListener("abort", onClientAbort, { once: true });
  }
  const timeoutId = setTimeout(() => {
    try {
      abortController.abort();
    } catch {}
  }, opts.timeoutMs);

  const detach = () => {
    clearTimeout(timeoutId);
    try {
      opts.requestSignal?.removeEventListener("abort", onClientAbort);
    } catch {}
  };
  const abort = () => {
    detach();
    try {
      abortController.abort();
    } catch {}
  };

  try {
    const stream = await withAiRetry(
      async () => {
        // Safety net: if the SDK ignores AbortSignal, force a timeout rejection.
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_CREATE_TIMEOUT")), opts.timeoutMs + 3000)
        );
        return (await Promise.race([
          opts.create(abortController.signal),
          timeoutPromise,
        ])) as T;
      },
      { onRetry: opts.onRetry }
    );
    return { stream, abort, detach };
  } catch (err) {
    detach();
    throw err;
  }
}

/** First-token watchdog for stream consumption; call clearFirstTokenGuard on first chunk. */
export function armFirstTokenGuard(onTimeout: () => void, ms: number): () => void {
  let fired = false;
  const id = setTimeout(() => {
    fired = true;
    try {
      onTimeout();
    } catch {}
  }, ms);
  return () => {
    if (!fired) clearTimeout(id);
  };
}

// ============================================
// Phase 1.3 — Circuit breaker (shared store via RPC, NOT in-memory)
// In-memory counters reset on cold start / split across instances, so the
// breaker state lives in Postgres (ai_circuit_events + check_ai_breaker).
// Fail-open: if the RPC is missing/fails, the breaker reads CLOSED so a
// telemetry outage never blocks readings.
// ============================================

export const BREAKER_DEFAULTS = {
  failThreshold: 10, // trip after N failures...
  windowSeconds: 60, // ...within this window...
  cooldownSeconds: 30, // ...stay open this long after the last failure (tune from Phase 0 dashboard)
} as const;

export interface BreakerStore {
  // PromiseLike (not Promise): Supabase rpc() returns a thenable builder.
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>;
}

export async function isBreakerOpen(
  store: BreakerStore,
  endpoint: string,
  overrides?: Partial<typeof BREAKER_DEFAULTS>
): Promise<boolean> {
  try {
    const { data, error } = await store.rpc("check_ai_breaker", {
      p_endpoint: endpoint,
      p_fail_threshold: overrides?.failThreshold ?? BREAKER_DEFAULTS.failThreshold,
      p_window_seconds: overrides?.windowSeconds ?? BREAKER_DEFAULTS.windowSeconds,
      p_cooldown_seconds: overrides?.cooldownSeconds ?? BREAKER_DEFAULTS.cooldownSeconds,
    });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

/** Best-effort failure recording. Never throws. */
export async function recordBreakerFailure(
  store: BreakerStore,
  endpoint: string
): Promise<void> {
  try {
    await store.rpc("record_ai_failure", { p_endpoint: endpoint });
  } catch {}
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
