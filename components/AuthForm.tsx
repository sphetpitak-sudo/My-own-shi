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
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError(t.password_not_match);
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage(t.signup_success);
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center pixel-decorations p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="pixel-badge mb-3">{lang === "th" ? "✦ ยินดีต้อนรับ ✦" : "✦ Welcome ✦"}</p>
          <h1 className="font-pixel text-xl md:text-2xl text-pixel-800 dark:text-pixel-200 leading-relaxed">
            {t.app_name}
          </h1>
          <div className="mt-2 text-pixel-400 font-pixel text-[8px]">
            ✦ ✦ ✦
          </div>
        </div>

        <div className="pixel-card">
          <h2 className="font-pixel text-xs text-center mb-6 text-pixel-700 dark:text-pixel-300">
            {isSignUp ? t.signup : t.login}
          </h2>

          {error && (
            <div className="mb-4 p-3 border-2 border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-700 text-red-700 dark:text-red-300 font-pixel text-[9px]">
              ✗ {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 border-2 border-green-400 bg-green-50 dark:bg-green-950 dark:border-green-700 text-green-700 dark:text-green-300 font-pixel text-[9px]">
              ✓ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-pixel text-[9px] text-pixel-600 dark:text-pixel-400 mb-2 uppercase">
                {t.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pixel-input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block font-pixel text-[9px] text-pixel-600 dark:text-pixel-400 mb-2 uppercase">
                {t.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block font-pixel text-[9px] text-pixel-600 dark:text-pixel-400 mb-2 uppercase">
                  {t.confirm_password}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pixel-input"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pixel-btn w-full"
            >
              {loading ? `... ${t.loading}` : isSignUp ? `✦ ${t.signup_button}` : `✦ ${t.login_button}`}
            </button>
          </form>

          <div className="mt-6">
            <div className="pixel-divider mb-4" />
            <button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="pixel-btn-outline w-full flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {lang === "th" ? "เข้าสู่ระบบด้วย Google" : "Sign in with Google"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="font-pixel text-[9px] text-pixel-400">
              {isSignUp ? t.login : t.signup}{" "}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="font-pixel text-[9px] text-pixel-600 dark:text-pixel-400 hover:text-pixel-800 dark:hover:text-pixel-200 underline"
            >
              {isSignUp ? t.login_button : t.signup_button}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 font-pixel text-[7px] text-pixel-400 dark:text-pixel-600">
          PIXEL FINANCE © 2024
        </p>
      </div>
    </div>
  );
}
