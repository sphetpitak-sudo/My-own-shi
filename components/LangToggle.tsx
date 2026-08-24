"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
      style={{ background: "rgba(107, 142, 35, 0.08)", border: "1px solid rgba(107, 142, 35, 0.2)" }}>
      <span className="text-base">🌐</span>
      <span className="font-pixel text-xs font-bold" style={{ color: "#4a7c23" }}>{lang === "th" ? "TH" : "EN"}</span>
    </button>
  );
}
