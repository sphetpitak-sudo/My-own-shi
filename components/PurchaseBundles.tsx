"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Coins, Sparkles, Check, Zap } from "lucide-react";

const BUNDLES = [
  { thb: 19, pts: 25, label: "เลี้ยงชา", bonus: "☕" , popular: false },
  { thb: 49, pts: 70, label: "เติมเบา", bonus: "+5", popular: false },
  { thb: 99, pts: 120, label: "ยอดนิยม", bonus: "+21", popular: true },
  { thb: 199, pts: 280, label: "คุ้มค่า", bonus: "+82", popular: false },
  { thb: 399, pts: 650, label: "พรีเมียม", bonus: "+251", popular: false },
];

export default function PurchaseBundles({ userId, onPurchased }: { userId: string; onPurchased?: (pts:number)=>void }) {
  const [loading, setLoading] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (b: typeof BUNDLES[number]) => {
    setLoading(b.thb);
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();
      const { data, error: rpcErr } = await supabase.rpc("create_mock_purchase", { p_amount_thb: b.thb, p_points: b.pts });
      if (rpcErr) throw new Error(rpcErr.message);
      setSuccess(`เติมสำเร็จ +${b.pts} แต้ม`);
      onPurchased?.(b.pts);
      setTimeout(()=>setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "ไม่สามารถเติมได้");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-extrabold" style={{ color:"var(--text)"}}>เติมแต้ม</h3>
        <span className="text-[11px] px-2 py-1 rounded-full font-bold" style={{ background:"var(--amber-soft)", color:"var(--amber)"}}>Mock • ไม่ตัดเงินจริง</span>
      </div>
      <p className="text-[12px]" style={{ color:"var(--text-muted)"}}>ทดสอบระบบเติมแต้ม — กดแล้วได้แต้มทันที (PromptPay/Stripe จริงจะมาในเฟสหน้า)</p>
      {success && <div className="p-3 rounded-xl text-[13px] font-semibold flex items-center gap-2" style={{ background:"var(--green-soft)", color:"var(--green)"}}><Check size={14}/> {success}</div>}
      {error && <div className="p-3 rounded-xl text-[13px]" style={{ background:"var(--red-soft)", color:"var(--red)"}}>{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUNDLES.map(b=>(
          <button key={b.thb} onClick={()=>handleBuy(b)} disabled={loading!==null} className="card p-4 text-left relative overflow-hidden hover:border-[var(--primary)] transition-all">
            {b.popular && <span className="absolute top-2 right-2 text-[9px] font-extrabold px-2 py-1 rounded-full" style={{ background:"var(--primary)", color:"white"}}>ยอดนิยม</span>}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: b.popular? "linear-gradient(135deg,#f6c944,#b8942a)":"var(--primary-soft)", color: b.popular?"#3a2a00":"var(--primary)"}}><Coins size={18}/></div>
              <div>
                <div className="text-[15px] font-extrabold flex items-center gap-1" style={{ color:"var(--text)"}}>{b.pts} แต้ม {b.bonus && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background:"var(--gold-soft)", color:"var(--gold)"}}>{b.bonus}</span>}</div>
                <div className="text-[12px]" style={{ color:"var(--text-muted)"}}>{b.label} • {b.thb} ฿</div>
              </div>
            </div>
            <div className="mt-3">
              {loading===b.thb ? (
                <span className="text-[12px] font-bold" style={{ color:"var(--text-muted)"}}>กำลังเติม...</span>
              ) : (
                <span className="btn btn-primary w-full text-[13px] py-2 justify-center"><Zap size={14}/> เติม {b.thb} ฿</span>
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-center" style={{ color:"var(--text-muted)"}}>เติมแล้วแต้มเข้าทันที ดูประวัติได้ที่ธุรกรรม</p>
    </div>
  );
}
