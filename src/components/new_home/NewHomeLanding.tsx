"use client";

import {
  ArrowRight,
  Lock,
  PenLine,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { LandingFooter } from "@/components/layout/LandingFooter";
import { HeroFloatingIcons } from "@/components/new_home/HeroFloatingIcons";
import { HeroVisual } from "@/components/new_home/HeroVisual";
import { NewHomeNav } from "@/components/new_home/NewHomeNav";
import { BenefitsSection } from "@/components/new_home/sections/BenefitsSection";
import { ProductSection } from "@/components/new_home/sections/ProductSection";
import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

import "@/components/home/home-landing.css";
import "./new-home.css";

const PILLAR_ICONS = {
  create: PenLine,
  manage: CalendarDays,
  grow: TrendingUp,
} as const;

const PILLAR_ACCENTS = ["home-pillar--create", "home-pillar--manage", "home-pillar--grow"] as const;

const CTA_ORBIT_ICONS = [
  { src: "/home/icons/color/instagram.svg", className: "home-cta-orbit__icon--a" },
  { src: "/home/icons/color/youtube.svg", className: "home-cta-orbit__icon--b" },
  { src: "/home/icons/color/tiktok.svg", className: "home-cta-orbit__icon--c" },
  { src: "/home/icons/color/telegram.svg", className: "home-cta-orbit__icon--d" },
  { src: "/home/icons/color/x.svg", className: "home-cta-orbit__icon--e" },
  { src: "/home/icons/color/linkedin.svg", className: "home-cta-orbit__icon--f" },
] as const;

const HERO_PLATFORM_ICONS: Record<string, string> = {
  Instagram: "/home/icons/color/instagram.svg",
  TikTok: "/home/icons/color/tiktok.svg",
  YouTube: "/home/icons/color/youtube.svg",
  X: "/home/icons/color/x.svg",
  Telegram: "/home/icons/color/telegram.svg",
  LinkedIn: "/home/icons/color/linkedin.svg",
};

export function NewHomeLanding() {
  const { landing } = useMessages();
  const { openModal } = useDemoModal();

  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("home-route-active", "nh-hybrid-active");
    return () => {
      document.documentElement.classList.remove("home-route-active", "nh-hybrid-active");
    };
  }, []);

  useRevealOnScroll({ current: rootEl });

  const h = landing.hero;

  return (
    <div className="home-page nh-hybrid">
      <NewHomeNav />

      <main ref={setRootEl} className="home-landing">
        <section className="home-section home-section--hero" aria-label="Hero">
          <div className="home-hero__bg hero" aria-hidden="true" />

          <div className="home-hero__content">
            <div className="hero2-bleed">
              <div className="hero2-bleed__bg" aria-hidden="true">
                <span className="hero2-bleed__left" />
                <span className="hero2-bleed__right" />
                <span className="hero2-bleed__seam" />
              </div>
              <div className="home-section__inner home-section__inner--hero">
                <div className="hero2 hero2--split">
                  <div className="hero2__copy home-reveal" data-reveal>
                    <span className="hero2__copy-glow hero2__copy-glow--a" aria-hidden />
                    <span className="hero2__copy-glow hero2__copy-glow--b" aria-hidden />

                    <span className="home-hero__badge">
                      <span className="home-hero__badge-dot" aria-hidden />
                      {h.badge}
                    </span>
                    <h1 className="hero2__title">
                      <span className="hero2__title-line">{h.title}</span>
                      <span className="hero2__title-line hero2__title-line--accent">
                        <span className="home-hero__accent">{h.titleAccent}</span>
                      </span>
                    </h1>
                    <p className="hero2__sub">{h.text}</p>

                    <div className="hero2__platforms" aria-label={h.social.worksWith}>
                      <span className="hero2__platforms-label">{h.social.worksWith}</span>
                      <ul className="hero2__platforms-row">
                        {h.platforms.map((name) => {
                          const src = HERO_PLATFORM_ICONS[name];
                          if (!src) return null;
                          return (
                            <li key={name}>
                              <span className="hero2__platform-icon" title={name}>
                                <Image src={src} alt="" width={18} height={18} />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="hero2__actions">
                      <button
                        type="button"
                        className="home-screen__cta cursor-pointer"
                        onClick={openModal}
                      >
                        {h.ctaPrimary}
                        <ArrowRight className="home-screen__cta-icon" aria-hidden />
                      </button>
                      <a className="hero2__secondary" href="#product">
                        {h.ctaSecondary}
                      </a>
                    </div>

                    <p className="hero2__trust">
                      <Lock className="home-hero__trust-icon" aria-hidden />
                      {h.trust}
                    </p>
                  </div>

                  <div className="hero2__visual home-reveal" data-reveal>
                    <HeroFloatingIcons />
                    <HeroVisual />
                  </div>
                </div>
              </div>
            </div>

            <div
              id="pillars"
              className="home-hero__pillars home-reveal scroll-mt-28"
              data-reveal
              aria-label="Workflow pillars"
            >
              <header className="home-pillars__head">
                <p className="home-screen__label">{landing.pillars.label}</p>
                <h2 className="home-screen__title home-screen__title--section">{landing.pillars.title}</h2>
                <p className="home-screen__text home-screen__text--section">{landing.pillars.text}</p>
              </header>
              <ul className="home-pillars__grid">
                {landing.pillars.items.map((pillar, i) => {
                  const Icon = PILLAR_ICONS[pillar.id as keyof typeof PILLAR_ICONS];
                  return (
                    <li
                      key={pillar.id}
                      className={`home-pillar home-reveal ${PILLAR_ACCENTS[i]}`}
                      data-reveal
                      style={{ transitionDelay: `${0.08 * i}s` }}
                    >
                      <div className="home-pillar__head">
                        <span className="home-pillar__icon" aria-hidden>
                          <Icon />
                        </span>
                        <h3 className="home-pillar__title">{pillar.title}</h3>
                        <span className="home-pillar__index" aria-hidden>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="home-pillar__body">{pillar.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <ProductSection />

        <BenefitsSection />

        <section id="cta" className="home-section home-section--cta scroll-mt-28" aria-label="Get started">
          <div className="home-cta-orbit" aria-hidden="true">
            {CTA_ORBIT_ICONS.map((icon) => (
              <span key={icon.src} className={`home-cta-orbit__icon ${icon.className}`}>
                <Image src={icon.src} alt="" width={40} height={40} />
              </span>
            ))}
          </div>

          <div className="home-section__inner home-section__inner--cta home-reveal" data-reveal>
            <div className="home-cta-card">
              <span className="home-cta-card__badge">
                <span className="home-hero__badge-dot" aria-hidden />
                {landing.cta.badge}
              </span>
              <h2 className="home-screen__title home-screen__title--sm">{landing.cta.title}</h2>
              <p className="home-screen__text home-cta-card__text">{landing.cta.text}</p>
              <div className="home-cta-card__actions">
                <button type="button" className="home-screen__cta cursor-pointer" onClick={openModal}>
                  {landing.cta.primary}
                  <ArrowRight className="home-screen__cta-icon" aria-hidden />
                </button>
                <a className="home-cta-card__link" href="#product">
                  {landing.cta.secondary}
                </a>
              </div>
              <ul className="home-cta-card__trust" aria-label="Trust indicators">
                {landing.cta.trust.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="home-screen__note">{landing.cta.note}</p>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter variant="landing" />
    </div>
  );
}
