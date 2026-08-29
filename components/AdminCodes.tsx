"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ticket, Plus, Trash2, Copy, Check, Calendar, Hash, Users } from "lucide-react";
import type { RedeemCode } from "@/lib/types";
import LoadingSkeleton from "./LoadingSkeleton";

export default function AdminCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [points, setPoints] = useState(50);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("redeem_codes").select("*").order("created_at", { ascending: false });
    if (data) setCodes(data as RedeemCode[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(normalized)) {
      setError("โค้ดต้องเป็น A-Z, 0-9, _ , - ยาว 3-20 ตัว");
      return;
    }
    if (points < 1 || points > 1000) {
      setError("แต้มต้องอยู่ระหว่าง 1-1000");
      return;
    }
    setCreating(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.rpc("create_redeem_code", {
      p_code: normalized,
      p_points: points,
      p_max_uses: maxUses ? parseInt(maxUses) : null,
      p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    if (err) {
      setError(mapError(err.message));
    } else {
      setCode("");
      setMaxUses("");
      setExpiresAt("");
      await load();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบโค้ดนี้? ผู้ใช้ที่ยังไม่ได้ใช้จะใช้ไม่ได้อีก")) return;
    const supabase = createClient();
    const { error: err } = await supabase.rpc("delete_redeem_code", { p_id: id });
    if (err) {
      setError(mapError(err.message));
    } else {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const copy = async (c: string) => {
    await navigator.clipboard.writeText(c);
    setCopied(c);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) return <LoadingSkeleton variant="list" />;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="page-header mb-6">
          <div>
            <h1 className="page-title">โค้ดแลกแต้ม</h1>
            <p className="page-sub">สร้างโค้ดให้ผู้ใช้กรอกที่หน้า ตั้งค่า · 1 คนใช้ได้ 1 ครั้ง</p>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <h2 className="sec-title mb-4 flex items-center gap-2"><Ticket size={16} /> สร้างโค้ดใหม่</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">โค้ด *</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME100" className="input" maxLength={20} style={{ textTransform: "uppercase" }} />
              <span className="text-[11px] text-muted">A-Z, 0-9, _ , - เท่านั้น</span>
            </div>
            <div className="field">
              <label className="label">แต้ม *</label>
              <input type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} className="input" />
            </div>
            <div className="field">
              <label className="label">จำนวนครั้งที่ใช้ได้ (ว่าง = ไม่จำกัด)</label>
              <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="ว่าง = ไม่จำกัด" className="input" />
            </div>
            <div className="field">
              <label className="label">วันหมดอายุ (ว่าง = ไม่หมดอายุ)</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input" />
            </div>
          </div>
          {error && <div className="mt-4 p-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{error}</div>}
          <button onClick={handleCreate} disabled={creating || !code.trim()} className="btn btn-primary mt-4 w-full sm:w-auto">
            {creating ? "กำลังสร้าง..." : <><Plus size={14} /> สร้างโค้ด</>}
          </button>
        </div>

        <div className="card">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="sec-title">โค้ดทั้งหมด ({codes.length})</h2>
          </div>
          {codes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><Ticket size={22} /></div>
              <div className="empty-title">ยังไม่มีโค้ด</div>
              <div className="empty-sub">สร้างโค้ดแรกได้จากฟอร์มด้านบน</div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {codes.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const fullyUsed = c.max_uses !== null && c.uses_count >= c.max_uses;
                return (
                  <div key={c.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[14px] font-bold px-2 py-1 rounded-lg" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>{c.code}</span>
                        <button onClick={() => copy(c.code)} className="icon-btn-sm">{copied === c.code ? <Check size={14} /> : <Copy size={14} />}</button>
                        {expired && <span className="badge badge-red">หมดอายุ</span>}
                        {fullyUsed && !expired && <span className="badge badge-amber">ครบจำนวน</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[12px] text-muted flex-wrap">
                        <span className="flex items-center gap-1"><Hash size={12} /> +{c.points} แต้ม</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {c.uses_count}{c.max_uses !== null ? `/${c.max_uses}` : ""} ครั้ง</span>
                        {c.expires_at && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(c.expires_at).toLocaleDateString("th-TH")}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="icon-btn-sm danger"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapError(msg: string): string {
  if (msg.includes("Invalid code")) return "รูปแบบโค้ดไม่ถูกต้อง";
  if (msg.includes("Invalid points")) return "จำนวนแต้มไม่ถูกต้อง";
  if (msg.includes("Unauthorized")) return "คุณไม่มีสิทธิ์";
  if (msg.includes("duplicate") || msg.includes("already exists")) return "โค้ดนี้มีอยู่แล้ว";
  return msg || "เกิดข้อผิดพลาด";
}
