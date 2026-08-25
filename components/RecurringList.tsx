"use client";

import { useLang } from "@/lib/i18n";
import type { RecurringTransaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Pause, Play, Trash2, Repeat, ArrowDownLeft, ArrowUpRight, CalendarClock, CalendarOff, Utensils, Bus, BookOpen, Gamepad2, Banknote, Gift, Box } from "lucide-react";

const CAT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, transport: Bus, study: BookOpen, entertainment: Gamepad2,
  salary: Banknote, gift: Gift, other: Box,
};

const FREQ_LABELS: Record<string, Record<string, string>> = {
  daily: { th: "ทุกวัน", en: "Daily" },
  weekly: { th: "ทุกสัปดาห์", en: "Weekly" },
  monthly: { th: "ทุกเดือน", en: "Monthly" },
  yearly: { th: "ทุกปี", en: "Yearly" },
};

interface Props {
  items: RecurringTransaction[];
  onSaved: () => void;
  toast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function RecurringList({ items, onSaved, toast }: Props) {
  const { t, lang } = useLang();
  const supabase = createClient();

  const handleToggle = async (item: RecurringTransaction) => {
    await supabase.from("recurring_transactions").update({ active: !item.active }).eq("id", item.id);
    toast(t.recurring_updated, "success");
    onSaved();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("recurring_transactions").delete().eq("id", id);
    toast(t.recurring_deleted, "success");
    onSaved();
  };

  if (items.length === 0) {
    return (
      <div className="card empty animate-in d1">
        <div className="empty-icon"><Repeat size={24} /></div>
        <div className="empty-title">{t.no_recurring}</div>
        <div className="empty-sub">{t.create_first_recurring}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in">
      {items.map((item) => {
        const CatIcon = CAT_ICONS[item.category] || Box;
        return (
          <div key={item.id} className={`card px-4 py-3 flex items-center gap-3 ${!item.active ? "opacity-50" : ""}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: item.type === "income" ? "var(--green-soft)" : "var(--red-soft)" }}>
              {item.type === "income"
                ? <ArrowDownLeft size={17} style={{ color: "var(--green)" }} />
                : <ArrowUpRight size={17} style={{ color: "var(--red)" }} />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CatIcon size={14} style={{ color: "var(--text-muted)" }} />
                <span className="font-semibold text-[14px]">{t[item.category as keyof typeof t]}</span>
                {item.note && <span className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>· {item.note}</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <CalendarClock size={11} />
                  {item.next_date}
                </span>
                <span className="badge badge-blue text-[10px]">{FREQ_LABELS[item.frequency]?.[lang] || item.frequency}</span>
                {item.skip_weekends && (
                  <span className="badge text-[10px] flex items-center gap-1" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
                    <CalendarOff size={10} />
                    {t.skip_weekends}
                  </span>
                )}
              </div>
            </div>

            <span className="font-bold text-[14px] tabular-nums" style={{ color: item.type === "income" ? "var(--green)" : "var(--red)" }}>
              {item.type === "income" ? "+" : "-"}฿{item.amount.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
            </span>

            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleToggle(item)} className="icon-btn-sm" title={item.active ? t.pause : t.resume}>
                {item.active ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button onClick={() => handleDelete(item.id)} className="icon-btn-sm danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}