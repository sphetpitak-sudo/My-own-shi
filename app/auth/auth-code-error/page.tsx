import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>
          เข้าสู่ระบบไม่สำเร็จ
        </h1>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          มีปัญหาในการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง
        </p>
        <Link
          href="/"
          className="btn btn-primary"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}
