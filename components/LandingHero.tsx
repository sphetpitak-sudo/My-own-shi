"use client";

import Image from "next/image";
import { Sparkles, Coins, Gift, ArrowRight } from "lucide-react";
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
    <div className="starfield relative overflow-hidden min-h-[90vh] sm:min-h-[92vh] flex items-center justify-center">
      {/* Ambient mystical radial light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 32%, rgba(167, 139, 250, 0.14) 0%, transparent 65%), radial-gradient(ellipse at 50% 100%, rgba(7, 5, 13, 0.7) 0%, transparent 50%)",
        }}
      />

      {/* Hero content - centered */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-20 sm:pt-28 pb-20 max-w-4xl mx-auto">
        {/* Logo with cosmic glow */}
        <div className="mb-6 animate-in">
          <div className="relative inline-block">
            <Image
              src="/LOGO.png"
              alt="Sealo"
              width={80}
              height={80}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl object-cover"
              style={{
                boxShadow: "0 0 45px rgba(167, 139, 250, 0.28), 0 0 90px rgba(109, 40, 217, 0.12)",
              }}
              priority
            />
            <div
              className="absolute -inset-1.5 rounded-[22px] pointer-events-none"
              style={{ border: "1px solid rgba(167, 139, 250, 0.22)" }}
            />
          </div>
        </div>

        {/* Brand eyebrow */}
        <div
          className="mb-3 animate-in text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.28em]"
          style={{ animationDelay: "0.06s", color: "var(--gold-light)" }}
        >
          {t.catarot} · {t.hero_brand}
        </div>

        {/* Headline */}
        <h1
          className="text-[38px] sm:text-[56px] md:text-[62px] font-extrabold text-white mb-4 animate-in leading-[1.08] tracking-tight max-w-3xl"
          style={{
            animationDelay: "0.12s",
            textShadow: "0 0 50px rgba(167, 139, 250, 0.2)",
          }}
        >
          {t.hero_headline}
        </h1>

        {/* Subheadline */}
        <p
          className="text-[15px] sm:text-[17px] mb-8 max-w-lg animate-in leading-relaxed text-white/70 font-normal"
          style={{ animationDelay: "0.18s" }}
        >
          {t.hero_subheadline}
        </p>

        {/* CTA */}
        <div className="animate-in" style={{ animationDelay: "0.24s" }}>
          <a
            href="#auth"
            onClick={scrollToAuth}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-extrabold transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] btn-gold cursor-pointer"
          >
            {t.hero_cta}
            <ArrowRight size={18} />
          </a>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 my-10 animate-in" style={{ animationDelay: "0.3s" }}>
          <div className="w-14 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4))" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60" />
          <div className="w-14 h-px" style={{ background: "linear-gradient(90deg, rgba(212, 175, 55, 0.4), transparent)" }} />
        </div>

        {/* Features grid */}
        <div className="w-full max-w-2xl animate-in" style={{ animationDelay: "0.34s" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-4 text-center border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-200 hover:bg-white/[0.06] hover:border-white/20"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "rgba(167, 139, 250, 0.12)",
                    border: "1px solid rgba(167, 139, 250, 0.2)",
                  }}
                >
                  <f.icon size={18} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-white font-bold text-[13px] mb-1">{f.title}</h3>
                <p className="text-[11px] leading-relaxed text-white/50">
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
