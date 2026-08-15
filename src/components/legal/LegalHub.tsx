"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { LegalServiceIcon } from "@/components/legal/LegalServiceIcon";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { NewHomeNav } from "@/components/new_home/NewHomeNav";
import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";
import {
  LEGAL_SERVICES,
  legalPath,
  parseLegalPathname,
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
  const pathname = usePathname();
  const { locale, messages } = useI18n();
  const copy = messages.legal;
  const fromPath = parseLegalPathname(pathname || "") ?? { service, doc };
  const [override, setOverride] = useState<{ service: LegalServiceId; doc: LegalDocKind } | null>(null);
  const selected = override ?? fromPath;

  useEffect(() => {
    setOverride(null);
  }, [pathname]);
  const legalDoc = useMemo(
    () => getLegalDocument(selected.service, selected.doc),
    [selected.service, selected.doc],
  );
  const active = LEGAL_SERVICES.find((item) => item.id === selected.service) ?? LEGAL_SERVICES[0];

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const go = (nextService: LegalServiceId, nextDoc: LegalDocKind = selected.doc) => {
    if (nextService === selected.service && nextDoc === selected.doc) return;
    setOverride({ service: nextService, doc: nextDoc });
    window.history.pushState(null, "", withLocale(locale, legalPath(nextService, nextDoc)));
  };

  useEffect(() => {
    document.documentElement.classList.add("home-route-active", "nh-hybrid-active");
    return () => {
      document.documentElement.classList.remove("home-route-active", "nh-hybrid-active");
    };
  }, []);

  useLayoutEffect(() => {
    const index = LEGAL_SERVICES.findIndex((item) => item.id === selected.service);
    const node = itemRefs.current[index];
    const track = trackRef.current;
    if (!node || !track || track.scrollWidth <= track.clientWidth) return;

    const trackRect = track.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const overflow = nodeRect.left < trackRect.left + 8 || nodeRect.right > trackRect.right - 8;
    if (!overflow) return;

    const left = node.offsetLeft - (track.clientWidth - node.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [selected.service]);

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
                const index = LEGAL_SERVICES.findIndex((item) => item.id === selected.service);
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  go(LEGAL_SERVICES[(index + 1) % LEGAL_SERVICES.length].id);
                }
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  go(LEGAL_SERVICES[(index - 1 + LEGAL_SERVICES.length) % LEGAL_SERVICES.length].id);
                }
              }}
            >
              {LEGAL_SERVICES.map((item, index) => {
                const isSelected = item.id === selected.service;
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={isSelected ? "legal-hub__service is-active" : "legal-hub__service"}
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
            <article className="legal-hub__panel">
              <div className="legal-hub__tabs" role="tablist" aria-label={copy.documents}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected.doc === "terms"}
                  className={selected.doc === "terms" ? "legal-hub__tab is-active" : "legal-hub__tab"}
                  onClick={() => go(selected.service, "terms")}
                >
                  {copy.termsTitle}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected.doc === "privacy"}
                  className={selected.doc === "privacy" ? "legal-hub__tab is-active" : "legal-hub__tab"}
                  onClick={() => go(selected.service, "privacy")}
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

              <div className="legal-hub__article">
                {legalDoc.sections.map((section) => (
                  <section key={`${selected.service}-${selected.doc}-${section.id}`} id={section.id} className="legal-hub__section">
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
