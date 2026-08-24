"use client";

import { useLang } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
      <Globe className="w-4 h-4 text-blue-500" />
      <span className="font-pixel text-xs font-semibold text-slate-600 dark:text-slate-300">{lang === "th" ? "TH" : "EN"}</span>
    </button>
  );
}
