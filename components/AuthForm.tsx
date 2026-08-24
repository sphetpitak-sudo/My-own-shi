"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n";

export default function AuthForm() {
  const { t, lang } = useLang();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #e8f5e9 0%, #fdf6e3 50%, #f5e6c8 100%)" }}>
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-5xl animate-float opacity-60">🌿</div>
      <div className="absolute top-20 right-16 text-4xl animate-float-slow opacity-50" style={{ animationDelay: "0.5s" }}>🍃</div>
      <div className="absolute bottom-20 left-20 text-4xl animate-sway opacity-50">🌲</div>
      <div className="absolute bottom-16 right-12 text-5xl animate-float opacity-40" style={{ animationDelay: "1s" }}>🌳</div>
      <div className="absolute top-1/3 left-1/4 text-3xl animate-float-slow opacity-30">🍄</div>
      <div className="absolute top-1/2 right-1/4 text-3xl animate-sway opacity-30" style={{ animationDelay: "0.7s" }}>🦋</div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6" style={{ background: "rgba(107, 142, 35, 0.12)", border: "1px solid rgba(107, 142, 35, 0.25)" }}>
            <span className="text-xl">🏡</span>
            <span className="font-pixel text-sm font-bold" style={{ color: "#4a7c23" }}>
              {lang === "th" ? "ยินดีต้อนรับสู่ป่า" : "Welcome to the Forest"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl animate-float">🦊</span>
            <h1 className="font-pixel text-3xl md:text-4xl font-bold" style={{ color: "#2d5016" }}>
              {t.app_name}
            </h1>
            <span className="text-4xl animate-float-slow" style={{ animationDelay: "0.3s" }}>🐰</span>
          </div>
          <p className="font-pixel text-base" style={{ color: "#8b7355" }}>
            {lang === "th" ? "จัดการเงินในนิคมของคุณ 🌱" : "Manage your village finances 🌱"}
          </p>
        </div>

        <div className="forest-card p-8 animate-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-pixel text-xl font-bold text-center mb-8" style={{ color: "#2d5016" }}>
            {isSignUp ? t.signup : t.login}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-2 font-pixel text-sm" style={{ background: "#fbe9e7", border: "1px solid #ffab91", color: "#c0392b" }}>
              <span className="text-lg">🌾</span> {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-2 font-pixel text-sm" style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", color: "#2d5016" }}>
              <span className="text-lg">✅</span> {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
                📧 {t.email}
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="forest-input" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
                🔒 {t.password}
              </label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="forest-input" placeholder="••••••••" />
            </div>

            {isSignUp && (
              <div>
                <label className="block font-pixel text-sm font-semibold mb-2" style={{ color: "#5c3d0e" }}>
                  🔒 {t.confirm_password}
                </label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="forest-input" placeholder="••••••••" />
              </div>
            )}

            <button type="submit" disabled={loading} className="wood-btn w-full flex items-center justify-center gap-2 text-base font-pixel">
              {loading ? <span className="animate-pulse">⏳ {t.loading}</span> : (
                <>
                  {isSignUp ? t.signup_button : t.login_button}
                  <span>🌿</span>
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #d4c5a0, transparent)" }} />
            <span className="font-pixel text-sm" style={{ color: "#b8a88a" }}>{t.or}</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #d4c5a0, transparent)" }} />
          </div>

          <button onClick={async () => {
            await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
          }} className="w-full py-3 rounded-2xl font-pixel text-sm font-bold flex items-center justify-center gap-3 transition-all"
            style={{ background: "white", border: "2px solid #d4c5a0", color: "#5c3d0e" }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {lang === "th" ? "เข้าสู่ระบบด้วย Google" : "Sign in with Google"}
          </button>

          <div className="mt-8 text-center">
            <span className="font-pixel text-sm" style={{ color: "#b8a88a" }}>
              {isSignUp ? t.login : t.signup}{" "}
            </span>
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
              className="font-pixel text-sm font-bold transition-colors" style={{ color: "#6b8e23" }}>
              {isSignUp ? t.login_button : t.signup_button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
