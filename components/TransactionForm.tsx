"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Plus, Save, X } from "lucide-react";

const CATEGORIES = ["food", "transport", "study", "entertainment", "salary", "gift", "other"];

interface Props { onSaved: () => void; editing: Transaction | null; onCancelEdit: () => void; }

export default function TransactionForm({ onSaved, editing, onCancelEdit }: Props) {
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
      setType(editing.type); setAmount(String(editing.amount));
      setCategory(editing.category); setNote(editing.note); setDate(editing.date);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, type, amount: Number(amount), category, note, date };
    if (editing) await supabase.from("transactions").update(payload).eq("id", editing.id);
    else await supabase.from("transactions").insert(payload);
    setAmount(""); setNote(""); setDate(new Date().toISOString().slice(0, 10));
    if (editing) onCancelEdit();
    setLoading(false); onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4 animate-in" style={{ animationDelay: "0.05s" }}>
      <h3 className="sec" style={{ color: "var(--text)" }}>
        <Plus className="w-4 h-4" style={{ color: "var(--green)" }} />
        {editing ? t.edit : t.add}
      </h3>

      <div className="flex gap-2">
        <button type="button" onClick={() => setType("expense")} className="type-btn"
          style={type === "expense" ? { background: "var(--red-bg)", borderColor: "var(--red)", color: "var(--red)" } : {}}>
          {t.expense}
        </button>
        <button type="button" onClick={() => setType("income")} className="type-btn"
          style={type === "income" ? { background: "var(--green-bg)", borderColor: "var(--green)", color: "var(--green)" } : {}}>
          {t.income}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{t.amount}</label>
          <input type="number" required min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
        </div>
        <div>
          <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{t.date}</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      <div>
        <label className="block font-pixel text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>{t.category}</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className="cat"
              style={category === c ? { background: "var(--accent)", color: "white", borderColor: "var(--accent)" } : {}}>
              {t[c as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-pixel text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{t.note}</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Optional..." />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <Save className="w-3.5 h-3.5" />
          {loading ? t.loading : editing ? t.save : t.add}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="btn-ghost flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
