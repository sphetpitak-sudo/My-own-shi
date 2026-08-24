"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction, Todo } from "@/lib/types";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import SummaryCards from "./SummaryCards";
import Charts from "./Charts";
import MonthFilter from "./MonthFilter";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import TodoForm from "./TodoForm";
import TodoList from "./TodoList";
import { SkeletonSummary, SkeletonChart, SkeletonList, SkeletonForm } from "./Skeleton";

type Tab = "money" | "todo";

export default function Dashboard() {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("money");
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    return user;
  }, [supabase]);

  const fetchTransactions = useCallback(async () => {
    const user = await fetchUser();
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }, [supabase, fetchUser]);

  const fetchTodos = useCallback(async () => {
    const user = await fetchUser();
    if (!user) return;
    const { data } = await supabase.from("todos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTodos(data || []);
    setLoading(false);
  }, [supabase, fetchUser]);

  const fetchAll = useCallback(async () => { await Promise.all([fetchTransactions(), fetchTodos()]); }, [fetchTransactions, fetchTodos]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "todos", filter: `user_id=eq.${userId}` }, () => fetchTodos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, fetchTransactions, fetchTodos]);

  const filtered = transactions.filter((tx) => {
    if (selectedMonth !== "all" && !tx.date.startsWith(selectedMonth)) return false;
    if (selectedCategory !== "all" && tx.category !== selectedCategory) return false;
    return true;
  });

  const months = [...new Set(transactions.map((tx) => tx.date.slice(0, 7)))].sort().reverse();
  const categories = [...new Set(transactions.map((tx) => tx.category))];
  const totalIncome = filtered.filter((tx) => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
  const totalExpense = filtered.filter((tx) => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const handleDeleteTransaction = async (id: string) => { await supabase.from("transactions").delete().eq("id", id); fetchTransactions(); };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(180deg, #e8f5e9 0%, #fdf6e3 30%, #f5e6c8 100%)" }}>
      {/* Floating decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-8 text-4xl animate-float opacity-30">🌲</div>
        <div className="absolute top-24 right-12 text-3xl animate-sway opacity-25" style={{ animationDelay: "1s" }}>🌿</div>
        <div className="absolute bottom-32 left-16 text-3xl animate-float-slow opacity-20">🍃</div>
        <div className="absolute bottom-20 right-8 text-4xl animate-float opacity-15" style={{ animationDelay: "0.5s" }}>🌳</div>
        <div className="absolute top-1/2 left-1/3 text-2xl animate-sway opacity-15" style={{ animationDelay: "2s" }}>🍄</div>
        <div className="absolute top-1/3 right-1/3 text-2xl animate-float-slow opacity-10">🦋</div>
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: "rgba(253, 246, 227, 0.85)", borderBottom: "2px solid #d4c5a0" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #6b8e23, #4a7c23)", boxShadow: "0 3px 0 #3d5a10, 0 6px 12px rgba(107,142,35,0.3)" }}>
              🏡
            </div>
            <div>
              <h1 className="font-pixel text-base font-bold" style={{ color: "#2d5016" }}>SHERWOOD</h1>
              <p className="font-pixel text-xs" style={{ color: "#b8a88a" }}>{dateStr} · {timeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
              style={{ color: "#c0392b", background: "rgba(192,57,43,0.08)" }}>
              <span className="text-base">🚪</span>
              <span className="font-pixel text-xs font-bold hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Welcome Banner */}
        <div className="parchment-header animate-in">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="font-pixel text-xl font-bold" style={{ color: "#2d5016" }}>
                {lang === "th" ? "สวัสดี! 🌿" : "Hello! 🌿"}
              </h2>
              <p className="font-pixel text-sm mt-1" style={{ color: "#8b7355" }}>
                {lang === "th" ? "ยินดีต้อนรับกลับสู่นิคมของคุณ" : "Welcome back to your village"}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-4xl animate-float">🦊</span>
              <span className="text-3xl animate-float-slow" style={{ animationDelay: "0.3s" }}>🐰</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 animate-in" style={{ animationDelay: "0.05s" }}>
          {([["money", "💰", lang === "th" ? "เงิน" : "Money"], ["todo", "📋", lang === "th" ? "งาน" : "Tasks"]] as const).map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className="flex-1 py-4 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={tab === key
                ? { background: "linear-gradient(135deg, #6b8e23, #7ba828)", color: "white", border: "2px solid #4a6b14", boxShadow: "0 3px 0 #3d5a10, 0 8px 16px rgba(107,142,35,0.3)" }
                : { background: "rgba(255,254,249,0.7)", border: "2px solid #d4c5a0", color: "#8b7355" }
              }>
              <span className="text-xl">{icon}</span> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <><SkeletonSummary /><SkeletonForm /><SkeletonChart /><SkeletonList /></>
        ) : tab === "money" ? (
          <>
            <SummaryCards income={totalIncome} expense={totalExpense} />
            <MonthFilter months={months} categories={categories} selectedMonth={selectedMonth} selectedCategory={selectedCategory}
              onMonthChange={setSelectedMonth} onCategoryChange={setSelectedCategory} />
            <TransactionForm onSaved={fetchTransactions} editing={editing} onCancelEdit={() => setEditing(null)} />
            <Charts transactions={filtered} />
            <TransactionList transactions={filtered} onEdit={setEditing} onDelete={handleDeleteTransaction} />
          </>
        ) : (
          <>
            <TodoForm onSaved={fetchTodos} />
            <TodoList todos={todos} onSaved={fetchTodos} />
          </>
        )}
      </main>

      <footer className="relative z-10 py-6 mt-12" style={{ borderTop: "2px solid #d4c5a0" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-pixel text-xs" style={{ color: "#b8a88a" }}>🏡 SHERWOOD FINANCE © 2024 ✦ Built with 🌿</p>
        </div>
      </footer>
    </div>
  );
}
