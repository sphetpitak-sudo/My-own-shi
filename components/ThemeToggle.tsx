"use client";

import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
      {theme === "light" ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
    </button>
  );
}
