import { NextResponse } from "next/server";
import { dsnToEnvelopeUrl } from "@/lib/sentry";
import { startObs, endObs, obsHeaders } from "@/lib/observability";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Sentry tunnel: client envelopes POST here (same origin, so host-based
// ad-blockers can't kill them) and we forward to the ingest endpoint.
// - No auth by design (the browser SDK has no secret to send).
// - Payload cap 100KB guards abuse; body is NEVER logged (may hold PII).
// - Only request counts/outcomes are observed, never envelope content.
const MAX_BYTES = 100_000;

export async function POST(request: Request) {
  const obs = startObs("sentry-tunnel", request);
  try {
    const envelopeUrl = dsnToEnvelopeUrl(process.env.SENTRY_DSN);
    if (!envelopeUrl) {
      endObs(obs, "db_error", { status: 503, reason: "tunnel_unconfigured" });
      return NextResponse.json({ error: "Tunnel not configured" }, { status: 503, headers: obsHeaders(obs) });
    }

    const rawLen = request.headers.get("content-length");
    if (rawLen && parseInt(rawLen, 10) > MAX_BYTES) {
      endObs(obs, "validation_error", { status: 413, reason: "payload_too_large" });
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: obsHeaders(obs) });
    }

    const body = await request.arrayBuffer().catch(() => null);
    if (!body || body.byteLength === 0 || body.byteLength > MAX_BYTES) {
      endObs(obs, "validation_error", { status: 400, reason: "invalid_body" });
      return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: obsHeaders(obs) });
    }

    const upstream = await fetch(envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("Content-Type") || "application/x-sentry-envelope" },
      body,
    }).catch(() => null);
    if (!upstream) {
      endObs(obs, "ai_error", { status: 502, reason: "upstream_unreachable" });
      return NextResponse.json({ error: "Upstream unreachable" }, { status: 502, headers: obsHeaders(obs) });
    }

    endObs(obs, "ok", { status: upstream.status });
    return new NextResponse(null, { status: upstream.status, headers: obsHeaders(obs) });
  } catch {
    endObs(obs, "db_error", { status: 500, reason: "unhandled" });
    return NextResponse.json({ error: "Failed" }, { status: 500, headers: obsHeaders(obs) });
  }
}
