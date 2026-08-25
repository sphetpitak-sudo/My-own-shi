"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { Plus, Save, X, Utensils, Bus, BookOpen, Gamepad2, Banknote, Gift, Box, ArrowDownLeft, ArrowUpRight, CalendarDays, StickyNote, Tag } from "lucide-react";

const CATEGORIES = ["food", "transport", "study", "entertainment", "salary", "gift", "other"];

const CAT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, transport: Bus, study: BookOpen, entertainment: Gamepad2,
  salary: Banknote, gift: Gift, other: Box,
};

interface Props { onSaved: () => void; editing: Transaction | null; onCancelEdit: () => void; onCategoryDrop?: (txId: string, category: string) => void; }

export default function TransactionForm({ onSaved, editing, onCancelEdit, onCategoryDrop }: Props) {
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
    } else {
      setType("expense");
      setAmount("");
      setCategory("food");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const payload = { user_id: user.id, type, amount: Number(amount), category, note, date };
    if (editing) await supabase.from("transactions").update(payload).eq("id", editing.id);
    else await supabase.from("transactions").insert(payload);
    setAmount(""); setNote(""); setDate(new Date().toISOString().slice(0, 10));
    if (editing) onCancelEdit();
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 animate-in">
      <h3 className="sec-title mb-4">{editing ? (lang === "th" ? "แก้ไขรายการ" : "Edit Transaction") : (lang === "th" ? "เพิ่มรายการใหม่" : "New Transaction")}</h3>

      <div className="segmented mb-5 w-full">
        <button type="button" className={`segmented-item flex-1 flex items-center justify-center gap-1.5 ${type === "expense" ? "active" : ""}`} onClick={() => setType("expense")}>
          <ArrowUpRight size={14} /> {t.expense}
        </button>
        <button type="button" className={`segmented-item flex-1 flex items-center justify-center gap-1.5 ${type === "income" ? "active" : ""}`} onClick={() => setType("income")}>
          <ArrowDownLeft size={14} /> {t.income}
        </button>
      </div>

      <div className="grid-form gap-4 mb-4">
        <div className="field">
          <label className="label flex items-center gap-1.5"><Tag size={12} /> {t.amount}</label>
          <input type="number" required min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
        </div>
        <div className="field">
          <label className="label flex items-center gap-1.5"><CalendarDays size={12} /> {t.date}</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      <div className="field mb-4">
        <label className="label flex items-center gap-1.5"><Tag size={12} /> {t.category}</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CAT_ICONS[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`chip ${category === c ? "on" : ""}`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const txId = e.dataTransfer.getData("text/plain");
                  if (txId && onCategoryDrop) onCategoryDrop(txId, c);
                }}
              >
                <Icon size={16} />
                <span>{t[c as keyof typeof t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field mb-5">
        <label className="label flex items-center gap-1.5"><StickyNote size={12} /> {t.note}</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Optional..." />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          <Save size={15} />
          {loading ? t.loading : editing ? t.save : t.add}
        </button>
        {editing && (
          <button type="button" onClick={onCancelEdit} className="btn btn-ghost">
            <X size={15} /> {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}