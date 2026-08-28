"use client";

import Image from "next/image";
import { Sparkles, Coins, Gift } from "lucide-react";
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

  const scrollToAuth = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("auth")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="starfield relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Ambient gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(109, 40, 217, 0.10) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(8, 6, 14, 0.55) 0%, transparent 45%)",
        }}
      />

      {/* Hero content - centered */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-24 sm:pt-32 pb-24">
        {/* Logo with glow */}
        <div className="mb-7 animate-in" style={{ animationDelay: "0s" }}>
          <div className="relative">
            <Image
              src="/LOGO.png"
              alt="Sealo"
              width={72}
              height={72}
              className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] mx-auto rounded-[18px] object-cover"
              style={{
                boxShadow: "0 0 40px rgba(167, 139, 250, 0.18), 0 0 80px rgba(109, 40, 217, 0.07)",
              }}
              priority
            />
            <div
              className="absolute -inset-1.5 rounded-[22px] pointer-events-none"
              style={{ border: "1px solid rgba(167, 139, 250, 0.14)" }}
            />
          </div>
        </div>

        {/* Brand eyebrow */}
        <div
          className="mb-4 animate-in text-[11px] font-bold uppercase tracking-[0.28em]"
          style={{ animationDelay: "0.06s", color: "rgba(212, 175, 55, 0.85)" }}
        >
          {t.catarot} · {t.hero_brand}
        </div>

        {/* Headline */}
        <h1
          className="text-[40px] sm:text-[56px] font-extrabold text-white mb-4 animate-in leading-[1.08]"
          style={{
            animationDelay: "0.12s",
            letterSpacing: "-0.035em",
            textShadow: "0 0 50px rgba(167, 139, 250, 0.18)",
          }}
        >
          {t.hero_headline}
        </h1>

        {/* Subheadline */}
        <p
          className="text-[15px] sm:text-[17px] mb-9 max-w-sm animate-in leading-relaxed"
          style={{
            animationDelay: "0.18s",
            color: "rgba(255, 255, 255, 0.62)",
            fontWeight: 400,
          }}
        >
          {t.hero_subheadline}
        </p>

        {/* CTA */}
        <div className="animate-in" style={{ animationDelay: "0.24s" }}>
          <a
            href="#auth"
            onClick={scrollToAuth}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #f6c944 0%, #d4af37 50%, #b8942a 100%)",
              color: "#2a1e00",
              boxShadow: "0 10px 30px rgba(212, 175, 55, 0.32), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            {t.hero_cta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 my-10 animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3))" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "rgba(212, 175, 55, 0.4)" }} />
          <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, rgba(212, 175, 55, 0.3), transparent)" }} />
        </div>

        {/* Features - premium grid */}
        <div className="w-full max-w-md animate-in" style={{ animationDelay: "0.34s" }}>
          <div className="grid grid-cols-3 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "rgba(167, 139, 250, 0.12)",
                    border: "1px solid rgba(167, 139, 250, 0.16)",
                  }}
                >
                  <f.icon size={18} style={{ color: "rgba(178, 152, 250, 0.9)" }} />
                </div>
                <h3 className="text-white font-semibold text-[12px] mb-1">{f.title}</h3>
                <p className="text-[10.5px] leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
