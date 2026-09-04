import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// Cron auth (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
// Fail-closed: missing CRON_SECRET env or mismatch refuses the call, so a
// refund-capable endpoint is never open by misconfiguration.
export function checkCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  let ok = false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    ok = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
