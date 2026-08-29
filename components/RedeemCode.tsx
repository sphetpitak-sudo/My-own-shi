"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Check, AlertCircle } from "lucide-react";

export default function RedeemCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRedeem = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_code", { p_code: normalized });
    if (error) {
      const msg = error.message;
      if (msg.includes("Invalid code")) setMessage({ type: "error", text: "โค้ดไม่ถูกต้อง" });
      else if (msg.includes("expired")) setMessage({ type: "error", text: "โค้ดหมดอายุแล้ว" });
      else if (msg.includes("fully redeemed")) setMessage({ type: "error", text: "โค้ดถูกใช้ครบจำนวนแล้ว" });
      else if (msg.includes("Already claimed")) setMessage({ type: "error", text: "คุณใช้โค้ดนี้ไปแล้ว" });
      else if (msg.includes("Unauthorized")) setMessage({ type: "error", text: "กรุณาเข้าสู่ระบบใหม่" });
      else setMessage({ type: "error", text: msg || "ไม่สามารถแลกได้" });
    } else {
      setMessage({ type: "success", text: `แลกสำเร็จ ได้รับ ${data} แต้ม` });
      setCode("");
      // points will update via Realtime
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="card p-6">
      <div className="sec-title mb-1 flex items-center gap-2"><Ticket size={16} /> แลกโค้ด</div>
      <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>กรอกโค้ดที่ได้รับจากแอดมินเพื่อรับแต้ม (1 คนใช้ได้ 1 ครั้ง)</p>

      {message && (
        <div
          className="flex items-center gap-2 p-3.5 rounded-xl text-[13px] font-medium mb-4 animate-in"
          style={{
            background: message.type === "success" ? "var(--green-soft)" : "var(--red-soft)",
            color: message.type === "success" ? "var(--green)" : "var(--red)",
            border: `1px solid ${message.type === "success" ? "rgba(45,122,79,0.1)" : "rgba(194,65,48,0.1)"}`,
          }}
        >
          {message.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="กรอกโค้ด เช่น WELCOME100"
          className="input flex-1"
          style={{ textTransform: "uppercase" }}
          maxLength={20}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
        />
        <button onClick={handleRedeem} disabled={loading || !code.trim()} className="btn btn-primary whitespace-nowrap">
          {loading ? "กำลังแลก..." : "แลก"}
        </button>
      </div>
    </div>
  );
}
