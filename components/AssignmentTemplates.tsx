"use client";

import { useLang } from "@/lib/i18n";
import { FileText, BookOpen, FlaskConical, Calculator, Globe, PenTool, Presentation } from "lucide-react";

interface Template {
  icon: typeof FileText;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  descriptionEn: string;
  defaultPriority: "low" | "medium" | "high";
  estimatedMinutes: number;
}

const TEMPLATES: Template[] = [
  { icon: PenTool, nameTh: "รายงาน/ essay", nameEn: "Report/Essay", descriptionTh: "เขียนรายงานหรือบทความ", descriptionEn: "Write a report or essay", defaultPriority: "high", estimatedMinutes: 120 },
  { icon: Calculator, nameTh: "แบบฝึกหัดคณิต", nameEn: "Math Worksheet", descriptionTh: "ทำการบ้านคณิตศาสตร์", descriptionEn: "Complete math exercises", defaultPriority: "medium", estimatedMinutes: 45 },
  { icon: FlaskConical, nameTh: "รายงานปฏิบัติการ", nameEn: "Lab Report", descriptionTh: "เขียนรายงานการทดลอง", descriptionEn: "Write lab report", defaultPriority: "high", estimatedMinutes: 90 },
  { icon: BookOpen, nameTh: "อ่านหนังสือ", nameEn: "Reading", descriptionTh: "อ่านหนังสือตามบทที่กำหนด", descriptionEn: "Read assigned chapters", defaultPriority: "low", estimatedMinutes: 60 },
  { icon: Globe, nameTh: "งานกลุ่ม", nameEn: "Group Project", descriptionTh: "ทำงานกลุ่มร่วมกับเพื่อน", descriptionEn: "Collaborate with classmates", defaultPriority: "high", estimatedMinutes: 180 },
  { icon: Presentation, nameTh: "นำเสนอ", nameEn: "Presentation", descriptionTh: "เตรียมpresentation นำเสนอ", descriptionEn: "Prepare presentation slides", defaultPriority: "medium", estimatedMinutes: 90 },
  { icon: FileText, nameTh: "สรุปเนื้อหา", nameEn: "Summary Notes", descriptionTh: "สรุปเนื้อหาที่เรียน", descriptionEn: "Summarize lecture content", defaultPriority: "low", estimatedMinutes: 30 },
];

interface Props {
  onSelect: (template: { title: string; description: string; priority: "low" | "medium" | "high"; estimatedMinutes: number }) => void;
}

export default function AssignmentTemplates({ onSelect }: Props) {
  const { t, lang } = useLang();

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} style={{ color: "var(--text-secondary)" }} />
        <span className="sec-title">{t.quick_templates}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <button
              key={tpl.nameEn}
              onClick={() => onSelect({
                title: lang === "th" ? tpl.nameTh : tpl.nameEn,
                description: lang === "th" ? tpl.descriptionTh : tpl.descriptionEn,
                priority: tpl.defaultPriority,
                estimatedMinutes: tpl.estimatedMinutes,
              })}
              className="p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <Icon size={16} style={{ color: "var(--text-secondary)" }} className="mb-2" />
              <div className="text-[12px] font-semibold truncate">{lang === "th" ? tpl.nameTh : tpl.nameEn}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                ~{tpl.estimatedMinutes}{t.minutes_placeholder}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
