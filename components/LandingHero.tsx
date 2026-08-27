"use client";

import { Sparkles, Coins, Gift } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function LandingHero() {
  const { t } = useLang();

  const features = [
    {
      icon: Sparkles,
      title: t.ai_reading,
      desc: t.ai_reading_desc,
      color: "var(--blue-soft)",
      iconColor: "var(--blue)",
    },
    {
      icon: Coins,
      title: t.points_system,
      desc: t.points_system_desc,
      color: "var(--amber-soft)",
      iconColor: "var(--amber)",
    },
    {
      icon: Gift,
      title: t.daily_bonus,
      desc: t.daily_bonus_desc,
      color: "var(--green-soft)",
      iconColor: "var(--green)",
    },
  ];

  return (
    <div className="starfield relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Hero content - centered */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-16 sm:pt-20 pb-12">
        <div className="mb-5 animate-in">
          <img
            src="/LOGO.png"
            alt="Sealo"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl object-cover mb-5"
            style={{ boxShadow: "0 0 24px rgba(124, 58, 237, 0.3)" }}
          />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 animate-in d1 tracking-tight">
          {t.catarot}
        </h1>

        <p className="text-base sm:text-lg text-purple-200/70 mb-6 max-w-sm animate-in d1 leading-relaxed">
          {t.catarot_subtitle}
        </p>

        <div className="w-12 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent mb-10 animate-in d1" />

        {/* Features - compact row */}
        <div className="w-full max-w-md animate-in d1">
          <div className="grid grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  animationDelay: `${0.15 + i * 0.06}s`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ background: f.color }}
                >
                  <f.icon size={18} style={{ color: f.iconColor }} />
                </div>
                <h3 className="text-white font-bold text-[13px] mb-1">{f.title}</h3>
                <p className="text-purple-200/50 text-[11px] leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
