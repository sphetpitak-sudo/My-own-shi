"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Utensils, Bus, BookOpen, Gamepad2, Banknote, Gift, Box } from "lucide-react";

const CAT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, transport: Bus, study: BookOpen, entertainment: Gamepad2,
  salary: Banknote, gift: Gift, other: Box,
};

const WEEKDAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
}

export default function CalendarView({ transactions, onEdit }: Props) {
  const { t, lang } = useLang();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = lang === "th" ? WEEKDAYS_TH : WEEKDAYS_EN;
  const monthName = lang === "th" ? MONTHS_TH[month] : MONTHS_EN[month];

  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    });
    return map;
  }, [transactions]);

  const selectedTransactions = selectedDate ? transactionsByDate[selectedDate] || [] : [];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const navigate = (dir: number) => {
    const next = new Date(year, month + dir, 1);
    setCurrentDate(next);
    setSelectedDate(null);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 animate-in">
      {/* Calendar Card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="icon-btn-sm"><ChevronLeft size={18} /></button>
          <h3 className="text-[16px] font-bold">{monthName} {year + 543}</h3>
          <button onClick={() => navigate(1)} className="icon-btn-sm"><ChevronRight size={18} /></button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--text-muted)" }}>
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTx = transactionsByDate[dateStr] || [];
            const hasIncome = dayTx.some((tx) => tx.type === "income");
            const hasExpense = dayTx.some((tx) => tx.type === "expense");
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className="relative flex flex-col items-center py-2 rounded-lg transition-all"
                style={{
                  background: isSelected ? "var(--primary)" : isToday ? "var(--blue-soft)" : "transparent",
                  color: isSelected ? "var(--text-invert)" : "var(--text)",
                  fontWeight: isToday || isSelected ? 700 : 500,
                }}
              >
                <span className="text-[13px]">{day}</span>
                {(hasIncome || hasExpense) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasIncome && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "var(--green)" }} />}
                    {hasExpense && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "var(--red)" }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Transactions */}
      {selectedDate && (
        <div className="card p-5 animate-in">
          <h3 className="sec-title mb-3">
            {selectedDate}
            {selectedTransactions.length > 0 && (
              <span className="text-[12px] font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                {selectedTransactions.length} {lang === "th" ? "รายการ" : "items"}
              </span>
            )}
          </h3>
          {selectedTransactions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>{t.no_transactions}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTransactions.map((tx) => {
                const CatIcon = CAT_ICONS[tx.category] || Box;
                return (
                  <div key={tx.id} className="list-item group cursor-pointer" onClick={() => onEdit(tx)}>
                    <div className="item-icon" style={{ background: tx.type === "income" ? "var(--green-soft)" : "var(--red-soft)" }}>
                      {tx.type === "income"
                        ? <ArrowDownLeft size={17} style={{ color: "var(--green)" }} />
                        : <ArrowUpRight size={17} style={{ color: "var(--red)" }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CatIcon size={14} style={{ color: "var(--text-muted)" }} />
                        <span className="font-semibold text-[14px]">{t[tx.category as keyof typeof t]}</span>
                      </div>
                      {tx.note && <span className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>{tx.note}</span>}
                    </div>
                    <span className="font-bold text-[14px] tabular-nums" style={{ color: tx.type === "income" ? "var(--green)" : "var(--red)" }}>
                      {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}