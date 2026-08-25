"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Repeat, Save, X, Utensils, Bus, BookOpen, Gamepad2, Banknote, Gift, Box } from "lucide-react";

const CATEGORIES = ["food", "transport", "study", "entertainment", "salary", "gift", "other"];
const CAT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, transport: Bus, study: BookOpen, entertainment: Gamepad2,
  salary: Banknote, gift: Gift, other: Box,
};

interface Props { onSaved: () => void; onClose?: () => void; }

export default function RecurringForm({ onSaved, onClose }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    await supabase.from("recurring_transactions").insert({
      user_id: user.id, type, amount: Number(amount), category, note, frequency, next_date: nextDate,
    });
    setAmount(""); setNote(""); setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="sec-title flex items-center gap-2">
          <Repeat size={16} style={{ color: "var(--primary)" }} />
          {t.new_recurring}
        </h3>
        {onClose && (
          <button type="button" onClick={onClose} className="icon-btn-sm"><X size={16} /></button>
        )}
      </div>

      <div className="segmented mb-5 w-full">
        <button type="button" className={`segmented-item flex-1 ${type === "expense" ? "active" : ""}`} onClick={() => setType("expense")}>
          {t.expense}
        </button>
        <button type="button" className={`segmented-item flex-1 ${type === "income" ? "active" : ""}`} onClick={() => setType("income")}>
          {t.income}
        </button>
      </div>

      <div className="grid-form gap-4 mb-4">
        <div className="field">
          <label className="label">{t.amount} (฿)</label>
          <input type="number" required min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
        </div>
        <div className="field">
          <label className="label">{t.frequency}</label>
          <div className="segmented w-full">
            {(["weekly", "monthly", "yearly"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className={`segmented-item flex-1 text-[12px] ${frequency === f ? "active" : ""}`}>
                {f === "weekly" ? t.weekly : f === "monthly" ? t.monthly_recurring : t.yearly}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field mb-4">
        <label className="label">{t.category}</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CAT_ICONS[c];
            return (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`chip ${category === c ? "on" : ""}`}>
                <Icon size={16} />
                <span>{t[c as keyof typeof t]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid-form gap-4 mb-4">
        <div className="field">
          <label className="label">{t.next_date}</label>
          <input type="date" required value={nextDate} onChange={(e) => setNextDate(e.target.value)}
            className="input" min={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="field">
          <label className="label">{t.note}</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Optional..." />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        <Save size={15} />
        {loading ? t.loading : t.save}
      </button>
    </form>
  );
}