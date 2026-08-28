"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { LandingFooter } from "@/components/layout/LandingFooter";
import { LegalDocSwitch } from "@/components/legal/LegalDocSwitch";
import { NewHomeNav } from "@/components/new_home/NewHomeNav";
import { useI18n } from "@/contexts/i18n-context";
import { type LegalDocKind } from "@/lib/legal/catalog";
import { getLegalDocument } from "@/lib/legal/content";
import { groupLegalSections } from "@/lib/legal/toc";

import "@/components/home/home-landing.css";
import "@/components/new_home/new-home.css";
import "@/components/new_home/new-home-rtl.css";
import "./legal-hub.css";

type LegalHubProps = {
  doc: LegalDocKind;
};

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, index) => {
    if (part.startsWith("http")) {
      const punct = part.match(/[.,;:)]+$/)?.[0] ?? "";
      const href = punct ? part.slice(0, -punct.length) : part;
      return (
        <span key={`${part}-${index}`}>
          <a href={href} target="_blank" rel="noreferrer">
            {href.replace(/^https?:\/\//, "")}
          </a>
          {punct}
        </span>
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

function splitSectionTitle(title: string) {
  const match = title.match(/^(\d+)\.\s+(.+)$/);
  if (!match) return { index: null as string | null, heading: title };
  return { index: match[1].padStart(2, "0"), heading: match[2] };
}

function tocGroupLabel(
  toc: { terms: Record<string, string>; privacy: Record<string, string> },
  doc: LegalDocKind,
  id: string,
) {
  return (doc === "terms" ? toc.terms[id] : toc.privacy[id]) ?? id;
}

function jumpOffset() {
  const nav = document.querySelector(".new-home-nav__shell");
  const navBottom = nav instanceof HTMLElement ? nav.getBoundingClientRect().bottom : 72;
  const mobile = window.matchMedia("(max-width: 1179px)").matches;
  if (!mobile) return navBottom + 16;
  const toc = document.querySelector(".legal-hub__toc");
  const tocHeight = toc instanceof HTMLElement ? toc.getBoundingClientRect().height : 0;
  return navBottom + tocHeight + 10;
}

function pinSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const top = Math.max(0, node.getBoundingClientRect().top + window.scrollY - jumpOffset());
  window.scrollTo(0, top);
}

export function LegalHub({ doc }: LegalHubProps) {
  const pathname = usePathname();
  const { messages } = useI18n();
  const copy = messages.legal;
  const tocFoldRef = useRef<HTMLDetailsElement>(null);

  const legalDoc = useMemo(() => getLegalDocument(doc), [doc]);
  const groups = useMemo(() => groupLegalSections(doc, legalDoc.sections), [doc, legalDoc]);
  const [activeSection, setActiveSection] = useState(legalDoc.sections[0]?.id ?? "");

  const closeMobileToc = useCallback(() => {
    const fold = tocFoldRef.current;
    if (!fold) return;
    if (window.matchMedia("(max-width: 1179px)").matches) fold.open = false;
  }, []);

  const jumpTo = useCallback(
    (id: string, event?: MouseEvent<HTMLAnchorElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      closeMobileToc();
      pinSection(id);
      window.history.replaceState(null, "", `${pathname}#${id}`);
      pinSection(id);
      setActiveSection(id);
      requestAnimationFrame(() => pinSection(id));
    },
    [closeMobileToc, pathname],
  );

  useEffect(() => {
    document.documentElement.classList.add("home-route-active", "nh-hybrid-active", "legal-route-active");
    return () => {
      document.documentElement.classList.remove("home-route-active", "nh-hybrid-active", "legal-route-active");
    };
  }, []);

  useEffect(() => {
    const fold = tocFoldRef.current;
    if (!fold) return undefined;
    const media = window.matchMedia("(min-width: 1180px)");
    const sync = () => {
      if (media.matches) fold.open = true;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [doc]);

  useEffect(() => {
    const fold = tocFoldRef.current;
    if (!fold) return undefined;

    const onPointer = (event: PointerEvent) => {
      if (!fold.open || fold.contains(event.target as Node)) return;
      if (window.matchMedia("(max-width: 1179px)").matches) fold.open = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileToc();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeMobileToc]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const fromHash = legalDoc.sections.some((section) => section.id === hash) ? hash : "";
    setActiveSection(fromHash || legalDoc.sections[0]?.id || "");
    if (!fromHash) return undefined;
    pinSection(fromHash);
    requestAnimationFrame(() => pinSection(fromHash));
    return undefined;
  }, [legalDoc]);

  return (
    <div className="home-page nh-hybrid legal-page">
      <NewHomeNav />

      <main className="legal-hub">
        <div className="legal-hub__stage">
          <article className="legal-hub__doc">
            <header className="legal-hub__mast">
              <h1 className="legal-hub__title">{legalDoc.title}</h1>
              <p className="legal-hub__meta">
                {copy.lastUpdated} {legalDoc.updatedAt}
              </p>
            </header>

            <p className="legal-hub__lede">{legalDoc.summary}</p>

            <div className="legal-hub__body">
              {groups.map((group) => (
                <div key={group.id} className="legal-hub__chapter">
                  <p className="legal-hub__chapter-label">{tocGroupLabel(copy.toc, doc, group.id)}</p>
                  {group.sections.map((section) => {
                    const { index, heading } = splitSectionTitle(section.title);
                    return (
                      <section key={`${doc}-${section.id}`} id={section.id} className="legal-hub__section">
                        {index ? (
                          <span className="legal-hub__index" aria-hidden="true">
                            {index}
                          </span>
                        ) : null}
                        <div className="legal-hub__section-main">
                          <h2 className="legal-hub__section-title">{heading}</h2>
                          {section.blocks.map((block, blockIndex) => {
                            if (block.type === "ul") {
                              return (
                                <ul key={`${section.id}-ul-${blockIndex}`} className="legal-hub__list">
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
                                <p key={`${section.id}-note-${blockIndex}`} className="legal-hub__note">
                                  {linkify(block.text)}
                                </p>
                              );
                            }
                            return (
                              <p key={`${section.id}-p-${blockIndex}`} className="legal-hub__text">
                                {linkify(block.text)}
                              </p>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>

          <aside className="legal-hub__toc">
            <LegalDocSwitch doc={doc} />
            <details ref={tocFoldRef} className="legal-hub__toc-fold">
              <summary className="legal-hub__toc-summary" aria-label={copy.contents}>
                <ChevronDown aria-hidden className="legal-hub__toc-chevron" strokeWidth={2} />
              </summary>

              <nav className="legal-hub__toc-inner" aria-label={copy.contents}>
                {groups.map((group) => {
                  const current = group.sections.some((section) => section.id === activeSection);
                  const firstId = group.sections[0]?.id;
                  return (
                    <div
                      key={group.id}
                      className={current ? "legal-hub__toc-group is-current" : "legal-hub__toc-group"}
                    >
                      {firstId ? (
                        <a
                          href={`#${firstId}`}
                          className="legal-hub__toc-group-label"
                          onClick={(event) => jumpTo(firstId, event)}
                        >
                          {tocGroupLabel(copy.toc, doc, group.id)}
                        </a>
                      ) : (
                        <p className="legal-hub__toc-group-label">{tocGroupLabel(copy.toc, doc, group.id)}</p>
                      )}
                      <ol className="legal-hub__toc-list">
                        {group.sections.map((section) => {
                          const { index, heading } = splitSectionTitle(section.title);
                          const active = section.id === activeSection;
                          return (
                            <li key={section.id}>
                              <a
                                href={`#${section.id}`}
                                className={active ? "legal-hub__toc-link is-active" : "legal-hub__toc-link"}
                                aria-current={active ? "location" : undefined}
                                onClick={(event) => jumpTo(section.id, event)}
                              >
                                {index ? <span className="legal-hub__toc-num">{index}</span> : null}
                                <span className="legal-hub__toc-text">{heading}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  );
                })}
              </nav>
            </details>
          </aside>
        </div>
      </main>

      <LandingFooter variant="landing" />
    </div>
  );
}
