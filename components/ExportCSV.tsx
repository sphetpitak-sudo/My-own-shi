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
  const { lang } = useLang();
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));

  const handleExport = () => {
    const headers = ["Title", "Subject", "Priority", "Status", "Due Date", "Estimated Minutes", "Created", "Completed"];
    const rows = assignments.map((a) => [
      `"${a.title.replace(/"/g, '""')}"`,
      a.subject_id ? subjectMap[a.subject_id] || "" : "",
      a.priority,
      a.status,
      a.due_date || "",
      a.estimated_minutes || "",
      a.created_at.slice(0, 10),
      a.status === "done" ? a.updated_at.slice(0, 10) : "",
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
    const lines = text.split("\n").filter((l) => l.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = values[j] || ""; });

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
    toast(lang === "th" ? "นำเข้าสำเร็จ" : "Import successful", "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleExport} className="btn btn-ghost !text-[13px]">
        <Download size={14} /> {lang === "th" ? "ส่งออก CSV" : "Export CSV"}
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost !text-[13px]">
        <Upload size={14} /> {lang === "th" ? "นำเข้า CSV" : "Import CSV"}
      </button>
      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
    </div>
  );
}
