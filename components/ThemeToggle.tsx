"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
      style={{ background: "rgba(139, 105, 20, 0.08)", border: "1px solid rgba(139, 105, 20, 0.2)" }}>
      <span className="text-base">{theme === "light" ? "🌙" : "☀️"}</span>
    </button>
  );
}
