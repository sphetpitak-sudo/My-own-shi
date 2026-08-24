"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle} className="px-2.5 py-1.5 rounded-lg font-pixel text-xs font-semibold transition-all"
      style={{ background: "var(--accent-soft)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
      {lang === "th" ? "TH" : "EN"}
    </button>
  );
}
