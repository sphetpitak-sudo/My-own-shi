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

  return (
    <div className="glass-card p-6 animate-in" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-pixel text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-blue-500" /> {lang === "th" ? "รายการงาน" : "Tasks"}
        </h3>
        <div className="flex gap-1.5">
          {(["all", "active", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-pixel text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}>
              {f === "all" ? (lang === "th" ? "ทั้งหมด" : "All") : f === "active" ? (lang === "th" ? "ค้าง" : "Active") : (lang === "th" ? "เสร็จ" : "Done")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <ListTodo className="w-7 h-7 text-blue-400" />
          </div>
          <p className="font-pixel text-sm text-slate-400">
            {filter === "done" ? (lang === "th" ? "ยังไม่มีงานที่เสร็จ" : "No completed tasks") :
             filter === "active" ? (lang === "th" ? "ไม่มีงานค้าง 🎉" : "All done! 🎉") :
             (lang === "th" ? "ยังไม่มีงาน" : "No tasks yet")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((todo) => (
            <div key={todo.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                todo.completed ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60" :
                isOverdue(todo.due_date) ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50" :
                "bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800"
              }`}>
              <button onClick={() => handleToggle(todo)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  todo.completed ? "bg-gradient-to-br from-green-500 to-emerald-500 border-transparent text-white" : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
                }`}>
                {todo.completed && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-pixel text-sm font-semibold ${todo.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`tag ${
                    todo.priority === "high" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    todo.priority === "medium" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                    "bg-green-500/10 text-green-600 dark:text-green-400"
                  }`}>
                    {todo.priority === "high" ? (lang === "th" ? "สูง" : "HIGH") : todo.priority === "medium" ? (lang === "th" ? "กลาง" : "MED") : (lang === "th" ? "ต่ำ" : "LOW")}
                  </span>
                  {todo.due_date && (
                    <span className={`font-pixel text-xs ${isOverdue(todo.due_date) && !todo.completed ? "text-red-500 font-bold" : "text-slate-400"}`}>
                      {isOverdue(todo.due_date) && !todo.completed && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {todo.due_date}
                    </span>
                  )}
                </div>
              </div>

              <button onClick={() => handleDelete(todo.id)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {todos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="font-pixel text-xs text-slate-400 text-center">
            {lang === "th"
              ? `${todos.length} ทั้งหมด · ${todos.filter(t => t.completed).length} เสร็จ · ${todos.filter(t => !t.completed).length} ค้าง`
              : `${todos.length} total · ${todos.filter(t => t.completed).length} done · ${todos.filter(t => !t.completed).length} active`}
          </p>
        </div>
      )}
    </div>
  );
}
