"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 font-pixel text-sm font-semibold uppercase tracking-wider border-2 border-pixel-300 dark:border-pixel-700 hover:bg-pixel-100 dark:hover:bg-pixel-900 transition-colors"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
