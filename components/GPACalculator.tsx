"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Calculator, Plus, Trash2, GraduationCap } from "lucide-react";

interface GradeEntry {
  id: number;
  name: string;
  credits: number;
  grade: string;
}

const GRADE_POINTS: Record<string, number> = {
  "A": 4.0, "B+": 3.5, "B": 3.0, "C+": 2.5, "C": 2.0, "D+": 1.5, "D": 1.0, "F": 0.0,
};

const GRADE_OPTIONS = ["A", "B+", "B", "C+", "C", "D+", "D", "F"];

export default function GPACalculator() {
  const { lang } = useLang();
  const [entries, setEntries] = useState<GradeEntry[]>([
    { id: 1, name: "", credits: 3, grade: "A" },
  ]);
  const [nextId, setNextId] = useState(2);

  const addEntry = () => {
    setEntries([...entries, { id: nextId, name: "", credits: 3, grade: "A" }]);
    setNextId(nextId + 1);
  };

  const removeEntry = (id: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: number, field: keyof GradeEntry, value: string | number) => {
    setEntries(entries.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const gpa = (() => {
    let totalCredits = 0;
    let totalPoints = 0;
    entries.forEach((e) => {
      const pts = GRADE_POINTS[e.grade];
      if (pts !== undefined && e.credits > 0) {
        totalCredits += e.credits;
        totalPoints += pts * e.credits;
      }
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  })();

  const totalCredits = entries.reduce((sum, e) => sum + (e.credits > 0 ? e.credits : 0), 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator size={16} style={{ color: "var(--text-secondary)" }} />
          <span className="sec-title">{lang === "th" ? "คำนวณ GPA" : "GPA Calculator"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "GPAX" : "GPAX"}</div>
            <div className="text-[20px] font-bold" style={{ color: "var(--blue)" }}>{gpa}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "หน่วยกิตรวม" : "Total Credits"}</div>
            <div className="text-[20px] font-bold">{totalCredits}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {/* Header */}
        <div className="grid grid-cols-[1fr_60px_70px_36px] gap-2 px-2">
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "วิชา" : "Subject"}</span>
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "หน่วยกิต" : "Credits"}</span>
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{lang === "th" ? "เกรด" : "Grade"}</span>
          <span />
        </div>

        {entries.map((e) => (
          <div key={e.id} className="grid grid-cols-[1fr_60px_70px_36px] gap-2 items-center">
            <input
              type="text"
              value={e.name}
              onChange={(ev) => updateEntry(e.id, "name", ev.target.value)}
              placeholder={lang === "th" ? "ชื่อวิชา" : "Subject name"}
              className="input !py-2 !text-[13px]"
            />
            <input
              type="number"
              min="0"
              max="10"
              value={e.credits}
              onChange={(ev) => updateEntry(e.id, "credits", parseInt(ev.target.value) || 0)}
              className="input !py-2 !text-[13px] text-center"
            />
            <select
              value={e.grade}
              onChange={(ev) => updateEntry(e.id, "grade", ev.target.value)}
              className="select !py-2 !text-[13px]"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(1)})</option>
              ))}
            </select>
            <button
              onClick={() => removeEntry(e.id)}
              className="icon-btn-sm danger"
              disabled={entries.length <= 1}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addEntry} className="btn btn-ghost w-full !text-[13px]">
        <Plus size={14} /> {lang === "th" ? "เพิ่มวิชา" : "Add Subject"}
      </button>
    </div>
  );
}
