"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import SummaryCards from "./SummaryCards";
import Charts from "./Charts";
import MonthFilter from "./MonthFilter";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import { SkeletonSummary, SkeletonChart, SkeletonList, SkeletonForm } from "./Skeleton";

export default function Dashboard() {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setTransactions(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("tx-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchTransactions]);

  const filtered = transactions.filter((tx) => {
    if (selectedMonth !== "all" && !tx.date.startsWith(selectedMonth)) return false;
    if (selectedCategory !== "all" && tx.category !== selectedCategory) return false;
    return true;
  });

  const months = [...new Set(transactions.map((tx) => tx.date.slice(0, 7)))].sort().reverse();
  const categories = [...new Set(transactions.map((tx) => tx.category))];

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDelete = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    fetchTransactions();
  };

  return (
    <div className="min-h-screen pixel-decorations">
      <header className="bg-white/80 dark:bg-pixel-950/80 backdrop-blur-sm border-b-2 border-pixel-200 dark:border-pixel-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-pixel-500 text-sm">✦</span>
            <h1 className="font-pixel text-[10px] md:text-xs text-pixel-800 dark:text-pixel-200">
              {lang === "th" ? "PIXEL FINANCE" : "PIXEL FINANCE"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 font-pixel text-[9px] uppercase text-red-500 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <>
            <SkeletonSummary />
            <SkeletonForm />
            <SkeletonChart />
            <SkeletonList />
          </>
        ) : (
          <>
            <SummaryCards income={totalIncome} expense={totalExpense} />

            <MonthFilter
              months={months}
              categories={categories}
              selectedMonth={selectedMonth}
              selectedCategory={selectedCategory}
              onMonthChange={setSelectedMonth}
              onCategoryChange={setSelectedCategory}
            />

            <TransactionForm
              onSaved={fetchTransactions}
              editing={editing}
              onCancelEdit={() => setEditing(null)}
            />

            <Charts transactions={filtered} />

            <TransactionList
              transactions={filtered}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>

      <footer className="border-t-2 border-pixel-200 dark:border-pixel-800 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-pixel text-[7px] text-pixel-400 dark:text-pixel-600">
            PIXEL FINANCE © 2024 ✦ MADE WITH ♥
          </p>
        </div>
      </footer>
    </div>
  );
}
