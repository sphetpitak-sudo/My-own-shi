"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import type { SavingsGoal } from "@/lib/types";
import SavingsGoalForm from "./SavingsGoalForm";
import SavingsGoalCard from "./SavingsGoalCard";
import { Target, Plus, X, PiggyBank } from "lucide-react";

interface Props {
  goals: SavingsGoal[];
  onSaved: () => void;
  toast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function SavingsGoalList({ goals, onSaved, toast }: Props) {
  const { t, lang } = useLang();
  const [showForm, setShowForm] = useState(false);

  if (goals.length === 0 && !showForm) {
    return (
      <div className="card empty animate-in d1">
        <div className="empty-icon"><PiggyBank size={24} /></div>
        <div className="empty-title">{t.no_goals}</div>
        <div className="empty-sub">{t.create_first_goal}</div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3">
          <Plus size={15} /> {t.new_goal}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <SavingsGoalForm onSaved={() => { onSaved(); setShowForm(false); toast(t.goal_created, "success"); }} onClose={() => setShowForm(false)} />
      )}

      {!showForm && (
        <div className="flex items-center justify-between animate-in">
          <h3 className="sec-title flex items-center gap-2">
            <Target size={16} style={{ color: "var(--text-muted)" }} />
            {goals.length} {lang === "th" ? "เป้าหมาย" : "goals"}
          </h3>
          <button onClick={() => setShowForm(true)} className="btn btn-primary !py-2 !px-3.5 !text-[13px]">
            <Plus size={15} /> {t.new_goal}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <SavingsGoalCard key={goal.id} goal={goal} onSaved={onSaved} toast={toast} />
        ))}
      </div>
    </div>
  );
}