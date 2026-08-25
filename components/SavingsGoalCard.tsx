"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import type { SavingsGoal } from "@/lib/types";
import { Trash2, Plus, CheckCircle, CalendarDays } from "lucide-react";

interface Props { goal: SavingsGoal; onSaved: () => void; toast: (msg: string, type?: "success" | "error" | "info") => void; }

export default function SavingsGoalCard({ goal, onSaved, toast }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [showContribute, setShowContribute] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const achieved = goal.current_amount >= goal.target_amount;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleContribute = async () => {
    if (!addAmount || Number(addAmount) <= 0) return;
    setLoading(true);
    const newAmount = Math.min(goal.current_amount + Number(addAmount), goal.target_amount);
    await supabase.from("savings_goals").update({ current_amount: newAmount }).eq("id", goal.id);
    setAddAmount(""); setShowContribute(false); setLoading(false);
    toast(t.money_added, "success");
    onSaved();
  };

  const handleDelete = async () => {
    await supabase.from("savings_goals").delete().eq("id", goal.id);
    toast(t.goal_deleted, "success");
    onSaved();
  };

  return (
    <div className="card p-5 animate-in" style={{ borderTop: `3px solid ${goal.color}` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-[15px]">{goal.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            {goal.deadline && (
              <span className="text-[12px] flex items-center gap-1" style={{ color: daysLeft !== null && daysLeft < 0 ? "var(--red)" : "var(--text-muted)" }}>
                <CalendarDays size={12} />
                {daysLeft !== null && daysLeft < 0
                  ? `${t.overdue} ${Math.abs(daysLeft)} ${lang === "th" ? "วัน" : "days"}`
                  : daysLeft !== null
                    ? `${daysLeft} ${t.days_left}`
                    : goal.deadline}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleDelete} className="icon-btn-sm danger"><Trash2 size={14} /></button>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold" style={{ color: goal.color }}>
            ฿{goal.current_amount.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            / ฿{goal.target_amount.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: achieved ? "var(--green)" : goal.color }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{Math.round(progress)}%</span>
          {achieved && (
            <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "var(--green)" }}>
              <CheckCircle size={12} /> {t.achieved}
            </span>
          )}
        </div>
      </div>

      {!achieved && (
        <>
          {showContribute ? (
            <div className="flex gap-2">
              <input type="number" min="1" step="0.01" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                className="input flex-1 !py-2 !text-[13px]" placeholder={`฿${remaining.toLocaleString()}`} autoFocus />
              <button onClick={handleContribute} disabled={loading} className="btn btn-primary !py-2 !px-3 !text-[13px]">
                {loading ? "..." : <Plus size={14} />}
              </button>
              <button onClick={() => { setShowContribute(false); setAddAmount(""); }} className="btn btn-ghost !py-2 !px-3 !text-[13px]">
                <span>{t.cancel}</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setShowContribute(true)} className="btn btn-soft w-full !text-[13px]">
              <Plus size={14} /> {t.contribute}
            </button>
          )}
        </>
      )}
    </div>
  );
}