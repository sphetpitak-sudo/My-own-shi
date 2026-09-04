import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Server + edge runtime init. No-op when SENTRY_DSN is unset.
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Never send PII beyond what reportError() explicitly passes.
    sendDefaultPii: false,
  });
}
