"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const translations = {
  en: {
    app_name: "StudyHub",
    manage_homework: "Manage your homework, subjects & time",
    login: "Log In",
    signup: "Sign Up",
    login_button: "Log In",
    signup_button: "Sign Up",
    email: "Email",
    password: "Password",
    confirm_password: "Confirm Password",
    forgot_password: "Forgot password?",
    password_reset_sent: "Password reset email sent!",
    signup_success: "Account created! Check your email.",
    password_not_match: "Passwords do not match",
    rate_limit: "Too many attempts. Please wait a moment.",
    enter_email_first: "Enter your email first",
    or: "or",
    sign_in_google: "Continue with Google",
    loading: "Loading...",
    very_weak: "Very Weak",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
    show_password: "Show password",
    hide_password: "Hide password",
    // Tarot
    tarot_destiny: "Tarot Destiny",
    tarot_subtitle: "Discover your future with tarot cards",
    start_reading: "Start Reading",
    ai_reading: "AI Reading",
    ai_reading_desc: "Get personalized interpretations powered by AI",
    points_system: "Points System",
    points_system_desc: "Earn points daily and use them for readings",
    daily_bonus: "Daily Bonus",
    daily_bonus_desc: "Log in every day to claim free points",
  },
  th: {
    app_name: "StudyHub",
    manage_homework: "จัดการงานบ้าน วิชา และเวลาเรียนของคุณ",
    login: "เข้าสู่ระบบ",
    signup: "สมัครสมาชิก",
    login_button: "เข้าสู่ระบบ",
    signup_button: "สมัครสมาชิก",
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirm_password: "ยืนยันรหัสผ่าน",
    forgot_password: "ลืมรหัสผ่าน?",
    password_reset_sent: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว!",
    signup_success: "สร้างบัญชีสำเร็จ! กรุณาตรวจสอบอีเมล",
    password_not_match: "รหัสผ่านไม่ตรงกัน",
    rate_limit: "พยายามมากเกินไป กรุณารอสักครู่",
    enter_email_first: "กรุณาใส่อีเมลก่อน",
    or: "หรือ",
    sign_in_google: "เข้าสู่ระบบด้วย Google",
    loading: "กำลังโหลด...",
    very_weak: "อ่อนมาก",
    weak: "อ่อน",
    fair: "พอใช้",
    good: "ดี",
    strong: "แข็งแรง",
    show_password: "แสดงรหัสผ่าน",
    hide_password: "ซ่อนรหัสผ่าน",
    // Tarot
    tarot_destiny: "Tarot Destiny",
    tarot_subtitle: "ค้นพบอนาคตของคุณด้วยไพ่ทาโรต์",
    start_reading: "เริ่มทำนาย",
    ai_reading: "AI ทำนาย",
    ai_reading_desc: "รับคำทำนายส่วนตัวที่ขับเคลื่อนด้วย AI",
    points_system: "ระบบคะแนน",
    points_system_desc: "รับคะแนนทุกวันและใช้สำหรับการทำนาย",
    daily_bonus: "โบนัสรายวัน",
    daily_bonus_desc: "เข้าสู่ระบบทุกวันเพื่อรับคะแนนฟรี",
  },
};

type Lang = "en" | "th";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: typeof translations.en }>({
  lang: "th",
  setLang: () => {},
  t: translations.th,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
