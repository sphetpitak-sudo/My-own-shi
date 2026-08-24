"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Todo } from "@/lib/types";

interface Props { todos: Todo[]; onSaved: () => void; }

const PRIORITY_ICONS = { low: "🌱", medium: "🌿", high: "🔥" };
const PRIORITY_COLORS = {
  low: { bg: "rgba(39,174,96,0.12)", color: "#27ae60", border: "rgba(39,174,96,0.3)" },
  medium: { bg: "rgba(243,156,18,0.12)", color: "#f39c12", border: "rgba(243,156,18,0.3)" },
  high: { bg: "rgba(192,57,43,0.12)", color: "#c0392b", border: "rgba(192,57,43,0.3)" },
};

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

  return (
    <div className="forest-card p-6 animate-in" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-header" style={{ color: "#2d5016" }}>
          <span className="text-xl">📝</span> {lang === "th" ? "รายการงาน" : "Tasks"}
        </h3>
        <div className="flex gap-1.5">
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="game-tab text-xs py-2 px-3"
              style={filter === f ? { background: "linear-gradient(135deg, #6b8e23, #7ba828)", color: "white", border: "2px solid #4a6b14" } : {}}>
              {f === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : f === "active" ? (lang === "th" ? "ค้าง" : "Active") : (lang === "th" ? "เสร็จ" : "Done")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <span className="text-5xl mb-3 block animate-float">🦊</span>
          <p className="font-pixel text-sm" style={{ color: "#b8a88a" }}>
            {filter === "done" ? (lang === "th" ? "ยังไม่มีงานที่เสร็จ" : "No completed tasks") :
             filter === "active" ? (lang === "th" ? "ไม่มีงานค้าง 🎉" : "All done! 🎉") :
             (lang === "th" ? "ยังไม่มีงาน" : "No tasks yet")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((todo) => (
            <div key={todo.id} className="todo-item group"
              style={isOverdue(todo.due_date) && !todo.completed
                ? { background: "#fbe9e7", borderColor: "#ffab91" }
                : todo.completed ? { opacity: 0.5 } : {}
              }>
              <button onClick={() => handleToggle(todo)}
                className={`checkbox-game ${todo.completed ? "checked" : ""}`}>
                {todo.completed && <span className="text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-pixel text-sm font-bold" style={{ color: todo.completed ? "#b8a88a" : "#2d5016", textDecoration: todo.completed ? "line-through" : "none" }}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge" style={{ background: PRIORITY_COLORS[todo.priority].bg, color: PRIORITY_COLORS[todo.priority].color, border: `1px solid ${PRIORITY_COLORS[todo.priority].border}` }}>
                    {PRIORITY_ICONS[todo.priority]} {todo.priority === "high" ? (lang === "th" ? "สูง" : "HIGH") : todo.priority === "medium" ? (lang === "th" ? "กลาง" : "MED") : (lang === "th" ? "ต่ำ" : "LOW")}
                  </span>
                  {todo.due_date && (
                    <span className="font-pixel text-xs" style={{ color: isOverdue(todo.due_date) && !todo.completed ? "#c0392b" : "#b8a88a", fontWeight: isOverdue(todo.due_date) && !todo.completed ? 700 : 400 }}>
                      {isOverdue(todo.due_date) && !todo.completed && "⚠️ "}{todo.due_date}
                    </span>
                  )}
                </div>
              </div>

              <button onClick={() => handleDelete(todo.id)}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "#fbe9e7", color: "#c0392b" }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {todos.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e8dcc8" }}>
          <div className="flex items-center justify-between">
            <p className="font-pixel text-xs" style={{ color: "#b8a88a" }}>
              📊 {lang === "th"
                ? `${todos.length} ทั้งหมด · ${todos.filter(t => t.completed).length} เสร็จ · ${todos.filter(t => !t.completed).length} ค้าง`
                : `${todos.length} total · ${todos.filter(t => t.completed).length} done · ${todos.filter(t => !t.completed).length} active`}
            </p>
          </div>
          {todos.length > 0 && (
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
