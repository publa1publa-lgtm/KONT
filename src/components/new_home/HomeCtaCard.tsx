"use client";

import { ArrowRight } from "lucide-react";

import { useMessages } from "@/contexts/messages-context";
import { useStartWorkspace } from "@/hooks/useStartWorkspace";

export function HomeCtaCard() {
  const { landing, story } = useMessages();
  const { start, isAuthenticated, studioHref } = useStartWorkspace();
  const label = isAuthenticated ? story.nav.studio : landing.cta.primary;

  return (
    <div className="home-cta-card">
      <span className="home-cta-card__badge">
        <span className="home-hero__badge-dot" aria-hidden />
        {landing.cta.badge}
      </span>
      <h2 className="home-screen__title home-screen__title--sm">{landing.cta.title}</h2>
      <p className="home-screen__text home-cta-card__text">{landing.cta.text}</p>

      <div className="home-cta-card__actions">
        {isAuthenticated ? (
          <a href={studioHref} className="home-screen__cta">
            {label}
            <ArrowRight className="home-screen__cta-icon" aria-hidden />
          </a>
        ) : (
          <button type="button" className="home-screen__cta cursor-pointer" onClick={start}>
            {label}
            <ArrowRight className="home-screen__cta-icon" aria-hidden />
          </button>
        )}
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
  );
}
