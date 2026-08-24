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
import { LogOut, Wallet, ListTodo, Sparkles } from "lucide-react";

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

  return (
    <div className="min-h-screen relative">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/15 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-pixel text-base font-bold text-slate-800 dark:text-slate-100">PIXEL FINANCE</h1>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="font-pixel text-xs font-semibold hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Tab Navigation */}
        <div className="flex gap-3 animate-in">
          {([["money", "💰", lang === "th" ? "เงิน" : "Money"], ["todo", "📋", lang === "th" ? "งาน" : "Tasks"]] as const).map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className={`flex-1 py-3.5 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                tab === key
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
              }`}>
              <span className="text-lg">{icon}</span> {label}
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

      <footer className="relative z-10 border-t border-slate-200/50 dark:border-slate-700/50 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-pixel text-xs text-slate-400">PIXEL FINANCE © 2024 ✦ Built with ♥</p>
        </div>
      </footer>
    </div>
  );
}
