"use client";

import {
  ArrowRight,
  PenLine,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BrandIcon } from "@/components/brands/BrandIcon";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { HeroFloatingIcons } from "@/components/new_home/HeroFloatingIcons";
import { HeroVisual } from "@/components/new_home/HeroVisual";
import { HomeCtaCard } from "@/components/new_home/HomeCtaCard";
import { MobileCtaDock } from "@/components/new_home/MobileCtaDock";
import { NewHomeNav } from "@/components/new_home/NewHomeNav";
import { BenefitsSection } from "@/components/new_home/sections/BenefitsSection";
import { ProductSection } from "@/components/new_home/sections/ProductSection";
import { useMessages } from "@/contexts/messages-context";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useStartWorkspace } from "@/hooks/useStartWorkspace";

import "@/components/home/home-landing.css";
import "./new-home.css";
import "./new-home-rtl.css";

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
  const { landing, story } = useMessages();
  const { start, isAuthenticated, studioHref } = useStartWorkspace();

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
                <div className="hero2 hero2--split home-reveal" data-reveal>
                  <div className="hero2__copy">
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
                                <BrandIcon src={src} size={18} />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="hero2__actions">
                      {isAuthenticated ? (
                        <a href={studioHref} className="home-screen__cta">
                          {story.nav.studio}
                          <ArrowRight className="home-screen__cta-icon" aria-hidden />
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="home-screen__cta cursor-pointer"
                          onClick={start}
                        >
                          {h.ctaPrimary}
                          <ArrowRight className="home-screen__cta-icon" aria-hidden />
                        </button>
                      )}
                      <a className="hero2__secondary" href="#product">
                        {h.ctaSecondary}
                      </a>
                    </div>

                    <div className="hero2__trust">
                      <span className="hero2__trust-badge" aria-hidden>
                        <ShieldCheck strokeWidth={2.25} />
                      </span>
                      <ul>
                        {h.trust.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="hero2__visual">
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
                      id={`pillar-${pillar.id}`}
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
                <BrandIcon src={icon.src} size={40} />
              </span>
            ))}
          </div>

          <div className="home-section__inner home-section__inner--cta home-reveal" data-reveal>
            <HomeCtaCard />
          </div>
        </section>
      </main>

      <LandingFooter variant="landing" />
      <MobileCtaDock />
    </div>
  );
}
