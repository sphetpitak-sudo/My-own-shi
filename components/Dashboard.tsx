"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import LangToggle from "./LangToggle";
import SummaryCards from "./SummaryCards";
import Charts from "./Charts";
import MonthFilter from "./MonthFilter";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";

export default function Dashboard() {
  const { t } = useLang();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">{t.app_name}</h1>
          <div className="flex items-center gap-2">
            <LangToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <SummaryCards income={totalIncome} expense={totalExpense} />

        <MonthFilter
          months={months}
          categories={categories}
          selectedMonth={selectedMonth}
          selectedCategory={selectedCategory}
          onMonthChange={setSelectedMonth}
          onCategoryChange={setSelectedCategory}
        />

        <Charts transactions={filtered} />

        <TransactionForm
          onSaved={fetchTransactions}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />

        <TransactionList
          transactions={filtered}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
