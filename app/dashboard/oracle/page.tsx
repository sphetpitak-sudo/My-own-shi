"use client";

import DashboardShell from "@/components/DashboardShell";
import { Eye, Lock, Sparkles } from "lucide-react";

export default function OraclePage() {
  return (
    <DashboardShell>
      <div className="reading-page">
        <div className="coming-soon-page">
          <div
            className="relative"
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -10,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(244,114,182,0.20), transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <div
              className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(160deg, rgba(244,114,182,0.16), rgba(236,72,153,0.06))",
                border: "1px solid rgba(244,114,182,0.25)",
                color: "#f472b6",
              }}
            >
              <Eye size={32} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(244,114,182,0.10)",
              color: "#f472b6",
              border: "1px solid rgba(244,114,182,0.2)",
            }}
          >
            <Lock size={10} /> เร็ว ๆ นี้
          </div>

          <h1 className="coming-soon-title">ไพ่ลางสังหรณ์ (Oracle)</h1>
          <p className="coming-soon-sub">
            ไพ่ออราเคิลให้ข้อความสั้นกระชับ เน้นความรู้สึกและสัญชาตญาณ
            <br />
            เรากำลังเตรียมสำรับไพ่ใหม่และระบบตีความเฉพาะทาง
          </p>

          <div
            className="card p-4 max-w-[320px] text-left"
            style={{ background: "var(--bg-card)" }}
          >
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
              style={{ color: "#f472b6" }}
            >
              จะมีอะไรบ้าง
            </div>
            <ul className="text-[13px] space-y-1.5" style={{ color: "var(--text-secondary)" }}>
              <li className="flex items-start gap-2">
                <Sparkles size={12} className="flex-shrink-0 mt-1" style={{ color: "#f472b6" }} />
                สำรับไพ่ออราเคิลหลายชุด (แสงจันทร์, ธาตุทั้งสี่, ลางสังหรณ์)
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={12} className="flex-shrink-0 mt-1" style={{ color: "#f472b6" }} />
                ข้อความสั้นกระชับพร้อมคำอธิบายเชิงลึกจาก AI
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={12} className="flex-shrink-0 mt-1" style={{ color: "#f472b6" }} />
                ประสบการณ์ที่ผ่อนคลายและเป็นส่วนตัว
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
