"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";
import { Mail, Lock, ArrowRight, GraduationCap, Eye, EyeOff } from "lucide-react";

export default function AuthForm() {
  const { t, lang } = useLang();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = [lang === "th" ? "อ่อนมาก" : "Very weak", lang === "th" ? "อ่อน" : "Weak", lang === "th" ? "พอใช้" : "Fair", lang === "th" ? "ดี" : "Good", lang === "th" ? "แข็งแรง" : "Strong"];
    const colors = ["var(--red)", "var(--red)", "var(--yellow, #eab308)", "var(--green)", "var(--green)"];
    return { score, label: labels[score], color: colors[score] };
  };

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    if (isSignUp && password !== confirmPassword) {
      setError(t.password_not_match); setLoading(false); return;
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message); else setMessage(t.signup_success);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
      const msg = error.message.includes("429") || error.message.toLowerCase().includes("rate")
        ? (lang === "th" ? "ลองใหม่อีกครั้งในภายหลัง — คุณลองผิดหลายครั้งเกินไป" : "Too many attempts. Please try again later.")
        : error.message;
      setError(msg); setLoading(false); return;
    }
      window.location.href = "/dashboard";
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8 animate-in">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--primary)" }}>
            <GraduationCap size={22} style={{ color: "var(--text-invert)" }} />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight">{t.app_name}</h1>
          <p className="text-[14px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
            {lang === "th" ? "จัดการการบ้านและงานของคุณ" : "Manage your homework and tasks"}
          </p>
        </div>

        <div className="card p-7 animate-in d1">
          <h2 className="text-[17px] font-bold text-center mb-5">{isSignUp ? t.signup : t.login}</h2>

          {error && (
            <div id="auth-error" role="alert" className="mb-4 p-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-xl text-[13px] font-medium" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" aria-describedby={error ? "auth-error" : undefined}>
            <div className="field">
              <label className="label">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" style={{ paddingLeft: "38px" }} placeholder="email@example.com"
                  aria-invalid={error ? "true" : undefined} />
              </div>
            </div>
            <div className="field">
              <label className="label">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" style={{ paddingLeft: "38px", paddingRight: "38px" }} placeholder="••••••••"
                  aria-invalid={error ? "true" : undefined} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  aria-label={showPassword ? (lang === "th" ? "ซ่อนรหัสผ่าน" : "Hide password") : (lang === "th" ? "แสดงรหัสผ่าน" : "Show password")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignUp && password && (
                <div className="mt-1">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < getPasswordStrength(password).score ? getPasswordStrength(password).color : "var(--border)" }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: getPasswordStrength(password).color }}>{getPasswordStrength(password).label}</p>
                </div>
              )}
            </div>
            {isSignUp && (
              <div className="field">
                <label className="label">{t.confirm_password}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input" style={{ paddingLeft: "38px" }} placeholder="••••••••"
                    aria-invalid={error ? "true" : undefined} />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
              {loading ? <span className="animate-pulse">{t.loading}</span> : (
                <>{isSignUp ? t.signup_button : t.login_button} <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {!isSignUp && (
            <div className="mt-3 text-center">
              <button onClick={async () => {
                if (!email) { setError(lang === "th" ? "กรุณากรอกอีเมล" : "Please enter your email first"); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
                if (error) setError(error.message);
                else setMessage(lang === "th" ? "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว — ตรวจสอบอีเมล" : "Password reset link sent — check your email");
              }} className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {lang === "th" ? "ลืมรหัสผ่าน?" : "Forgot password?"}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 divider" />
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{t.or}</span>
            <div className="flex-1 divider" />
          </div>

          <button onClick={async () => {
            await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
          }} className="btn btn-ghost w-full">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {lang === "th" ? "เข้าสู่ระบบด้วย Google" : "Sign in with Google"}
          </button>

          <div className="mt-5 text-center">
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>{isSignUp ? t.login : t.signup} </span>
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
              {isSignUp ? t.login_button : t.signup_button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}