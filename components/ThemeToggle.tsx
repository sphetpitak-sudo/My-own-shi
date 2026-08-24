"use client";

import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="p-1.5 rounded-lg transition-all"
      style={{ background: "var(--accent-soft)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
      {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
    </button>
  );
}
