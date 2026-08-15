"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { LegalServiceIcon } from "@/components/legal/LegalServiceIcon";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { NewHomeNav } from "@/components/new_home/NewHomeNav";
import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";
import {
  LEGAL_SERVICES,
  legalPath,
  type LegalDocKind,
  type LegalServiceId,
} from "@/lib/legal/catalog";
import { getLegalDocument } from "@/lib/legal/content";

import "@/components/home/home-landing.css";
import "@/components/new_home/new-home.css";
import "@/components/new_home/new-home-rtl.css";
import "./legal-hub.css";

type LegalHubProps = {
  service: LegalServiceId;
  doc: LegalDocKind;
};

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, index) => {
    if (part.startsWith("http")) {
      return (
        <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    if (part.includes("@") && part.includes(".")) {
      return (
        <a key={`${part}-${index}`} href={`mailto:${part}`}>
          {part}
        </a>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function LegalHub({ service, doc }: LegalHubProps) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const copy = messages.legal;
  const legalDoc = getLegalDocument(service, doc);
  const active = LEGAL_SERVICES.find((item) => item.id === service) ?? LEGAL_SERVICES[0];

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ y: 0, height: 56 });

  const go = (nextService: LegalServiceId, nextDoc: LegalDocKind = doc) => {
    router.push(withLocale(locale, legalPath(nextService, nextDoc)));
  };

  useEffect(() => {
    document.documentElement.classList.add("home-route-active", "nh-hybrid-active");
    return () => {
      document.documentElement.classList.remove("home-route-active", "nh-hybrid-active");
    };
  }, []);

  useLayoutEffect(() => {
    const index = LEGAL_SERVICES.findIndex((item) => item.id === service);
    const node = itemRefs.current[index];
    const track = trackRef.current;
    if (!node || !track) return;

    const update = () => {
      setIndicator({ y: node.offsetTop, height: node.offsetHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(track);
    observer.observe(node);
    return () => observer.disconnect();
  }, [service]);

  useEffect(() => {
    const index = LEGAL_SERVICES.findIndex((item) => item.id === service);
    itemRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [service]);

  return (
    <div className="home-page nh-hybrid legal-page">
      <NewHomeNav />

      <main className="legal-hub">
        <div className="legal-hub__layout">
          <aside className="legal-hub__slide" aria-label={copy.services}>
            <div className="legal-hub__slide-head">
              <p className="legal-hub__slide-label">{copy.services}</p>
              <h2 className="legal-hub__slide-title">{copy.selectService}</h2>
            </div>

            <div
              ref={trackRef}
              className="legal-hub__track"
              role="tablist"
              aria-orientation="vertical"
              onKeyDown={(event) => {
                const index = LEGAL_SERVICES.findIndex((item) => item.id === service);
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  const next = LEGAL_SERVICES[(index + 1) % LEGAL_SERVICES.length];
                  go(next.id);
                }
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next = LEGAL_SERVICES[(index - 1 + LEGAL_SERVICES.length) % LEGAL_SERVICES.length];
                  go(next.id);
                }
              }}
            >
              <div
                className="legal-hub__indicator"
                style={{ transform: `translateY(${indicator.y}px)`, height: indicator.height }}
                aria-hidden="true"
              />
              {LEGAL_SERVICES.map((item, index) => {
                const selected = item.id === service;
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={selected ? "legal-hub__service is-active" : "legal-hub__service"}
                    onClick={() => go(item.id)}
                  >
                    <span className="legal-hub__service-icon">
                      <LegalServiceIcon id={item.id} className="legal-hub__service-logo" />
                    </span>
                    <span className="legal-hub__service-copy">
                      <span className="legal-hub__service-name">{item.name}</span>
                      <span className="legal-hub__service-short">{item.short}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="legal-hub__stage">
            <article className="legal-hub__panel" key={`${service}-${doc}`}>
              <div className="legal-hub__tabs" role="tablist" aria-label={copy.documents}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={doc === "terms"}
                  className={doc === "terms" ? "legal-hub__tab is-active" : "legal-hub__tab"}
                  onClick={() => go(service, "terms")}
                >
                  {copy.termsTitle}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={doc === "privacy"}
                  className={doc === "privacy" ? "legal-hub__tab is-active" : "legal-hub__tab"}
                  onClick={() => go(service, "privacy")}
                >
                  {copy.privacyTitle}
                </button>
              </div>

              <p className="legal-hub__eyebrow">{active.name}</p>
              <h1 className="legal-hub__title">{legalDoc.title}</h1>
              <p className="legal-hub__updated">
                {copy.lastUpdated}: {legalDoc.updatedAt}
              </p>
              <p className="legal-hub__summary">{legalDoc.summary}</p>

              <div className="legal-hub__article" data-animate="in">
                {legalDoc.sections.map((section) => (
                  <section key={section.id} id={section.id} className="legal-hub__section">
                    <h2 className="legal-hub__section-title">{section.title}</h2>
                    {section.blocks.map((block, index) => {
                      if (block.type === "ul") {
                        return (
                          <ul key={`${section.id}-ul-${index}`} className="legal-hub__list">
                            {block.items.map((item) => (
                              <li key={item} className="legal-hub__list-item">
                                {linkify(item)}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.type === "note") {
                        return (
                          <p key={`${section.id}-note-${index}`} className="legal-hub__note">
                            {linkify(block.text)}
                          </p>
                        );
                      }
                      return (
                        <p key={`${section.id}-p-${index}`} className="legal-hub__text">
                          {linkify(block.text)}
                        </p>
                      );
                    })}
                  </section>
                ))}
              </div>
            </article>

            <nav className="legal-hub__toc" aria-label={copy.onThisPage}>
              <p className="legal-hub__toc-label">{copy.onThisPage}</p>
              <ol className="legal-hub__toc-list">
                {legalDoc.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s*/, "")}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </main>

      <LandingFooter variant="landing" />
    </div>
  );
}
