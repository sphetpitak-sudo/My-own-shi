"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Client-side Sentry init without the withSentryConfig webpack wrapper
// (which would need a SENTRY_AUTH_TOKEN at build time).
// Rendered once in app/layout.tsx. No-op when NEXT_PUBLIC_SENTRY_DSN
// is unset. This is the ONLY client init path — do not re-add
// sentry.client.config.ts alongside it (double init = duplicate events).
let inited = false;

export function SentryInit() {
  useEffect(() => {
    if (inited) return;
    inited = true;
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    try {
      Sentry.init({
        dsn,
        // Same-origin tunnel (app/api/sentry-tunnel): host-based ad-blockers
        // can't block envelopes addressed to our own domain.
        tunnel: "/api/sentry-tunnel",
        tracesSampleRate: 0.05,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        sendDefaultPii: false,
      });
    } catch {}
  }, []);
  return null;
}
