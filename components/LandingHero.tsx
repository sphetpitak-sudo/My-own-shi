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
      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="mb-6 animate-in">
          <img
            src="/LOGO.png"
            alt="Sealo"
            className="w-20 h-20 mx-auto rounded-2xl object-cover mb-6"
            style={{ boxShadow: "0 0 30px rgba(124, 58, 237, 0.4)" }}
          />
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-in d1 tracking-tight">
          {t.catarot}
        </h1>

        <p className="text-lg sm:text-xl text-purple-200/80 mb-8 max-w-md animate-in d1">
          {t.catarot_subtitle}
        </p>

        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-12 animate-in d1" />
      </div>

      {/* Features */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 text-center animate-in"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
                animationDelay: `${0.1 + i * 0.08}s`,
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: f.color }}>
                <f.icon size={22} style={{ color: f.iconColor }} />
              </div>
              <h3 className="text-white font-bold text-[15px] mb-2">{f.title}</h3>
              <p className="text-purple-200/60 text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
