"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction, Todo } from "@/lib/types";
import { ToastProvider, useToast } from "./Toast";
import SummaryCards from "./SummaryCards";
import Charts from "./Charts";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import TodoForm from "./TodoForm";
import TodoList from "./TodoList";
import { SkeletonSummary, SkeletonChart, SkeletonList, SkeletonForm } from "./Skeleton";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard, Receipt, ListTodo, LogOut, Menu, X,
  TrendingUp, Wallet, Plus,
} from "lucide-react";

type Tab = "overview" | "money" | "todo";

function Shell() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleDeleteTransaction = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    toast(lang === "th" ? "ลบรายการแล้ว" : "Transaction deleted", "success");
    fetchTransactions();
  };

  const NAV: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: lang === "th" ? "ภาพรวม" : "Overview", icon: LayoutDashboard },
    { key: "money", label: lang === "th" ? "รายรับ-รายจ่าย" : "Transactions", icon: Receipt },
    { key: "todo", label: lang === "th" ? "งานที่ต้องทำ" : "Tasks", icon: ListTodo },
  ];

  const pendingTodos = todos.filter((t) => !t.completed).length;
  const balance = totalIncome - totalExpense;

  const titles: Record<Tab, { title: string; sub: string }> = {
    overview: { title: lang === "th" ? "ภาพรวม" : "Overview", sub: lang === "th" ? "สรุปการเงินและงานของคุณ" : "Your money & tasks at a glance" },
    money: { title: lang === "th" ? "รายรับ-รายจ่าย" : "Transactions", sub: lang === "th" ? "บันทึกและจัดการรายการการเงิน" : "Record and manage your transactions" },
    todo: { title: lang === "th" ? "งานที่ต้องทำ" : "Tasks", sub: lang === "th" ? "จัดการงานของคุณให้เป็นระบบ" : "Stay organized, get things done" },
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "var(--text-invert)" }}>
            <Wallet size={16} style={{ color: "var(--sidebar)" }} />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">Fintrack</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: "#8a867d" }}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-label">{lang === "th" ? "เมนู" : "Menu"}</div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${tab === key ? "active" : ""}`}
              onClick={() => { setTab(key); setSidebarOpen(false); }}>
              <span className="nav-icon"><Icon size={17} /></span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={17} /></span>
            {t.logout}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="overlay lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="main-area">
        {/* Topbar */}
        <header className="sticky top-0 z-40 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 px-4 lg:px-10 py-3">
            <button className="btn-icon lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="flex-1" />
            <LangToggle />
            <ThemeToggle />
            <button className="btn btn-primary !py-2 !px-3.5 !text-[13px]"
              onClick={() => { setTab("money"); setTimeout(() => document.getElementById("tx-form")?.scrollIntoView({ behavior: "smooth" }), 80); }}>
              <Plus size={15} />
              <span className="hidden sm:inline">{lang === "th" ? "เพิ่มรายการ" : "Add"}</span>
            </button>
          </div>
        </header>

        <main className="content">
          {/* Page header */}
          <div className="page-header mb-6 animate-in">
            <div>
              <h1 className="page-title">{titles[tab].title}</h1>
              <p className="page-sub">{titles[tab].sub}</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonSummary />
              {tab !== "todo" && <SkeletonChart />}
              {tab === "money" && <SkeletonForm />}
              <SkeletonList />
            </div>
          ) : (
            <>
              {/* Stats always visible */}
              <SummaryCards income={totalIncome} expense={totalExpense} balance={balance} pendingTodos={pendingTodos} />

              {tab === "overview" && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between animate-in d1">
                    <div className="segmented">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="select !py-2 !pl-3 !pr-9 !text-[13px] !w-auto">
                        <option value="all">{lang === "th" ? "ทุกเดือน" : "All months"}</option>
                        {months.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-ghost !py-2 !px-3.5 !text-[13px]" onClick={() => setTab("money")}>
                      {lang === "th" ? "ดูทั้งหมด" : "View all"}
                    </button>
                  </div>
                  <div className="animate-in d2"><Charts transactions={filtered} /></div>
                  <div className="animate-in d3">
                    <TransactionList transactions={filtered.slice(0, 6)} onEdit={(tx) => { setEditing(tx); setTab("money"); }} onDelete={handleDeleteTransaction} compact />
                  </div>
                </div>
              )}

              {tab === "money" && (
                <div className="mt-5 space-y-4">
                  <div id="tx-form" className="animate-in d1">
                    <TransactionForm onSaved={() => { fetchTransactions(); toast(editing ? (lang === "th" ? "แก้ไขสำเร็จ" : "Updated") : (lang === "th" ? "บันทึกสำเร็จ" : "Saved")); }}
                      editing={editing} onCancelEdit={() => setEditing(null)} />
                  </div>
                  <div className="animate-in d2"><Charts transactions={filtered} /></div>
                  <div className="animate-in d3">
                    <TransactionList transactions={filtered} onEdit={setEditing} onDelete={handleDeleteTransaction} />
                  </div>
                </div>
              )}

              {tab === "todo" && (
                <div className="mt-5 space-y-4">
                  <div className="animate-in d1">
                    <TodoForm onSaved={() => { fetchTodos(); toast(lang === "th" ? "เพิ่มงานแล้ว" : "Task added"); }} />
                  </div>
                  <div className="animate-in d2">
                    <TodoList todos={todos} onSaved={fetchTodos} />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`bottom-nav-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            <span className="nav-icon"><Icon size={19} /></span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
