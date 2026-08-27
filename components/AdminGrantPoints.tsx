"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { X, Plus, Minus, Check } from "lucide-react";

interface Props {
  user: Profile;
  onClose: () => void;
  onGrant: () => void;
}

export default function AdminGrantPoints({ user, onClose, onGrant }: Props) {
  const [mode, setMode] = useState<"grant" | "deduct">("grant");
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (amount <= 0) { setError("จำนวนต้องมากกว่า 0"); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user: admin } } = await supabase.auth.getUser();
    if (!admin) { setError("กรุณาเข้าสู่ระบบใหม่"); setLoading(false); return; }

    const delta = mode === "grant" ? amount : -amount;

    // Use atomic increment_points RPC (has balance floor check)
    const { error: rpcErr } = await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: delta,
    });

    if (rpcErr) {
      if (rpcErr.message.includes("Insufficient points")) {
        setError("คะแนนไม่พอสำหรับการหัก");
      } else {
        setError("ไม่สามารถดำเนินการได้ กรุณาลองใหม่");
      }
      setLoading(false);
      return;
    }

    const { error: txErr } = await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount: delta,
      type: "admin_grant",
      description: reason || (mode === "grant" ? "Admin grant" : "Admin deduction"),
      admin_id: admin.id,
    });

    if (txErr) { setError(txErr.message); setLoading(false); return; }

    onGrant();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm card p-6 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold">ให้คะแนน</h2>
          <button onClick={onClose} className="icon-btn-sm"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--bg)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold" style={{ background: "var(--primary)", color: "var(--text-invert)" }}>
            {(user.display_name || "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] font-semibold">{user.display_name || "Unnamed"}</div>
            <div className="text-[12px] text-muted">ปัจจุบัน: {user.points} แต้ม</div>
          </div>
        </div>

        <div className="segmented w-full mb-4">
          <button
            className={`segmented-item flex-1 flex items-center justify-center gap-1.5 ${mode === "grant" ? "active" : ""}`}
            onClick={() => setMode("grant")}
          >
            <Plus size={14} /> ให้คะแนน
          </button>
          <button
            className={`segmented-item flex-1 flex items-center justify-center gap-1.5 ${mode === "deduct" ? "active" : ""}`}
            onClick={() => setMode("deduct")}
          >
            <Minus size={14} /> หักคะแนน
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <div className="field mb-3">
          <label className="label">จำนวน</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="input"
          />
        </div>

        <div className="field mb-5">
          <label className="label">เหตุผล (ไม่บังคับ)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
            placeholder={mode === "grant" ? "ให้คะแนน" : "หักคะแนน"}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">ยกเลิก</button>
          <button
            onClick={handleConfirm}
            disabled={loading || amount <= 0}
            className="btn btn-primary flex-1"
          >
            {loading ? "กำลังดำเนินการ..." : (
              <><Check size={15} /> ยืนยัน</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
