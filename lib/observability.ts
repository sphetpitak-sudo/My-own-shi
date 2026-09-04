// ============================================
// Sealo Observability — Phase 0
// Single source for request-id + structured logs.
// Edge-safe (no node-only APIs). Logs are JSON lines prefixed with [obs]
// so Vercel log drains / Sentry breadcrumbs can parse them.
// ============================================

export type ObsOutcome =
  | "ok"
  | "validation_error"
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "ai_error"
  | "breaker_open"
  | "db_error"
  | "aborted"
  | "refunded"
  | "fallback";

export interface ObsContext {
  requestId: string;
  endpoint: string;
  startTime: number;
  userId?: string;
  spread?: string;
  topic?: string;
  extra?: Record<string, unknown>;
}

export function newRequestId(): string {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getRequestId(request: Request): string {
  const h = request.headers.get("x-request-id");
  if (h && h.length >= 8 && h.length <= 64) return h;
  return newRequestId();
}

export function startObs(
  endpoint: string,
  request: Request,
  extra?: Record<string, unknown>
): ObsContext {
  const ctx: ObsContext = {
    requestId: getRequestId(request),
    endpoint,
    startTime: Date.now(),
    extra,
  };
  logObs(ctx, "start", extra);
  return ctx;
}

export function setObsUser(ctx: ObsContext, userId: string): void {
  ctx.userId = userId;
}

function baseFields(ctx: ObsContext) {
  return {
    requestId: ctx.requestId,
    endpoint: ctx.endpoint,
    userId: ctx.userId ?? null,
    spread: ctx.spread ?? null,
    topic: ctx.topic ?? null,
  };
}

export function logObs(
  ctx: ObsContext,
  event: string,
  fields?: Record<string, unknown>
): void {
  const latencyMs = Date.now() - ctx.startTime;
  try {
    console.log(
      `[obs] ${JSON.stringify({
        ...baseFields(ctx),
        event,
        latencyMs,
        ...(fields ?? {}),
      })}`
    );
  } catch {}
}

export function endObs(
  ctx: ObsContext,
  outcome: ObsOutcome,
  fields?: Record<string, unknown> & { status?: number }
): void {
  logObs(ctx, "end", { outcome, ...(fields ?? {}) });
}

/** Attach x-request-id to a JSON response so client can correlate. */
export function obsHeaders(ctx: ObsContext): Record<string, string> {
  return { "x-request-id": ctx.requestId };
}

/**
 * Privacy: topic is user-controlled free text — only allow the known enum
 * into log lines. Anything else is collapsed to "general" so raw user
 * input never flows into log drains / Sentry (which may have looser
 * retention/access policy than the DB).
 */
const VALID_TOPICS = new Set(["love", "career", "study", "finance", "health", "general"]);

export function normalizeTopic(raw: unknown): string {
  return typeof raw === "string" && VALID_TOPICS.has(raw) ? raw : "general";
}

/** Prompt version is logged on every AI call for observability (no prompt content). */
export function logPromptVersion(
  ctx: ObsContext,
  promptVersion: string,
  extra?: Record<string, unknown>
): void {
  logObs(ctx, "prompt", { promptVersion, ...(extra ?? {}) });
}
