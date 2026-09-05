import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface InsufficientPointsProps {
  needed: number;
  current: number;
  /** banner = red-soft box with free-points link; inline = red text only. */
  variant?: "banner" | "inline";
  /** Banner only: also show the top-up (profile) link. Default false. */
  showTopUp?: boolean;
  className?: string;
}

/**
 * Single shared "not enough points" pattern (Phase B consolidation).
 * Wording is canonical Thai using แต้ม everywhere:
 *   banner/inline: "ขาดอีก X แต้ม"
 * The matching setError-string form used with generic ErrorState is:
 *   "แต้มไม่พอ (ต้องการ N แต้ม มี M แต้ม)"
 * Points economics are untouched — this only unifies copy + visuals.
 */
export default function InsufficientPoints({
  needed,
  current,
  variant = "banner",
  showTopUp = false,
  className = "",
}: InsufficientPointsProps) {
  const shortage = Math.max(0, needed - current);

  if (variant === "inline") {
    return (
      <span className={className} style={{ color: "var(--red)" }}>
        ขาดอีก {shortage.toLocaleString()} แต้ม
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 font-semibold rounded-lg px-3 py-2 ${className}`}
      style={{
        fontSize: "var(--text-xs)",
        color: "var(--red)",
        background: "var(--red-soft)",
        border: "1px solid rgba(194,65,48,0.12)",
      }}
      role="status"
    >
      <AlertTriangle size={12} aria-hidden />
      ขาดอีก {shortage.toLocaleString()} แต้ม
      <Link
        href="/dashboard/daily"
        className="ml-auto text-[11px] font-bold underline hover:no-underline"
      >
        รับแต้มฟรี
      </Link>
      {showTopUp && (
        <Link href="/dashboard/profile" className="text-[11px] font-bold underline hover:no-underline">
          เติมแต้ม
        </Link>
      )}
    </div>
  );
}
