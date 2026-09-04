// ============================================
// Phase 3 — Single rate-limit policy for all API routes.
//   * Limit BEFORE spend, always (no spend-then-refund on 429).
//   * Fail-CLOSED on DB errors (503), never fail-open.
//   * Limits live here (single source); the DB RPC only enforces.
// Replaces: per-route rpc calls, fail-open catches, and the removed
// in-memory limiter in lib/ai.ts (wrong on serverless: counters reset
// on cold start and split across instances).
// ============================================

export const RATE_LIMIT_POLICIES = {
  reading: { limit: 5, windowSeconds: 60 },
  followup: { limit: 5, windowSeconds: 60 },
  oracle: { limit: 5, windowSeconds: 60 },
  chat: { limit: 20, windowSeconds: 60 },
  daily: { limit: 10, windowSeconds: 3600 },
  zodiac: { limit: 10, windowSeconds: 3600 },
  birthchart: { limit: 10, windowSeconds: 3600 },
  saju: { limit: 10, windowSeconds: 3600 },
} as const;

export type RateLimitEndpoint = keyof typeof RATE_LIMIT_POLICIES;

export interface RateLimitStore {
  // PromiseLike: Supabase rpc() returns a thenable builder, not a Promise.
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>;
}

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; reason: "exceeded" | "db_unavailable" };

const DB_TIMEOUT_MS = 5000;

function dbTimeout(): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("RATE_LIMIT_DB_TIMEOUT")), DB_TIMEOUT_MS)
  );
}

export async function checkRateLimitPolicy(
  store: RateLimitStore,
  endpoint: RateLimitEndpoint
): Promise<RateLimitVerdict> {
  const policy = RATE_LIMIT_POLICIES[endpoint];
  try {
    const res = (await Promise.race([
      store.rpc("check_rate_limit", {
        p_endpoint: endpoint,
        p_limit: policy.limit,
        p_window_seconds: policy.windowSeconds,
      }),
      dbTimeout(),
    ])) as unknown as { data: unknown };
    if (res?.data === false) return { allowed: false, reason: "exceeded" };
    return { allowed: true };
  } catch {
    // Fail-closed: a telemetry outage must not become a free-pass.
    return { allowed: false, reason: "db_unavailable" };
  }
}
