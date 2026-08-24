"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Plus, Save } from "lucide-react";

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

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4 animate-in">
      <h3 className="sec" style={{ color: "var(--text)" }}>
        <Plus className="w-4 h-4" style={{ color: "var(--green)" }} />
        {lang === "th" ? "เพิ่มงานใหม่" : "Add New Task"}
      </h3>

      <div>
        <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "ชื่องาน" : "Task"}</label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="input" placeholder={lang === "th" ? "ทำอะไร..." : "What to do..."} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "ความสำคัญ" : "Priority"}</label>
          <div className="flex gap-1.5">
            {(["low", "medium", "high"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)} className="type-btn text-xs"
                style={priority === p
                  ? p === "high" ? { background: "var(--red-bg)", borderColor: "var(--red)", color: "var(--red)" }
                  : p === "medium" ? { background: "var(--yellow-bg)", borderColor: "var(--yellow)", color: "var(--yellow)" }
                  : { background: "var(--green-bg)", borderColor: "var(--green)", color: "var(--green)" }
                  : {}
                }>
                {p === "low" ? (lang === "th" ? "ต่ำ" : "Low") : p === "medium" ? (lang === "th" ? "กลาง" : "Med") : (lang === "th" ? "สูง" : "High")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{t.date}</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-green w-full flex items-center justify-center gap-2">
        <Save className="w-3.5 h-3.5" />
        {loading ? t.loading : lang === "th" ? "เพิ่มงาน" : "Add Task"}
      </button>
    </form>
  );
}
