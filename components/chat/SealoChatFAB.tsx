"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export default function SealoChatFAB() {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/dashboard/chat");

  // Hide entirely on chat page (or transform to subtle minimize)
  if (isChat) return null;

  return (
    <Link
      href="/dashboard/chat"
      aria-label="Sealo Chat"
      className={cn(
        "fixed z-30 grid place-items-center rounded-full",
        "w-12 h-12 sm:w-[52px] sm:h-[52px]",
        "right-3 sm:right-4",
        "shadow-[0_8px_24px_rgba(124,58,237,0.28),0_2px_8px_rgba(0,0,0,0.12)]",
        "border border-white/20",
        "transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]",
        "backdrop-blur-md",
        "lg:hidden"
      )}
      style={{
        bottom: "calc(64px + 12px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 55%, #6d28d9 100%)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset, 0 8px 24px rgba(124,58,237,0.32), 0 2px 8px rgba(0,0,0,0.12), 0 0 18px rgba(167,139,250,0.35)",
      }}
    >
      <span className="absolute inset-0 rounded-full opacity-20" style={{ background: "radial-gradient(40% 40% at 30% 30%, white, transparent)" }} aria-hidden />
      <MessageCircle size={20} className="text-white relative" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }} />
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm" aria-hidden />
    </Link>
  );
}
