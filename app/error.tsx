"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="card p-8 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--amber)]" />
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          เกิดข้อผิดพลาด
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {error.message || "Something went wrong"}
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <button onClick={reset} className="btn btn-primary">
          <RefreshCcw className="w-4 h-4 mr-2" /> ลองใหม่
        </button>
      </div>
    </div>
  );
}
