"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// Shown when the browser reports no connectivity. Mounted in DashboardShell
// so every post-login page is covered. Purely informational — it never
// blocks or retries anything (paid actions stay user-initiated).
export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      setOnline(navigator.onLine);
    }
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium"
      style={{ background: "var(--red-soft)", color: "var(--red)" }}
    >
      <WifiOff size={15} aria-hidden />
      ขาดการเชื่อมต่ออินเทอร์เน็ต — กรุณาตรวจสอบก่อนทำรายการที่ใช้แต้ม
    </div>
  );
}
