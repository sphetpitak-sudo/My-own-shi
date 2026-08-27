"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ["อ่อนมาก", "อ่อน", "ปานกลาง", "ดี", "แข็งแกร่ง"];
    const colors = ["var(--red)", "var(--red)", "var(--yellow, #eab308)", "var(--green)", "var(--green)"];
    return { score, label: labels[score], color: colors[score] };
  };

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);

    if (forgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
      if (error) setError(error.message);
      else setMessage("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว");
      setLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน"); setLoading(false); return;
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยัน");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.includes("429") || error.message.toLowerCase().includes("rate")
          ? "ลองใหม่อีกครั้งในภายหลัง"
          : error.message;
        setError(msg); setLoading(false); return;
      }
      window.location.href = "/dashboard";
      return;
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 pb-16" style={{ minHeight: "50vh" }}>
      <div className="w-full max-w-[400px]">
        {/* Auth header */}
        <div className="text-center mb-8 animate-in">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, #6d28d9, #a78bfa)",
              boxShadow: "0 4px 20px rgba(109, 40, 217, 0.3)",
            }}
          >
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>Sealo</h1>
          <p className="text-[13px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
            เปิดไพ่ชะตาของคุณ
          </p>
        </div>

        {/* Auth card */}
        <div className="card p-6 animate-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-[17px] font-bold text-center mb-5" style={{ letterSpacing: "-0.01em" }}>
            {forgotMode ? "รีเซ็ตรหัสผ่าน" : isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </h2>

          {error && (
            <div id="auth-error" role="alert" className="mb-4 p-3.5 rounded-xl text-[13px] font-medium"
              style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(194, 65, 48, 0.1)" }}>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3.5 rounded-xl text-[13px] font-medium"
              style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid rgba(45, 122, 79, 0.1)" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" aria-describedby={error ? "auth-error" : undefined}>
            <div className="field">
              <label className="label">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" style={{ paddingLeft: "38px" }} placeholder="email@example.com"
                  aria-invalid={error?.includes("email") ? "true" : undefined}
                  aria-describedby={error ? "auth-error" : undefined} />
              </div>
            </div>

            {!forgotMode && (
              <div className="field">
                <label className="label">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="input" style={{ paddingLeft: "38px", paddingRight: "38px" }} placeholder="••••••••"
                    aria-invalid={error?.includes("password") ? "true" : undefined}
                    aria-describedby={error ? "auth-error" : undefined} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isSignUp && password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                          style={{ background: i < getPasswordStrength(password).score ? getPasswordStrength(password).color : "var(--border)" }} />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: getPasswordStrength(password).color }}>
                      {getPasswordStrength(password).label}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isSignUp && !forgotMode && (
              <div className="field">
                <label className="label">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input" style={{ paddingLeft: "38px" }} placeholder="••••••••"
                    aria-invalid={error?.includes("password") ? "true" : undefined}
                    aria-describedby={error ? "auth-error" : undefined} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-3"
              style={{ padding: "12px 20px" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังโหลด...
                </span>
              ) : (
                <>
                  {forgotMode ? "ส่งลิงก์รีเซ็ต" : isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {!isSignUp && !forgotMode && (
            <div className="mt-3 text-center">
              <button onClick={() => {
                if (!email) { setError("กรุณากรอกอีเมลก่อน"); return; }
                setForgotMode(true);
              }} className="text-[12px] font-medium hover:underline" style={{ color: "var(--text-muted)" }}>
                ลืมรหัสผ่าน?
              </button>
            </div>
          )}

          {forgotMode && (
            <div className="mt-3 text-center">
              <button onClick={() => { setForgotMode(false); setError(""); setMessage(""); }}
                className="text-[12px] font-medium hover:underline" style={{ color: "var(--text-muted)" }}>
                กลับไปเข้าสู่ระบบ
              </button>
            </div>
          )}

          {!forgotMode && (
            <>
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 divider" />
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>หรือ</span>
                <div className="flex-1 divider" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="btn btn-ghost w-full"
                style={{ gap: "10px" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>

              <div className="mt-5 text-center">
                <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {isSignUp ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}
                </span>
                <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
                  className="text-[13px] font-bold hover:underline" style={{ color: "var(--text)" }}>
                  {isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
