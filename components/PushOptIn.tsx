"use client";
import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";

export default function PushOptIn() {
  const [visible, setVisible] = useState(false);
  const [granted, setGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const dismissed = localStorage.getItem("sealo_push_dismissed");
    const visitCount = parseInt(localStorage.getItem("sealo_visits") || "0", 10) + 1;
    localStorage.setItem("sealo_visits", String(visitCount));
    if (Notification.permission === "granted") { setGranted(true); return; }
    if (dismissed) return;
    if (visitCount >= 2 && Notification.permission === "default") {
      setTimeout(()=> setVisible(true), 2000);
    }
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setVisible(false); localStorage.setItem("sealo_push_dismissed","1"); return; }
      setGranted(true);
      setVisible(false);
      // Try to get real push subscription if available
      let endpoint = `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let p256dh = "mock"; let auth = "mock";
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const reg = await navigator.serviceWorker.register("/sw.js");
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array("BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr_p2FbA5nT7P7X134tx_SB8") as unknown as BufferSource });
          // @ts-ignore
          endpoint = sub.endpoint;
          p256dh = arrayBufferToBase64(sub.getKey("p256dh")!);
          auth = arrayBufferToBase64(sub.getKey("auth")!);
        }
      } catch {}
      await fetch("/api/push/subscribe", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ endpoint, p256dh, auth })});
      try { new Notification("Sealo", { body:"เปิดรับการเตือนดวงรายวัน 20:00 แล้ว ✨" }); } catch {}
    } catch {}
    setLoading(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("sealo_push_dismissed","1");
  };

  if (granted) {
    return (
      <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl" style={{ background:"var(--green-soft)", color:"var(--green)", border:"1px solid rgba(45,122,79,0.14)"}}>
        <Check size={14}/> เปิดแจ้งเตือนแล้ว — จะเตือนดวงรายวัน 20:00
      </div>
    );
  }
  if (!visible) return null;
  return (
    <div className="card p-4 flex gap-3 items-start">
      <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background:"var(--primary-soft)", color:"var(--primary)"}}><Bell size={16}/></div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold" style={{ color:"var(--text)"}}>ให้ Sealo เตือนดวงรายวัน 20:00 ไหม?</div>
        <div className="text-[12px]" style={{ color:"var(--text-muted)"}}>แจ้งเตือนเฉพาะเมื่อยังไม่ได้รับดวงวันนี้ · ปิดได้ตลอด</div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleAllow} disabled={loading} className="btn btn-primary text-[12.5px] px-4 py-2">{loading? "กำลังเปิด...":"เปิดแจ้งเตือน"}</button>
          <button onClick={handleDismiss} className="btn btn-ghost text-[12.5px] px-3 py-2">ไว้ก่อน</button>
        </div>
      </div>
      <button onClick={handleDismiss} className="w-7 h-7 grid place-items-center rounded-full hover:bg-[var(--bg)]" style={{ color:"var(--text-muted)"}}><X size={14}/></button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
  return out;
}
function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  bytes.forEach(b=> binary+=String.fromCharCode(b));
  return btoa(binary);
}
