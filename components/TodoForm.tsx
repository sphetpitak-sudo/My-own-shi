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
    if (!user) { setLoading(false); return; }
    await supabase.from("todos").insert({ user_id: user.id, title: title.trim(), priority, due_date: dueDate || null });
    setTitle(""); setPriority("medium"); setDueDate("");
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 animate-in">
      <h3 className="sec-title mb-4">{lang === "th" ? "เพิ่มงานใหม่" : "New Task"}</h3>

      <div className="field mb-4">
        <label className="label">{lang === "th" ? "ชื่องาน" : "Task"}</label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          className="input" placeholder={lang === "th" ? "ทำอะไร..." : "What to do..."} />
      </div>

      <div className="grid-form gap-4 mb-5">
        <div className="field">
          <label className="label">{lang === "th" ? "ความสำคัญ" : "Priority"}</label>
          <div className="segmented w-full">
            {(["low", "medium", "high"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`segmented-item flex-1 ${priority === p ? "active" : ""}`}>
                {p === "low" ? (lang === "th" ? "ต่ำ" : "Low") : p === "medium" ? (lang === "th" ? "กลาง" : "Med") : (lang === "th" ? "สูง" : "High")}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">{t.date}</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        <Save size={15} />
        {loading ? t.loading : lang === "th" ? "เพิ่มงาน" : "Add Task"}
      </button>
    </form>
  );
}