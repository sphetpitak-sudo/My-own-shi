"use client";

import { ReactNode } from "react";
import { Sparkles, Search, AlertTriangle, RefreshCw } from "lucide-react";

interface BaseProps {
  className?: string;
}

// Standard: 11.5 / 13 / 14.5 / 18 / 24 — keep hierarchy strict
export function LoadingState({ label = "กำลังโหลด...", compact = false, className }: { label?: string; compact?: boolean } & BaseProps) {
  if (compact) {
    return (
      <div className={`flex items-center justify-center gap-3 py-6 ${className ?? ""}`} role="status" aria-live="polite" aria-busy="true">
        <span className="w-4 h-4 border-2 border-[var(--border-strong)] border-t-[var(--primary)] rounded-full animate-spin" aria-hidden />
        <span className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-10 text-center ${className ?? ""}`} role="status" aria-live="polite" aria-busy="true">
      <div className="mystical-loader" aria-hidden>
        <div className="mystical-loader-dot" />
        <div className="mystical-loader-dot" />
        <div className="mystical-loader-dot" />
      </div>
      <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className }: { lines?: number } & BaseProps) {
  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="shimmer" style={{ height: i === 0 ? 18 : 14, width: `${92 - i * 8}%`, borderRadius: 8 }} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Search,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: typeof Sparkles;
  title: string;
  subtitle?: string;
  action?: ReactNode;
} & BaseProps) {
  return (
    <div className={`empty ${className ?? ""}`} role="status">
      <div className="empty-icon" aria-hidden>
        <Icon size={22} />
      </div>
      <h3 className="empty-title">{title}</h3>
      {subtitle && <p className="empty-sub">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
} & BaseProps) {
  return (
    <div className={`flex flex-col items-center text-center gap-3 py-8 ${className ?? ""}`} role="alert" aria-live="assertive">
      <span className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--red-soft)", color: "var(--red)" }} aria-hidden>
        <AlertTriangle size={18} />
      </span>
      <h3 className="text-[14.5px] font-bold" style={{ color: "var(--text)" }}>{title}</h3>
      <p className="text-[13px] leading-relaxed max-w-[360px]" style={{ color: "var(--text-secondary)" }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost mt-1 text-[13px]" aria-label="ลองใหม่">
          <RefreshCw size={14} /> ลองใหม่
        </button>
      )}
    </div>
  );
}
