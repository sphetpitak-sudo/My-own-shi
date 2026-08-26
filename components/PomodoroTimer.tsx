"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

interface Props {
  assignmentTitle?: string;
}

export default function PomodoroTimer({ assignmentTitle }: Props) {
  const { t, lang } = useLang();
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pomodoro");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.mode) setMode(s.mode);
        if (typeof s.secondsLeft === "number") setSecondsLeft(s.secondsLeft);
        if (typeof s.sessions === "number") setSessions(s.sessions);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("pomodoro", JSON.stringify({ mode, secondsLeft, sessions }));
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [mode, secondsLeft, sessions]);

  const WORK_MIN = 25;
  const BREAK_MIN = 5;

  const totalSeconds = mode === "work" ? WORK_MIN * 60 : BREAK_MIN * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const reset = useCallback(() => {
    setIsRunning(false);
    setMode("work");
    setSecondsLeft(WORK_MIN * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (mode === "work") {
      setSessions((s) => s + 1);
      setMode("break");
      setSecondsLeft(BREAK_MIN * 60);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t.break_time, {
          body: t.notification_break_body,
          icon: "/favicon.ico",
        });
      }
    } else {
      setMode("work");
      setSecondsLeft(WORK_MIN * 60);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t.focus, {
          body: t.notification_work_body,
          icon: "/favicon.ico",
        });
      }
    }
    setIsRunning(false);
  }, [secondsLeft, mode, lang]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Timer size={16} className="text-secondary" />
        <span className="sec-title">{t.pomodoro_timer}</span>
        {assignmentTitle && (
          <span className="badge badge-blue ml-auto">{assignmentTitle}</span>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Timer circle */}
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label={lang === "th" ? "ตารางเวลา" : "Timer progress"}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={mode === "work" ? "var(--blue)" : "var(--green)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-semibold text-muted">
              {mode === "work" ? t.focus : t.break_time}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={reset} className="icon-btn-sm"
            aria-label={t.reset}><RotateCcw size={18} /></button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn btn-primary !rounded-full !w-12 !h-12 !p-0"
            aria-label={isRunning ? t.pause : t.play}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <div className="w-9" />
        </div>

        {/* Sessions */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[12px] text-muted">
            {t.sessions_completed}:
          </span>
          <div className="flex gap-1" aria-label={`${sessions} ${t.sessions_completed}`}>
            {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--green)" }} />
            ))}
          </div>
            {sessions > 8 && <span className="text-[11px] text-muted">+{sessions - 8}</span>}
        </div>
      </div>
    </div>
  );
}
