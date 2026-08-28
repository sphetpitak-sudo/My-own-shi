"use client";

import Image from "next/image";
import { Sparkles, Coins, Gift, ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function LandingHero() {
  const { t } = useLang();

  const features = [
    {
      icon: Sparkles,
      title: t.ai_reading,
      desc: t.ai_reading_desc,
    },
    {
      icon: Coins,
      title: t.points_system,
      desc: t.points_system_desc,
    },
    {
      icon: Gift,
      title: t.daily_bonus,
      desc: t.daily_bonus_desc,
    },
  ];

  return (
    <div className="starfield relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Ambient gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(109, 40, 217, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Hero content - centered */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-24 sm:pt-32 pb-20">
        {/* Logo with glow */}
        <div className="mb-6 animate-in" style={{ animationDelay: "0s" }}>
          <div className="relative">
            <Image
              src="/LOGO.png"
              alt="Sealo"
              width={88}
              height={88}
              className="w-[72px] h-[72px] sm:w-20 sm:h-20 mx-auto rounded-2xl object-cover"
              style={{
                boxShadow: "0 0 50px rgba(167, 139, 250, 0.2), 0 0 100px rgba(109, 40, 217, 0.08)",
              }}
              priority
            />
            {/* Subtle ring around logo */}
            <div
              className="absolute -inset-2 rounded-[24px] pointer-events-none"
              style={{
                border: "1px solid rgba(167, 139, 250, 0.12)",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-white mb-3 animate-in"
          style={{
            animationDelay: "0.08s",
            letterSpacing: "-0.04em",
            textShadow: "0 0 40px rgba(167, 139, 250, 0.15)",
          }}
        >
          {t.catarot}
        </h1>

        {/* Subtitle */}
        <p
          className="text-[15px] sm:text-base mb-8 max-w-xs animate-in leading-relaxed"
          style={{
            animationDelay: "0.14s",
            color: "rgba(255, 255, 255, 0.4)",
            fontWeight: 400,
          }}
        >
          {t.catarot_subtitle}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-10 animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.25))" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "rgba(212, 175, 55, 0.35)" }} />
          <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, rgba(212, 175, 55, 0.25), transparent)" }} />
        </div>

        {/* Features - premium grid */}
        <div className="w-full max-w-sm animate-in" style={{ animationDelay: "0.26s" }}>
          <div className="grid grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl p-4 text-center group"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(8px)",
                  animationDelay: `${0.3 + i * 0.06}s`,
                  transition: "all 0.3s var(--ease)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2.5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(167, 139, 250, 0.08)",
                    border: "1px solid rgba(167, 139, 250, 0.12)",
                  }}
                >
                  <f.icon size={16} style={{ color: "rgba(167, 139, 250, 0.75)" }} />
                </div>
                <h3 className="text-white font-bold text-[11px] sm:text-[12px] mb-0.5">{f.title}</h3>
                <p className="text-[9px] sm:text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-14 animate-in" style={{ animationDelay: "0.45s" }}>
          <div className="flex flex-col items-center gap-1.5" style={{ color: "rgba(255,255,255,0.18)" }}>
            <span className="text-[10px] font-medium tracking-wider uppercase">{t.start_reading}</span>
            <ChevronDown size={14} className="animate-bounce" style={{ animationDuration: "2s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
