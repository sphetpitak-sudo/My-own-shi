"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Plus, Calendar, Flag } from "lucide-react";

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

  const priorityColors = {
    low: "from-green-500 to-emerald-500",
    medium: "from-yellow-500 to-amber-500",
    high: "from-red-500 to-rose-500",
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 animate-in">
      <h3 className="font-pixel text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" />
        {lang === "th" ? "เพิ่มงานใหม่" : "Add New Task"}
      </h3>

      <div>
        <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
          {lang === "th" ? "ชื่องาน" : "Task Title"}
        </label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="pixel-input" placeholder={lang === "th" ? "ทำอะไร..." : "What to do..."} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-blue-500" /> {lang === "th" ? "ความสำคัญ" : "Priority"}
          </label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 py-2.5 rounded-xl font-pixel text-sm font-semibold transition-all ${
                  priority === p
                    ? `bg-gradient-to-r ${priorityColors[p]} text-white shadow-lg`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}>
                {p === "low" ? (lang === "th" ? "ต่ำ" : "Low") : p === "medium" ? (lang === "th" ? "กลาง" : "Med") : (lang === "th" ? "สูง" : "High")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" /> {t.date} <span className="text-slate-400 font-normal">({lang === "th" ? "ไม่บังคับ" : "optional"})</span>
          </label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="pixel-input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="gradient-btn w-full flex items-center justify-center gap-2 font-pixel">
        <Plus className="w-4 h-4" />
        {loading ? t.loading : lang === "th" ? "เพิ่มงาน" : "Add Task"}
      </button>
    </form>
  );
}
