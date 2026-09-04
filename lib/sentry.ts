// ============================================
// Sealo Sentry reporter — Phase 0.2 (real SDK)
// Uses @sentry/nextjs (installed). Events are dropped automatically when
// SENTRY_DSN is unset, so this is safe in dev without secrets.
//
// Pending operator step: set SENTRY_DSN (server) + NEXT_PUBLIC_SENTRY_DSN
// (client, optional) in .env.local / Vercel env, then configure alerts:
//   - 502 AI fail spike (ai_error outcome) — notify immediately
//   - 503 DB busy spike (timeout/db_error) — notify immediately
//   - refund rate > 5% of readings in 1h — page on-call
// Privacy: only pass whitelisted context (requestId/endpoint/ids/costs).
// Never pass question/message/birthdate/place.
// ============================================

import * as Sentry from "@sentry/nextjs";

/** Report a server-side error with obs correlation. Never throws. */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(err, { extra: context });
  } catch {}
  try {
    console.error("[sentry]", JSON.stringify(context ?? {}), err);
  } catch {}
}
