"use client";

import { useRef } from "react";
import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { Download, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
  userId: string;
  onImport: () => void;
}

export default function ExportCSV({ assignments, subjects, userId, onImport }: Props) {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  function parseCSV(text: string): Record<string, string>[] {
    const lines: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of text) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "\n" && !inQuotes) { lines.push(current); current = ""; continue; }
      current += char;
    }
    if (current) lines.push(current);

    if (lines.length < 2) return [];
    const hdrs = lines[0].split(",").map(h => h.trim().toLowerCase());

    return lines.slice(1).map(line => {
      const values: string[] = [];
      let val = "";
      let inQ = false;
      for (const c of line) {
        if (c === '"') { inQ = !inQ; continue; }
        if (c === "," && !inQ) { values.push(val); val = ""; continue; }
        val += c;
      }
      values.push(val);
      const row: Record<string, string> = {};
      hdrs.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
      return row;
    });
  }

  const handleExport = () => {
    const headers = [
      lang === "th" ? "ชื่องาน" : "Title",
      lang === "th" ? "วิชา" : "Subject",
      lang === "th" ? "ความสำคัญ" : "Priority",
      lang === "th" ? "สถานะ" : "Status",
      lang === "th" ? "กำหนดส่ง" : "Due Date",
      lang === "th" ? "เวลาที่คาด" : "Est. Minutes",
      lang === "th" ? "เวลาจริง" : "Actual Minutes",
      lang === "th" ? "งานย่อย" : "Subtasks",
      lang === "th" ? "ทำซ้ำ" : "Recurring",
      lang === "th" ? "แท็ก" : "Tags",
    ];
    const rows = assignments.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      a.subject_id ? subjectMap[a.subject_id] || "" : "",
      a.priority,
      a.status,
      a.due_date || "",
      a.estimated_minutes || "",
      a.status === "done" ? a.updated_at.slice(0, 10) : "",
      "",
      "",
      "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `studyhub-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);

    for (const row of rows) {
      await supabase.from("assignments").insert({
        user_id: userId,
        title: row.title || "Imported",
        description: row.description || "",
        due_date: row.due_date || null,
        priority: row.priority || "medium",
        status: row.status || "pending",
        estimated_minutes: parseInt(row.estimated_minutes) || null,
      });
    }
    onImport();
    toast(t.import_successful, "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleExport} className="btn btn-ghost !text-[13px]">
        <Download size={14} /> {t.export_csv}
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost !text-[13px]">
        <Upload size={14} /> {t.import_csv}
      </button>
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
    </div>
  );
}
