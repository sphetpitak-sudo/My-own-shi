"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Todo } from "@/lib/types";
import { Check, Trash2, ListTodo, AlertTriangle } from "lucide-react";

interface Props { todos: Todo[]; onSaved: () => void; }

export default function TodoList({ todos, onSaved }: Props) {
  const { lang } = useLang();
  const supabase = createClient();
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const handleToggle = async (todo: Todo) => {
    await supabase.from("todos").update({ completed: !todo.completed }).eq("id", todo.id);
    onSaved();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("todos").delete().eq("id", id);
    onSaved();
  };

  const isOverdue = (d: string | null) => d && new Date(d) < new Date(new Date().toDateString());

  const PRI: Record<string, { label: string; badgeClass: string }> = {
    low: { label: lang === "th" ? "ต่ำ" : "LOW", badgeClass: "badge-green" },
    medium: { label: lang === "th" ? "กลาง" : "MED", badgeClass: "badge-amber" },
    high: { label: lang === "th" ? "สูง" : "HIGH", badgeClass: "badge-red" },
  };

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="sec-title flex items-center gap-2">
          <ListTodo size={16} style={{ color: "var(--text-muted)" }} />
          {lang === "th" ? "รายการงาน" : "Tasks"}
        </h3>
        <div className="segmented">
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`segmented-item text-[12px] py-1.5 px-3 ${filter === f ? "active" : ""}`}>
              {f === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : f === "active" ? (lang === "th" ? "ค้าง" : "Active") : (lang === "th" ? "เสร็จ" : "Done")}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="empty py-8">
            <div className="empty-icon"><ListTodo size={20} /></div>
            <div className="empty-title">
              {filter === "done" ? (lang === "th" ? "ยังไม่มีงานที่เสร็จ" : "No completed tasks") :
               filter === "active" ? (lang === "th" ? "ไม่มีงานค้าง — เก่งมาก!" : "All done! Great job!") :
               (lang === "th" ? "ยังไม่มีงาน" : "No tasks yet")}
            </div>
          </div>
        ) : filtered.map((todo) => (
          <div key={todo.id}
            className={`list-item group ${todo.completed ? "opacity-50" : ""}`}
            style={isOverdue(todo.due_date) && !todo.completed ? { background: "var(--red-soft)" } : {}}>
            <button onClick={() => handleToggle(todo)} className={`cb ${todo.completed ? "on" : ""}`}>
              {todo.completed && <Check size={13} strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] truncate"
                style={{ textDecoration: todo.completed ? "line-through" : "none", color: todo.completed ? "var(--text-muted)" : "var(--text)" }}>
                {todo.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`badge ${PRI[todo.priority].badgeClass}`}>{PRI[todo.priority].label}</span>
                {todo.due_date && (
                  <span className="text-[12px] flex items-center gap-1"
                    style={{ color: isOverdue(todo.due_date) && !todo.completed ? "var(--red)" : "var(--text-muted)", fontWeight: isOverdue(todo.due_date) && !todo.completed ? 600 : 400 }}>
                    {isOverdue(todo.due_date) && !todo.completed && <AlertTriangle size={12} />}
                    {todo.due_date}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => handleDelete(todo.id)} className="icon-btn-sm danger opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {todos.length > 0 && (
        <div className="px-5 pb-4">
          <div className="divider mb-3" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {todos.filter((t) => t.completed).length}/{todos.length} {lang === "th" ? "เสร็จแล้ว" : "completed"}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: "var(--green)" }}>
              {Math.round((todos.filter((t) => t.completed).length / todos.length) * 100)}%
            </span>
          </div>
          <div className="bar bar-green">
            <div style={{ width: `${(todos.filter((t) => t.completed).length / todos.length) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}