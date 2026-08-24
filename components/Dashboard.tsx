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
import { LogOut, DollarSign, FileText } from "lucide-react";

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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ background: "rgba(245,240,232,0.9)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-pixel text-sm font-bold"
              style={{ background: "var(--accent)", color: "white" }}>
              S
            </div>
            <span className="font-pixel text-sm font-bold hidden sm:inline" style={{ color: "var(--text)" }}>Sherwood</span>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button onClick={handleLogout} className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Title */}
        <div className="animate-in">
          <h1 className="font-pixel text-xl font-bold" style={{ color: "var(--text)" }}>
            {lang === "th" ? "สวัสดี!" : "Hello!"} 👋
          </h1>
          <p className="font-pixel text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {lang === "th" ? "นี่คือภาพรวมการเงินของคุณ" : "Here's your financial overview"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-in" style={{ animationDelay: "0.03s" }}>
          <button onClick={() => setTab("money")} className="tab flex items-center gap-1.5"
            style={tab === "money" ? { background: "var(--accent)", color: "white" } : {}}>
            <DollarSign className="w-3.5 h-3.5" />
            {lang === "th" ? "เงิน" : "Money"}
          </button>
          <button onClick={() => setTab("todo")} className="tab flex items-center gap-1.5"
            style={tab === "todo" ? { background: "var(--accent)", color: "white" } : {}}>
            <FileText className="w-3.5 h-3.5" />
            {lang === "th" ? "งาน" : "Tasks"}
          </button>
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
    </div>
  );
}
