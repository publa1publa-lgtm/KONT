"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { useMessages } from "@/contexts/messages-context";

import { SECTION_ORDER, type SectionId } from "./sections";
import { getStudioItemNavCopy } from "./studioItemNavCopy";

type StudioTopMenuProps = {
  activeSection: SectionId;
  activeItem: string | null;
  onSectionChange: (section: SectionId) => void;
  onBack: () => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

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

  return (
    <nav className="studio-nav" aria-label={insideItem ? "Selection" : "Sections"}>
      <AnimatePresence mode="wait" initial={false}>
        {insideItem && itemCopy ? (
          <motion.div
            key="inside"
            className="studio-nav__inside studio-nav__inside--item"
            initial={reduced ? false : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <button
              type="button"
              onClick={onBack}
              className="studio-nav__back studio-nav__back--item cursor-pointer"
              aria-label={`${studio.back}: ${itemCopy.label}`}
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              <span>{studio.back}</span>
            </button>

            <div className="studio-nav__item-title">
              <span className="studio-nav__item-title-text">{itemCopy.label}</span>
            </div>

            {itemCopy.description ? (
              <p className="studio-nav__item-desc">{itemCopy.description}</p>
            ) : (
              <span className="studio-nav__item-desc studio-nav__item-desc--empty" aria-hidden />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sections"
            className="studio-nav__sections"
            role="tablist"
            initial={reduced ? false : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={reduced ? undefined : { opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.3, ease: EASE }}
          >
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
                      layoutId="studio-nav-active"
                      className="studio-nav__indicator"
                      aria-hidden
                      transition={{ duration: 0.45, ease: EASE }}
                    />
                  )}
                  <span className="studio-nav__tab-label">{studio.sections[id].label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
