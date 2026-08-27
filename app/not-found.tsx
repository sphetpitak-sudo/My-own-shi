import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="card p-10 text-center max-w-md">
        {/* Decorative element */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold)" }} />
          <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, var(--gold), transparent)" }} />
        </div>

        <div
          className="text-6xl font-extrabold mb-4"
          style={{
            color: "var(--text)",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </div>
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
        >
          ไม่พบหน้าที่ค้นหา
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          หน้าที่คุณกำลังค้นหาอาจถูกลบหรือย้ายที่อยู่แล้ว
        </p>

        <Link
          href="/"
          className="btn btn-primary inline-flex items-center gap-2"
          style={{
            boxShadow: "0 2px 8px rgba(109, 40, 217, 0.2)",
          }}
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
