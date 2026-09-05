"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALL_CARDS } from "@/lib/cards";
import { Sparkles } from "lucide-react";
import { useDialogFocus } from "./ui/useDialogFocus";

interface Props {
  userId: string;
}

export default function CardCollection({ userId }: Props) {
  const [cardsData, setCardsData] = useState<Array<{ cardId: number; reversed: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"major"|"cups"|"wands"|"swords"|"pentacles">("all");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("readings").select("cards").eq("user_id", userId).then(({ data }: { data: { cards: unknown }[] | null }) => {
      const all: Array<{ cardId:number; reversed:boolean }> = [];
      (data || []).forEach((r: { cards: unknown }) => {
        if (Array.isArray(r.cards)) {
          r.cards.forEach((c: unknown) => {
            const o = c as Record<string, unknown>;
            if (typeof o.cardId === "number") all.push({ cardId: o.cardId, reversed: !!o.reversed });
            else if (o.card && typeof (o.card as { id?: number }).id === "number") {
              const inner = o.card as { id:number };
              all.push({ cardId: inner.id, reversed: !!o.reversed });
            }
          });
        }
      });
      setCardsData(all);
      setLoading(false);
    });
  }, [userId]);

  const stats = useMemo(() => {
    const counts = new Map<number, number>();
    const reversedCounts = new Map<number, number>();
    let reversed = 0;
    const suitCounts: Record<string, number> = { major:0, cups:0, wands:0, swords:0, pentacles:0 };
    cardsData.forEach(({ cardId, reversed: rev }) => {
      counts.set(cardId, (counts.get(cardId)||0)+1);
      if (rev) { reversed++; reversedCounts.set(cardId, (reversedCounts.get(cardId)||0)+1); }
      const card = ALL_CARDS.find(c=>c.id===cardId);
      if (card) suitCounts[card.suit] = (suitCounts[card.suit]||0)+1;
    });
    const unique = counts.size;
    const most = [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,c])=>({ card: ALL_CARDS.find(x=>x.id===id)!, count:c }));
    const total = cardsData.length;
    return { unique, total, counts, reversed, reversedRatio: total? Math.round(reversed/total*100):0, suitCounts, most };
  }, [cardsData]);

  const filteredCards = filter==="all" ? ALL_CARDS : ALL_CARDS.filter(c=>c.suit===filter);

  if (loading) return <div className="shimmer" style={{ height: 160, borderRadius: 16 }} />;

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="card p-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>สะสมแล้ว</div>
          <div className="text-[20px] font-extrabold">{stats.unique}<span className="text-[12px] font-semibold" style={{ color:"var(--text-muted)" }}>/78</span></div>
          <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: "var(--border)" }}><div className="h-full" style={{ width: `${(stats.unique/78*100)}%`, background: "var(--gold)" }} /></div>
        </div>
        <div style={{ borderLeft:"1px solid var(--border-subtle)", borderRight:"1px solid var(--border-subtle)"}}>
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>เปิดทั้งหมด</div>
          <div className="text-[20px] font-extrabold">{stats.total}</div>
          <div className="text-[11px]" style={{ color:"var(--text-muted)" }}>{stats.reversedRatio}% กลับหัว</div>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>ไพ่เด่น</div>
          {stats.most[0] ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[12px] font-bold truncate w-full px-2">{stats.most[0].card.nameTh}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background:"var(--gold-soft)", color:"var(--gold)" }}>{stats.most[0].count} ครั้ง</span>
            </div>
          ) : <span className="text-[11px]" style={{ color:"var(--text-muted)" }}>ยังไม่มี</span>}
        </div>
      </div>

      {/* Suit distribution */}
      <div className="flex gap-1.5 flex-wrap">
        {(["major","cups","wands","swords","pentacles"] as const).map(suit=>{
          const count = stats.suitCounts[suit]||0;
          const max = Math.max(1, ...Object.values(stats.suitCounts));
          return (
            <div key={suit} className="flex-1 min-w-[90px] card p-2.5 text-center">
              <div className="text-[10px] font-bold uppercase" style={{ color:"var(--text-muted)" }}>{suit}</div>
              <div className="text-[13px] font-extrabold">{count}</div>
              <div className="h-1 rounded-full mt-1" style={{ background:"var(--border)" }}><div className="h-full rounded-full" style={{ width: `${count/max*100}%`, background: "var(--primary)" }} /></div>
            </div>
          );
        })}
      </div>

      {/* Filter — Thai labels, 12px baseline */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scroll-row-touch" style={{ scrollbarWidth: "none" }}>
        {(["all","major","cups","wands","swords","pentacles"] as const).map(k=>{
          const label = k==="all"?"ทั้งหมด":k==="major"?"เมเจอร์":k==="cups"?"ถ้วย":k==="wands"?"ไม้เท้า":k==="swords"?"ดาบ":"เหรียญ";
          return <button key={k} onClick={()=>setFilter(k)} aria-pressed={filter===k} className="touch-hit px-3 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap border" style={{ background: filter===k? "var(--primary)":"var(--bg-card)", color: filter===k?"white":"var(--text-secondary)", borderColor: filter===k?"var(--primary)":"var(--border)" }}>{label}</button>;
        })}
      </div>

      {/* Grid — 2 cols on 320, 3 on 375, 4 on sm, 6 on md, generous gap */}
      <div className="grid grid-cols-2 min-[375px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {filteredCards.map(card=>{
          const count = stats.counts.get(card.id)||0;
          const discovered = count>0;
          return (
            <button key={card.id} onClick={()=> discovered && setSelected(card.id)} className={`group card p-2.5 flex flex-col items-center gap-2 ${discovered? "hover:border-[var(--primary)] hover:shadow-sm cursor-pointer":"opacity-45 grayscale-[0.3]"}`} style={{ background: discovered? "var(--bg-card)":"color-mix(in srgb, var(--bg) 80%, transparent)"}}>
              <div className="relative w-full aspect-[2/3] max-w-[96px] mx-auto">
                {discovered ? (
                  <picture className="block w-full h-full">
                    <source srcSet={`/Taro/${card.imageFile.replace(/\.jpg$/i, ".webp")}`} type="image/webp" />
                    <img src={`/Taro/${card.imageFile}`} alt={card.nameTh} className="w-full h-full object-contain rounded-md" loading="lazy" decoding="async" />
                  </picture>
                ) : (
                  <div className="w-full h-full rounded-md grid place-items-center" style={{ background:"linear-gradient(160deg,#1d0e38,#0a0614)", border:"1px solid var(--border)"}}><Sparkles size={16} style={{ color:"var(--text-muted)"}} /></div>
                )}
                {discovered && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shadow-sm" style={{ background:"var(--gold)", color:"#261a00"}}>{count}</span>}
              </div>
              <span className="text-[11px] font-bold leading-tight text-center line-clamp-1" style={{ color:"var(--text)"}}>{card.nameTh}</span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color:"var(--text-muted)"}}>{card.suit}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (()=>{ const card = ALL_CARDS.find(c=>c.id===selected)!; const count = stats.counts.get(card.id)||0; return (
        <CardDetailModal
          cardNameTh={card.nameTh}
          onClose={()=>setSelected(null)}
        >
          <button onClick={()=>setSelected(null)} aria-label="ปิดหน้าต่างรายละเอียดไพ่" className="touch-hit absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-[var(--bg)]" style={{ color:"var(--text-muted)"}}><span className="text-[18px] leading-none" aria-hidden>×</span></button>
            <div className="flex gap-5">
              <picture className="block flex-shrink-0">
                <source srcSet={`/Taro/${card.imageFile.replace(/\.jpg$/i, ".webp")}`} type="image/webp" />
                <img src={`/Taro/${card.imageFile}`} alt={card.nameTh} className="w-[132px] h-[198px] object-contain rounded-lg shadow-sm" loading="lazy" decoding="async" style={{ background: "#0e0e14" }} />
              </picture>
              <div className="flex-1 min-w-0">
                <h3 className="text-[18px] font-extrabold leading-tight" style={{ color:"var(--text)"}}>{card.nameTh}</h3>
                <p className="text-[11.5px] font-medium mt-0.5" style={{ color:"var(--text-muted)"}}>{card.name} · {card.suit}</p>
                <div className="mt-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background:"var(--primary-soft)", color:"var(--primary)"}}>เปิด {count} ครั้ง</span>
                </div>
                <div className="mt-4 space-y-2.5 text-[13px] leading-[1.7]" style={{ color:"var(--text-secondary)"}}>
                  <div><span className="font-bold text-[12px] uppercase tracking-wide" style={{ color:"var(--text)"}}>หงาย · </span> {card.uprightTh}</div>
                  <div><span className="font-bold text-[12px] uppercase tracking-wide" style={{ color:"var(--text)"}}>กลับหัว · </span> {card.reversedTh}</div>
                </div>
              </div>
            </div>
          </CardDetailModal>
      );})()}
    </div>
  );
}

function CardDetailModal({
  cardNameTh,
  onClose,
  children,
}: {
  cardNameTh: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useDialogFocus<HTMLDivElement>(true, { onClose });
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="ปิด" tabIndex={-1} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`รายละเอียดไพ่ ${cardNameTh}`}
        className="relative card max-w-[440px] w-full p-6 max-h-[86vh] overflow-auto animate-fade"
        style={{ outline: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
