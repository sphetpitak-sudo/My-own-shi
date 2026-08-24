"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

const CATEGORIES = ["food", "transport", "study", "entertainment", "salary", "gift", "other"];

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍖", transport: "🚌", study: "📚", entertainment: "🎮",
  salary: "💰", gift: "🎁", other: "📦",
};

interface Props { onSaved: () => void; editing: Transaction | null; onCancelEdit: () => void; }

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
      setType(editing.type); setAmount(String(editing.amount));
      setCategory(editing.category); setNote(editing.note); setDate(editing.date);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, type, amount: Number(amount), category, note, date };
    if (editing) { await supabase.from("transactions").update(payload).eq("id", editing.id); }
    else { await supabase.from("transactions").insert(payload); }
    setAmount(""); setNote(""); setDate(new Date().toISOString().slice(0, 10));
    if (editing) onCancelEdit();
    setLoading(false); onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="forest-card p-6 space-y-5 animate-in" style={{ animationDelay: "0.1s" }}>
      <h3 className="section-header" style={{ color: "#2d5016" }}>
        <span className="text-xl">📝</span> {editing ? t.edit : t.add}
      </h3>

      <div className="flex gap-3">
        <button type="button" onClick={() => setType("expense")}
          className="flex-1 py-3.5 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={type === "expense"
            ? { background: "linear-gradient(135deg, #c0392b, #e74c3c)", color: "white", border: "2px solid #922b21", boxShadow: "0 3px 0 #7b241c, 0 6px 12px rgba(192,57,43,0.3)" }
            : { background: "#f5f0e0", border: "2px solid #d4c5a0", color: "#8b7355" }
          }>
          <span>🍂</span> {t.expense}
        </button>
        <button type="button" onClick={() => setType("income")}
          className="flex-1 py-3.5 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={type === "income"
            ? { background: "linear-gradient(135deg, #27ae60, #2ecc71)", color: "white", border: "2px solid #1e8449", boxShadow: "0 3px 0 #196f3d, 0 6px 12px rgba(39,174,96,0.3)" }
            : { background: "#f5f0e0", border: "2px solid #d4c5a0", color: "#8b7355" }
          }>
          <span>🌱</span> {t.income}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
            💰 {t.amount}
          </label>
          <input type="number" required min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="forest-input" placeholder="0.00" />
        </div>
        <div>
          <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
            📅 {t.date}
          </label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="forest-input" />
        </div>
      </div>

      <div>
        <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
          🏷️ {t.category}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className="py-2.5 px-2 rounded-xl font-pixel text-xs font-bold flex flex-col items-center gap-1 transition-all"
              style={category === c
                ? { background: "linear-gradient(135deg, #6b8e23, #7ba828)", color: "white", border: "2px solid #4a6b14", boxShadow: "0 2px 6px rgba(107,142,35,0.3)" }
                : { background: "#f5f0e0", border: "2px solid #e8dcc8", color: "#8b7355" }
              }>
              <span className="text-base">{CATEGORY_ICONS[c]}</span>
              <span>{t[c as keyof typeof t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
          📋 {t.note}
        </label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="forest-input"
          placeholder={lang === "th" ? "บันทึกเพิ่มเติม..." : "Optional note..."} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="leaf-btn flex-1 flex items-center justify-center gap-2 font-pixel">
          {loading ? "⏳" : "✅"} {loading ? t.loading : editing ? t.save : t.add}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="py-3 px-5 rounded-2xl font-pixel text-sm font-bold flex items-center gap-2 transition-all"
            style={{ background: "#f5f0e0", border: "2px solid #d4c5a0", color: "#8b7355" }}>
            ❌ {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
