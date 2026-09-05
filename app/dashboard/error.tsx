"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { reportError } from "@/lib/sentry";

// Segment boundary for ALL /dashboard/* pages (11 routes).
// Catches render crashes per-page without taking down the whole app shell.
// Retry is render-only (reset()) — it never re-spends points or re-posts:
// failed readings were already refunded server-side, and "ลองใหม่" there
// starts an explicit new attempt via the page's own flow.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      reportError(error, { digest: error.digest ?? null, segment: "dashboard" });
    } catch {}
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="card p-10 text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, var(--gold), transparent)" }} />
        </div>

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--amber-soft)" }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: "var(--gold)" }} />
        </div>

        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
          หน้านี้ขัดข้องชั่วคราว
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          แต้มของคุณปลอดภัย — ลองโหลดหน้านี้ใหม่อีกครั้ง
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn btn-primary">
            <RefreshCcw className="w-4 h-4 mr-2" /> ลองใหม่
          </button>
          <Link href="/dashboard" className="btn btn-ghost">
            <Home className="w-4 h-4 mr-2" /> หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
