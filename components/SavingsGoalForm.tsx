"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Target, Save, X } from "lucide-react";

const GOAL_COLORS = ["#4F7CFF", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#EC4899"];

interface Props { onSaved: () => void; onClose?: () => void; }

export default function SavingsGoalForm({ onSaved, onClose }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    await supabase.from("savings_goals").insert({
      user_id: user.id, name: name.trim(), target_amount: Number(targetAmount),
      deadline: deadline || null, color,
    });
    setName(""); setTargetAmount(""); setDeadline(""); setColor(GOAL_COLORS[0]);
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="sec-title flex items-center gap-2">
          <Target size={16} style={{ color: "var(--primary)" }} />
          {t.new_goal}
        </h3>
        {onClose && (
          <button type="button" onClick={onClose} className="icon-btn-sm"><X size={16} /></button>
        )}
      </div>

      <div className="field mb-4">
        <label className="label">{t.goal_name}</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
          className="input" placeholder={t.goal_name_ph} />
      </div>

      <div className="grid-form gap-4 mb-4">
        <div className="field">
          <label className="label">{t.target_amount} (฿)</label>
          <input type="number" required min="1" step="0.01" value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)} className="input" placeholder="0.00" />
        </div>
        <div className="field">
          <label className="label">{t.deadline}</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className="input" min={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>

      <div className="field mb-5">
        <label className="label">{t.color}</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : "none" }} />
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        <Save size={15} />
        {loading ? t.loading : t.save}
      </button>
    </form>
  );
}