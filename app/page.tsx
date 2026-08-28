import LandingHero from "@/components/LandingHero";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  return (
    <main>
      <LandingHero />
      <div id="auth" className="relative z-10 -mt-6" style={{ scrollMarginTop: 24 }}>
        <AuthForm />
      </div>
      <footer
        className="text-center px-6 pt-4 pb-10"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Sealo</span>
          <div className="w-8 h-px" style={{ background: "var(--border)" }} />
        </div>
        <p className="text-[11px] leading-relaxed">
          ไพ่ทาโรต์เป็นเครื่องมือสะท้อนความคิดและสัญชาตญาณ
          <br />
          ไม่ใช่คำทำนายที่แน่นอน — ใช้วิจารณญาณในการตัดสินใจเสมอ
        </p>
      </footer>
    </main>
  );
}
