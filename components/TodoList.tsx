"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Todo } from "@/lib/types";
import { Check, Trash2, ListTodo } from "lucide-react";

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

  const PRI: Record<string, { bg: string; color: string; border: string }> = {
    low: { bg: "var(--green-bg)", color: "var(--green)", border: "var(--green)" },
    medium: { bg: "var(--yellow-bg)", color: "var(--yellow)", border: "var(--yellow)" },
    high: { bg: "var(--red-bg)", color: "var(--red)", border: "var(--red)" },
  };

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="sec" style={{ color: "var(--text)" }}>
          <ListTodo className="w-4 h-4" style={{ color: "var(--green)" }} />
          {lang === "th" ? "รายการงาน" : "Tasks"}
        </h3>
        <div className="flex gap-1">
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="tab text-xs py-1.5 px-2.5"
              style={filter === f ? { background: "var(--accent)", color: "white" } : {}}>
              {f === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : f === "active" ? (lang === "th" ? "ค้าง" : "Active") : (lang === "th" ? "เสร็จ" : "Done")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <ListTodo className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-light)" }} />
          <p className="font-pixel text-xs" style={{ color: "var(--text-light)" }}>
            {filter === "done" ? (lang === "th" ? "ยังไม่มีงานที่เสร็จ" : "No completed tasks") :
             filter === "active" ? (lang === "th" ? "ไม่มีงานค้าง" : "All done!") :
             (lang === "th" ? "ยังไม่มีงาน" : "No tasks yet")}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((todo) => (
            <div key={todo.id} className={`todo-item group ${todo.completed ? "done" : ""}`}
              style={isOverdue(todo.due_date) && !todo.completed ? { background: "var(--red-bg)", borderColor: "var(--red)" } : {}}>
              <button onClick={() => handleToggle(todo)} className={`cb ${todo.completed ? "on" : ""}`}>
                {todo.completed && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-pixel text-sm font-semibold" style={{
                  color: todo.completed ? "var(--text-light)" : "var(--text)",
                  textDecoration: todo.completed ? "line-through" : "none"
                }}>{todo.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge" style={{ background: PRI[todo.priority].bg, color: PRI[todo.priority].color, border: `1px solid ${PRI[todo.priority].border}` }}>
                    {todo.priority === "high" ? (lang === "th" ? "สูง" : "HIGH") : todo.priority === "medium" ? (lang === "th" ? "กลาง" : "MED") : (lang === "th" ? "ต่ำ" : "LOW")}
                  </span>
                  {todo.due_date && (
                    <span className="font-pixel text-xs" style={{
                      color: isOverdue(todo.due_date) && !todo.completed ? "var(--red)" : "var(--text-light)",
                      fontWeight: isOverdue(todo.due_date) && !todo.completed ? 700 : 400
                    }}>
                      {isOverdue(todo.due_date) && !todo.completed && "⚠ "}{todo.due_date}
                    </span>
                  )}
                </div>
              </div>

              <button onClick={() => handleDelete(todo.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--red)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {todos.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="font-pixel text-xs" style={{ color: "var(--text-light)" }}>
            {lang === "th"
              ? `${todos.length} ทั้งหมด · ${todos.filter(t => t.completed).length} เสร็จ · ${todos.filter(t => !t.completed).length} ค้าง`
              : `${todos.length} total · ${todos.filter(t => t.completed).length} done · ${todos.filter(t => !t.completed).length} active`}
          </p>
          <div className="bar-track mt-2">
            <div className="bar-fill" style={{ width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
