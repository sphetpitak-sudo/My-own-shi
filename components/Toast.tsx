"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void }>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.type === "success" && <Check size={16} style={{ color: "#5fbf88" }} />}
            {t.type === "error" && <AlertCircle size={16} style={{ color: "#e0705f" }} />}
            {t.type === "info" && <Info size={16} style={{ color: "#7a9be0" }} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
