"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Plus, ArrowDownLeft, ArrowUpRight, Calendar, Tag, FileText, Save, X } from "lucide-react";

interface Props {
  onSaved: () => void;
  editing: Transaction | null;
  onCancelEdit: () => void;
}

const CATEGORIES = ["food", "transport", "study", "entertainment", "salary", "gift", "other"];

export default function TransactionForm({ onSaved, editing, onCancelEdit }: Props) {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { user_id: user.id, type, amount: Number(amount), category, note, date };

    if (editing) {
      await supabase.from("transactions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("transactions").insert(payload);
    }

    setAmount(""); setNote(""); setDate(new Date().toISOString().slice(0, 10));
    if (editing) onCancelEdit();
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5 animate-in" style={{ animationDelay: "0.1s" }}>
      <h3 className="font-pixel text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" />
        {editing ? t.edit : t.add}
      </h3>

      <div className="flex gap-3">
        <button type="button" onClick={() => setType("expense")}
          className={`flex-1 py-3 rounded-xl font-pixel text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            type === "expense"
              ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}>
          <ArrowUpRight className="w-4 h-4" /> {t.expense}
        </button>
        <button type="button" onClick={() => setType("income")}
          className={`flex-1 py-3 rounded-xl font-pixel text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            type === "income"
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}>
          <ArrowDownLeft className="w-4 h-4" /> {t.income}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <span className="text-blue-500">฿</span> {t.amount}
          </label>
          <input type="number" required min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="pixel-input" placeholder="0.00" />
        </div>
        <div>
          <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" /> {t.date}
          </label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="pixel-input" />
        </div>
      </div>

      <div>
        <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-blue-500" /> {t.category}
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="pixel-select">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t[c as keyof typeof t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-pixel text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-500" /> {t.note}
        </label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="pixel-input"
          placeholder={lang === "th" ? "บันทึกเพิ่มเติม..." : "Optional note..."} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="gradient-btn flex-1 flex items-center justify-center gap-2 font-pixel">
          <Save className="w-4 h-4" />
          {loading ? t.loading : editing ? t.save : t.add}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="outline-btn flex items-center gap-2 font-pixel">
            <X className="w-4 h-4" /> {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
