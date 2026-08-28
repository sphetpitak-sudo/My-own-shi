import LandingHero from "@/components/LandingHero";
import AuthForm from "@/components/AuthForm";
import { Sparkles, Layers, MessageCircleHeart, BookOpen, ShieldCheck, Clock3, Eye } from "lucide-react";

function LandingHowItWorks() {
  const steps = [
    {
      icon: MessageCircleHeart,
      title: "ตั้งคำถาม",
      desc: "เขียนสิ่งที่อยู่ในใจ — ความรัก งาน เงิน หรือภาพรวมชีวิต",
    },
    {
      icon: Layers,
      title: "เลือกไพ่",
      desc: "สับสำรับแบบพิธีกรรม แล้วเลือกไพ่ที่เรียกหาคุณ",
    },
    {
      icon: Sparkles,
      title: "รับคำทำนาย",
      desc: "AI หมอดูทิพย์อ่านไพ่ให้เชื่อมโยงเป็นเรื่องราวของคุณ",
    },
  ];
  return (
    <section className="relative z-10 bg-[var(--bg)] border-t border-[var(--border-subtle)]">
      <div className="max-w-[960px] mx-auto px-6 py-14 sm:py-16">
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--primary)" }}>
            วิธีการทำงาน
          </p>
          <h2 className="mt-2 text-[22px] sm:text-[26px] font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
            จากคำถามสู่คำตอบภายใน 2 นาที
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            ไม่ต้องนัด ไม่ต้องรอ — เปิดไพ่ได้ทันทีที่ต้องการคำตอบ
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-5 text-center relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: "var(--primary)" }} />
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid rgba(109,40,217,0.12)" }}>
                <s.icon size={18} />
              </div>
              <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                ขั้นตอนที่ {i + 1}
              </div>
              <h3 className="mt-1 text-[15px] font-bold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingSpreads() {
  const items = [
    { name: "ไพ่ใบเดียว", en: "Single", count: "1 ใบ · 5 แต้ม", desc: "คำตอบสั้น ชัด ตรงประเด็น" },
    { name: "ไพ่สามใบ", en: "Three Card", count: "3 ใบ · 15 แต้ม", desc: "อดีต · ปัจจุบัน · อนาคต" },
    { name: "กางเขนเคลติก", en: "Celtic Cross", count: "10 ใบ · 50 แต้ม", desc: "วิเคราะห์ลึกทุกมิติ" },
  ];
  return (
    <section className="relative z-10 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
      <div className="max-w-[960px] mx-auto px-6 py-12 sm:py-14">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight">เลือกรูปแบบที่เหมาะกับคำถาม</h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>ใช้ไพ่ Rider-Waite แท้ 78 ใบ</p>
          </div>
          <span className="badge badge-neutral">3 รูปแบบ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.name} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                  <BookOpen size={14} />
                </span>
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>{it.en}</span>
              </div>
              <h3 className="text-[15px] font-bold">{it.name}</h3>
              <p className="text-[12px] mt-1" style={{ color: "var(--gold)", fontWeight: 600 }}>{it.count}</p>
              <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingTrust() {
  return (
    <section className="relative z-10 bg-[var(--bg)] border-t border-[var(--border-subtle)]">
      <div className="max-w-[960px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}><ShieldCheck size={16} /></span>
            <p className="text-[12.5px] font-semibold">ปลอดภัย · ส่วนตัว</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>คำถามและการอ่านถูกเก็บเป็นความลับ</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}><Clock3 size={16} /></span>
            <p className="text-[12.5px] font-semibold">พร้อมเมื่อคุณต้องการ</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>เปิดไพ่ได้ทันที 24 ชั่วโมง</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}><Eye size={16} /></span>
            <p className="text-[12.5px] font-semibold">โปร่งใส · ยุติธรรม</p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>ใช้แต้มชัดเจน มีประวัติย้อนหลัง</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <LandingHero />
      <LandingHowItWorks />
      <LandingSpreads />
      <LandingTrust />
      <div id="auth" className="relative z-10 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]" style={{ scrollMarginTop: 24 }}>
        <div className="max-w-[960px] mx-auto px-6 py-10 sm:py-12">
          <div className="text-center mb-6">
            <h2 className="text-[20px] font-extrabold tracking-tight">พร้อมเปิดไพ่แล้วหรือยัง?</h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>เข้าสู่ระบบเพื่อเริ่มทำนายด้วย Sealo</p>
          </div>
          <AuthForm />
        </div>
      </div>
      <footer
        className="text-center px-6 pt-8 pb-10 border-t"
        style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)", background: "var(--bg)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Sealo</span>
          <div className="w-8 h-px" style={{ background: "var(--border)" }} />
        </div>
        <p className="text-[11px] leading-relaxed max-w-[520px] mx-auto">
          ไพ่ทาโรต์เป็นเครื่องมือสะท้อนความคิดและสัญชาตญาณ ไม่ใช่คำทำนายที่แน่นอน — ใช้วิจารณญาณในการตัดสินใจเสมอ
          <br />
          Sealo ใช้ AI เพื่อสร้างคำตีความเชิงสะท้อน ไม่ใช่ข้อเท็จจริงทางวิทยาศาสตร์
        </p>
        <p className="text-[10.5px] mt-3" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
          © {new Date().getFullYear()} Sealo · catarot.love
        </p>
      </footer>
    </main>
  );
}
