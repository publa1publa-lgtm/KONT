"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useMessages } from "@/contexts/messages-context";

import { StudioAccountMenu } from "./StudioAccountMenu";
import { SECTION_ORDER, type SectionId } from "./sections";
import { getStudioItemNavCopy } from "./studioItemNavCopy";

type StudioTopMenuProps = {
  activeSection: SectionId;
  activeItem: string | null;
  onSectionChange: (section: SectionId) => void;
  onBack: () => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

function StudioNavHintPopover({
  text,
  tipId,
  anchorRef,
  onClose,
}: {
  text: string;
  tipId: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;

    const rect = anchor.getBoundingClientRect();
    const popW = pop.offsetWidth;
    const vw = window.innerWidth;
    const pad = 12;
    const centerX = rect.left + rect.width / 2;
    let left = centerX - popW / 2;
    left = Math.max(pad, Math.min(left, vw - popW - pad));

    setCoords({ top: rect.bottom + 8, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    reposition();
  }, [text, reposition]);

  useEffect(() => {
    const onScroll = () => reposition();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [reposition]);

  useLayoutEffect(() => {
    const pop = popRef.current;
    if (!pop) return;
    const observer = new ResizeObserver(() => reposition());
    observer.observe(pop);
    return () => observer.disconnect();
  }, [reposition]);

  useEffect(() => {
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={popRef}
      id={tipId}
      role="tooltip"
      className={`studio-nav__hint-popover${coords ? " is-placed" : ""}`}
      style={coords ? { top: coords.top, left: coords.left } : undefined}
    >
      <div className="studio-nav__sections studio-nav__hint-shell">
        <div className="studio-nav__hint-body">
          <p className="studio-nav__hint-text">{text}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StudioTopMenu({
  activeSection,
  activeItem,
  onSectionChange,
  onBack,
}: StudioTopMenuProps) {
  const messages = useMessages();
  const { studio } = messages;
  const reduced = useReducedMotion();
  const insideItem = activeItem !== null;
  const itemCopy = activeItem ? getStudioItemNavCopy(activeItem, messages) : null;
  const [hintOpen, setHintOpen] = useState(false);
  const hintBtnRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();

  useEffect(() => {
    setHintOpen(false);
  }, [activeItem]);

  return (
    <>
      <AnimatePresence initial={false}>
        {insideItem && itemCopy ? (
          <motion.nav
            key="item"
            className="studio-nav studio-nav--item"
            aria-label="Selection"
            initial={reduced ? false : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="studio-nav__sections studio-nav__sections--item">
              <button
                type="button"
                onClick={onBack}
                className="studio-nav__tab studio-nav__tab--back cursor-pointer"
                aria-label={`${studio.back}: ${itemCopy.label}`}
              >
                <ArrowLeft className="studio-nav__tab-icon h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                <span className="studio-nav__tab-label studio-nav__back-label">{studio.back}</span>
              </button>

              <div className="studio-nav__tab studio-nav__tab--active studio-nav__item-title" aria-current="page">
                <motion.span
                  layoutId="studio-nav-item-active"
                  className="studio-nav__indicator"
                  aria-hidden
                  transition={{ duration: 0.45, ease: EASE }}
                />
                <span className="studio-nav__tab-label studio-nav__item-title-text">{itemCopy.label}</span>
                {itemCopy.description ? (
                  <button
                    ref={hintBtnRef}
                    type="button"
                    className={`studio-nav__hint-toggle${hintOpen ? " is-active" : ""} cursor-pointer`}
                    aria-label={studio.sectionInfo}
                    aria-expanded={hintOpen}
                    aria-controls={hintOpen ? tipId : undefined}
                    onClick={() => setHintOpen((open) => !open)}
                  >
                    <Info className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <div className="studio-dock">
        <nav className="studio-nav studio-nav--sections" aria-label="Sections">
          <div className="studio-nav__sections" role="tablist">
            {SECTION_ORDER.map((id) => {
              const selected = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`studio-panel-${id}`}
                  id={`studio-tab-${id}`}
                  onClick={() => onSectionChange(id)}
                  className={selected ? "studio-nav__tab studio-nav__tab--active cursor-pointer" : "studio-nav__tab cursor-pointer"}
                >
                  {selected && (
                    <motion.span
                      layoutId="studio-nav-section-active"
                      className="studio-nav__indicator"
                      aria-hidden
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                  <span className="studio-nav__tab-label">{studio.sections[id].label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        <StudioAccountMenu />
      </div>

      {hintOpen && itemCopy?.description ? (
        <StudioNavHintPopover
          text={itemCopy.description}
          tipId={tipId}
          anchorRef={hintBtnRef}
          onClose={() => setHintOpen(false)}
        />
      ) : null}
    </>
  );
}
