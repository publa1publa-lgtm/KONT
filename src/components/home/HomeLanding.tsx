"use client";

import {
  BarChart3,
  CalendarDays,
  Clock,
  Layers,
  PenLine,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingNav } from "@/components/layout/LandingNav";
import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

import "./home-landing.css";
import { useFallingIcons } from "./useFallingIcons";

const PILLAR_ICONS = {
  create: PenLine,
  manage: CalendarDays,
  grow: TrendingUp,
} as const;

const BENEFIT_ICONS = [CalendarDays, Sparkles, BarChart3] as const;

const PILLAR_ACCENTS = ["home-pillar--create", "home-pillar--manage", "home-pillar--grow"] as const;

export function HomeLanding() {
  const { landing } = useMessages();
  const { openModal } = useDemoModal();

  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  const [heroEl, setHeroEl] = useState<HTMLElement | null>(null);
  const [streamEl, setStreamEl] = useState<HTMLDivElement | null>(null);

  const scrollHintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("home-route-active");
    return () => {
      document.documentElement.classList.remove("home-route-active");
    };
  }, []);

  useRevealOnScroll({ current: rootEl });

  useFallingIcons({
    root: rootEl,
    hero: heroEl,
    stream: streamEl,
    scrollHint: scrollHintRef,
  });

  const h = landing.hero;

  return (
    <div className="home-page">
      <LandingNav />

      <main ref={setRootEl} className="home-landing">
        <section
          ref={setHeroEl}
          className="home-section home-section--hero"
          aria-label="Hero"
        >
          <div className="home-hero__bg hero" aria-hidden="true" />
          <div className="home-hero__scene" aria-hidden="true">
            <div id="home-stream" ref={setStreamEl} className="home-stream" />
          </div>

          <div className="home-hero__content">
            <div
              className="home-section__inner home-section__inner--hero home-reveal"
              data-reveal
            >
              <div className="home-hero__layout">
                <aside
                  className="home-hero__column home-hero__column--left home-reveal"
                  data-reveal
                  aria-label="Product overview"
                >
                  <div className="home-hero__copy">
                    <p className="home-screen__label">{h.label}</p>
                    <h1 className="home-screen__title home-screen__title--hero">{h.title}</h1>
                    <p className="home-screen__text home-screen__text--hero">{h.text}</p>
                    <div className="home-hero__actions home-hero__actions--left">
                      <button
                        type="button"
                        className="home-screen__cta home-screen__cta--hero"
                        onClick={openModal}
                      >
                        {h.ctaPrimary}
                      </button>
                      <a className="home-hero__link" href="#benefits">
                        {h.ctaSecondary}
                      </a>
                    </div>
                  </div>

                  <div className="home-hero__cards">
                    <div className="home-hero__glass home-hero__glass--channel">
                      <p className="home-hero__glass-kicker">
                        <Layers className="home-hero__glass-icon" aria-hidden />
                        {h.multiChannel.kicker}
                      </p>
                      <p className="home-hero__glass-title">{h.multiChannel.title}</p>
                      <ul className="home-hero__tags">
                        {h.platforms.map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="home-hero__glass home-hero__glass--secure">
                      <span className="home-hero__secure-badge" aria-hidden>
                        <Shield />
                      </span>
                      <p className="home-hero__glass-kicker">
                        <Shield className="home-hero__glass-icon" aria-hidden />
                        {h.secure.kicker}
                      </p>
                      <p className="home-hero__glass-title">{h.secure.title}</p>
                      <p className="home-hero__glass-line">{h.secure.line}</p>
                    </div>
                  </div>
                </aside>

                <div className="home-hero__void" aria-hidden="true">
                  <span className="home-hero__void-glow" />
                </div>

                <aside
                  className="home-hero__column home-hero__column--right home-reveal"
                  data-reveal
                  aria-label="Highlights"
                >
                  <div className="home-hero__glass home-hero__glass--offset-a">
                    <p className="home-hero__glass-kicker">
                      <BarChart3 className="home-hero__glass-icon" aria-hidden />
                      {h.pulse.kicker}
                    </p>
                    <ul className="home-hero__metrics">
                      {h.pulse.metrics.map((m) => (
                        <li key={m.label}>
                          <strong>{m.value}</strong>
                          <span>{m.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="home-hero__glass home-hero__glass--duo home-hero__glass--offset-b">
                    <div className="home-hero__duo-section">
                      <p className="home-hero__glass-kicker">
                        <Zap className="home-hero__glass-icon" aria-hidden />
                        {h.quickWins.kicker}
                      </p>
                      <p className="home-hero__glass-title home-hero__glass-title--sm">
                        {h.quickWins.title}
                      </p>
                      <ul className="home-hero__checks">
                        {h.quickWins.items.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="home-hero__duo-divider" aria-hidden="true" />
                    <div className="home-hero__duo-section">
                      <p className="home-hero__glass-kicker">
                        <Clock className="home-hero__glass-icon" aria-hidden />
                        {h.timing.kicker}
                      </p>
                      <p className="home-hero__glass-title home-hero__glass-title--sm">
                        {h.timing.title}
                      </p>
                      <ul className="home-hero__chips" aria-label="Timing features">
                        {h.timing.chips.map((chip) => (
                          <li key={chip}>{chip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </aside>
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
                <h2 className="home-screen__title home-screen__title--section">
                  {landing.pillars.title}
                </h2>
                <p className="home-screen__text home-screen__text--section">
                  {landing.pillars.text}
                </p>
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
                      <span className="home-pillar__icon" aria-hidden>
                        <Icon />
                      </span>
                      <h3 className="home-pillar__title">{pillar.title}</h3>
                      <p className="home-pillar__body">{pillar.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <p className="scroll-hint" id="scroll-hint" ref={scrollHintRef}>
            {landing.scrollHint}
          </p>
        </section>

        <section
          id="benefits"
          className="home-section home-section--tools scroll-mt-28"
          aria-label="Why KONT"
        >
          <div
            className="home-section__inner home-section__inner--tools home-reveal"
            data-reveal
          >
            <div className="home-tools home-reveal" data-reveal>
              <header className="home-tools__head">
                <p className="home-screen__label">{landing.benefits.label}</p>
                <h2 className="home-screen__title home-screen__title--section">
                  {landing.benefits.title}
                </h2>
                <p className="home-screen__text home-screen__text--tools">
                  {landing.benefits.text}
                </p>
              </header>

              <div className="home-tools__grid" aria-label="Key benefits">
                {landing.benefits.items.map((item, i) => {
                  const Icon = BENEFIT_ICONS[i];
                  return (
                    <article
                      key={item.title}
                      className="home-tools__card home-reveal"
                      data-reveal
                      style={{ transitionDelay: `${0.08 * i}s` }}
                    >
                      <span className="home-tools__icon" aria-hidden>
                        <Icon />
                      </span>
                      <h3 className="home-tools__title">{item.title}</h3>
                      <p className="home-tools__body">{item.body}</p>
                    </article>
                  );
                })}
              </div>

              <div className="home-tools__quote" aria-label="Value statement">
                <p className="home-tools__quote-kicker">{landing.benefits.quote.kicker}</p>
                <p className="home-tools__quote-text">
                  {landing.benefits.quote.text}
                  <span className="home-tools__quote-emph">{landing.benefits.quote.emphasis}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cta"
          className="home-section home-section--cta scroll-mt-28"
          aria-label="Get started"
        >
          <div
            className="home-section__inner home-section__inner--cta home-reveal"
            data-reveal
          >
            <div className="home-cta-card">
              <p className="home-screen__label">{landing.cta.label}</p>
              <h2 className="home-screen__title home-screen__title--sm">{landing.cta.title}</h2>
              <p className="home-screen__text">{landing.cta.text}</p>
              <div className="home-cta-card__actions">
                <button
                  type="button"
                  className="home-screen__cta"
                  onClick={openModal}
                >
                  {landing.cta.primary}
                </button>
                <a className="home-cta-card__link" href="#benefits">
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

      <LandingFooter />
    </div>
  );
}
