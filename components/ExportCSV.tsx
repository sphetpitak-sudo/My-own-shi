"use client";

import { useLang } from "@/lib/i18n";
import type { Assignment, Subject } from "@/lib/types";
import { Download } from "lucide-react";

interface Props {
  assignments: Assignment[];
  subjects: Subject[];
}

export default function ExportCSV({ assignments, subjects }: Props) {
  const { lang } = useLang();
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

  return (
    <button onClick={handleExport} className="btn btn-ghost !text-[13px]">
      <Download size={14} /> {lang === "th" ? "ส่งออก CSV" : "Export CSV"}
    </button>
  );
}
