"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";

interface Props { onSaved: () => void; }

export default function TodoForm({ onSaved }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("todos").insert({ user_id: user.id, title: title.trim(), priority, due_date: dueDate || null });
    setTitle(""); setPriority("medium"); setDueDate("");
    setLoading(false); onSaved();
  };

  const PRIORITY_CONFIG = {
    low: { icon: "🌱", label: lang === "th" ? "ต่ำ" : "Low", bg: "linear-gradient(135deg, #27ae60, #2ecc71)" },
    medium: { icon: "🌿", label: lang === "th" ? "กลาง" : "Med", bg: "linear-gradient(135deg, #f39c12, #f1c40f)" },
    high: { icon: "🔥", label: lang === "th" ? "สูง" : "High", bg: "linear-gradient(135deg, #c0392b, #e74c3c)" },
  };

  return (
    <form onSubmit={handleSubmit} className="forest-card p-6 space-y-5 animate-in">
      <h3 className="section-header" style={{ color: "#2d5016" }}>
        <span className="text-xl">📋</span> {lang === "th" ? "เพิ่มงานใหม่" : "Add New Task"}
      </h3>

      <div>
        <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
          🎯 {lang === "th" ? "ชื่องาน" : "Task Title"}
        </label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="forest-input" placeholder={lang === "th" ? "ทำอะไร..." : "What to do..."} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
            🚩 {lang === "th" ? "ความสำคัญ" : "Priority"}
          </label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className="flex-1 py-3 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                style={priority === p
                  ? { background: PRIORITY_CONFIG[p].bg, color: "white", border: "2px solid rgba(0,0,0,0.15)", boxShadow: "0 3px 0 rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.15)" }
                  : { background: "#f5f0e0", border: "2px solid #d4c5a0", color: "#8b7355" }
                }>
                <span>{PRIORITY_CONFIG[p].icon}</span> {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
            📅 {t.date} <span className="font-normal" style={{ color: "#b8a88a" }}>({lang === "th" ? "ไม่บังคับ" : "optional"})</span>
          </label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="forest-input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="leaf-btn w-full flex items-center justify-center gap-2 font-pixel">
        {loading ? "⏳" : "✅"} {loading ? t.loading : lang === "th" ? "เพิ่มงาน" : "Add Task"}
      </button>
    </form>
  );
}
