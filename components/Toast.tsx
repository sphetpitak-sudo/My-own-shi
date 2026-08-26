"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastAction { label: string; onClick: () => void; }
interface Toast { id: number; message: string; type: ToastType; leaving: boolean; action?: ToastAction; }

const ToastContext = createContext<{ toast: (message: string, type?: ToastType, action?: ToastAction) => void }>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success", action?: ToastAction) => {
    const id = ++counter.current;
    setToasts((prev) => {
      const next = [...prev, { id, message, type, leaving: false, action }];
      return next.length > 3 ? next.slice(-3) : next;
    });
    const timer = setTimeout(() => removeToast(id), 3000);
    timers.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap fixed top-4 left-4 right-4 md:left-auto md:right-4 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.leaving ? "out" : ""}`}
            onMouseEnter={() => {
              const timer = timers.current.get(t.id);
              if (timer) { clearTimeout(timer); timers.current.delete(t.id); }
            }}
            onMouseLeave={() => {
              const timer = setTimeout(() => removeToast(t.id), 2000);
              timers.current.set(t.id, timer);
            }}
          >
            {t.type === "success" && <Check size={16} style={{ color: "var(--green)" }} />}
            {t.type === "error" && <AlertCircle size={16} style={{ color: "var(--red)" }} />}
            {t.type === "info" && <Info size={16} style={{ color: "var(--blue)" }} />}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); removeToast(t.id); }}
                className="ml-2 text-[12px] font-semibold px-2 py-0.5 rounded-md"
                style={{ color: "var(--primary)", background: "var(--primary-soft, rgba(79,124,255,0.12))" }}
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
