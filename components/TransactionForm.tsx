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
  const { t, lang } = useLang();
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
    <form onSubmit={handleSubmit} className="pixel-card space-y-4">
      <h3 className="font-pixel text-xs text-pixel-700 dark:text-pixel-300">
        {editing ? `✦ ${t.edit}` : `✦ ${t.add}`}
      </h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 py-2 font-pixel text-[9px] uppercase border-2 transition-all ${
            type === "expense"
              ? "border-red-500 bg-red-500 text-white shadow-[2px_2px_0px_0px] shadow-red-700"
              : "border-pixel-300 dark:border-pixel-700 bg-transparent text-pixel-500 hover:bg-pixel-100 dark:hover:bg-pixel-900"
          }`}
        >
          {t.expense}
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 py-2 font-pixel text-[9px] uppercase border-2 transition-all ${
            type === "income"
              ? "border-green-500 bg-green-500 text-white shadow-[2px_2px_0px_0px] shadow-green-700"
              : "border-pixel-300 dark:border-pixel-700 bg-transparent text-pixel-500 hover:bg-pixel-100 dark:hover:bg-pixel-900"
          }`}
        >
          {t.income}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-pixel text-[8px] text-pixel-500 uppercase mb-2">
            {t.amount}
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pixel-input"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block font-pixel text-[8px] text-pixel-500 uppercase mb-2">
            {t.date}
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pixel-input"
          />
        </div>
      </div>

      <div>
        <label className="block font-pixel text-[8px] text-pixel-500 uppercase mb-2">
          {t.category}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="pixel-select"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t[c as keyof typeof t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-pixel text-[8px] text-pixel-500 uppercase mb-2">
          {t.note}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="pixel-input"
          placeholder={lang === "th" ? "บันทึกเพิ่มเติม..." : "Optional note..."}
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="pixel-btn flex-1">
          {loading ? `... ${t.loading}` : editing ? `✦ ${t.save}` : `✦ ${t.add}`}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="pixel-btn-outline">
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
