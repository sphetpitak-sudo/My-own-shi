"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface Props {
  onSaved: () => void;
  editing: Transaction | null;
  onCancelEdit: () => void;
}

const CATEGORIES = [
  "food",
  "transport",
  "study",
  "entertainment",
  "salary",
  "gift",
  "other",
];

export default function TransactionForm({
  onSaved,
  editing,
  onCancelEdit,
}: Props) {
  const { t } = useLang();
  const supabase = createClient();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setNote(editing.note);
      setDate(editing.date);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      type,
      amount: Number(amount),
      category,
      note,
      date,
    };

    if (editing) {
      await supabase.from("transactions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("transactions").insert(payload);
    }

    setAmount("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    if (editing) onCancelEdit();
    setLoading(false);
    onSaved();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-md p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold">
        {editing ? t.edit : t.add}
      </h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === "expense"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t.expense}
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === "income"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {t.income}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.amount}
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.date}
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.category}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t[c as keyof typeof t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.note}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t.loading : t.save}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
