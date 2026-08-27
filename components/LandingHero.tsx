"use client";

import Image from "next/image";
import { Sparkles, Coins, Gift, ChevronRight } from "lucide-react";
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
          background: "radial-gradient(ellipse at 50% 60%, rgba(109, 40, 217, 0.06) 0%, transparent 60%)",
        }}
      />

      {/* Hero content - centered */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20 sm:pt-28 pb-16">
        {/* Logo with glow */}
        <div className="mb-8 animate-in" style={{ animationDelay: "0s" }}>
          <div className="relative">
            <Image
              src="/LOGO.png"
              alt="Sealo"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl object-cover"
              style={{
                boxShadow: "0 0 40px rgba(167, 139, 250, 0.25), 0 0 80px rgba(109, 40, 217, 0.1)",
              }}
              priority
            />
            {/* Subtle ring around logo */}
            <div
              className="absolute -inset-2 rounded-[28px] pointer-events-none"
              style={{
                border: "1px solid rgba(167, 139, 250, 0.15)",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-5xl sm:text-6xl font-extrabold text-white mb-4 animate-in"
          style={{
            animationDelay: "0.1s",
            letterSpacing: "-0.03em",
            textShadow: "0 0 40px rgba(167, 139, 250, 0.2)",
          }}
        >
          {t.catarot}
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg mb-8 max-w-sm animate-in leading-relaxed"
          style={{
            animationDelay: "0.18s",
            color: "rgba(255, 255, 255, 0.45)",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          {t.catarot_subtitle}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-12 animate-in" style={{ animationDelay: "0.24s" }}>
          <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3))" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(212, 175, 55, 0.4)" }} />
          <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, rgba(212, 175, 55, 0.3), transparent)" }} />
        </div>

        {/* Features - premium grid */}
        <div className="w-full max-w-md animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="grid grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 text-center group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                  animationDelay: `${0.35 + i * 0.08}s`,
                  transition: "all 0.3s var(--ease)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(167, 139, 250, 0.1)",
                    border: "1px solid rgba(167, 139, 250, 0.15)",
                  }}
                >
                  <f.icon size={18} style={{ color: "rgba(167, 139, 250, 0.8)" }} />
                </div>
                <h3 className="text-white font-bold text-[12px] sm:text-[13px] mb-1">{f.title}</h3>
                <p className="text-[10px] sm:text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-12 animate-in" style={{ animationDelay: "0.5s" }}>
          <div className="flex flex-col items-center gap-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span className="text-[11px] font-medium tracking-wide uppercase">{t.start_reading}</span>
            <ChevronRight size={16} style={{ transform: "rotate(90deg)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
