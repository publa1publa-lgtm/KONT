"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { type SectionId } from "./sections";
import { StudioBlock } from "./StudioBlock";
import { StudioItemView } from "./StudioItemView";
import { StudioTopMenu } from "./StudioTopMenu";
import { STUDIO_PHONE_MQ } from "./studioPhone";
import {
  buildStudioHref,
  getSectionForItem,
  parseStudioItemFromPathname,
  parseStudioSectionFromPathname,
} from "./studioRouting";

import {
  applyStudioTheme,
  readStudioTheme,
} from "@/lib/studio/preferences";

import "./studio.css";

export function StudioShell() {
  const pathname = usePathname();
  const router = useRouter();

  const activeItem = useMemo(() => parseStudioItemFromPathname(pathname), [pathname]);

  const activeSection = useMemo(() => parseStudioSectionFromPathname(pathname), [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("studio-route-active");
    const theme = readStudioTheme();
    applyStudioTheme(theme);
    // Re-apply locale font now that studio class is present (Hebrew → Gladiaclm only here).
    const lang = root.lang;
    root.classList.toggle("font-hebrew", lang === "he");
    return () => {
      root.classList.remove("studio-route-active", "theme-studio-light", "font-hebrew");
      delete root.dataset.studioTheme;
    };
  }, []);

  const openItem = useCallback(
    (itemId: string) => {
      const href = buildStudioHref({ item: itemId, pathname });
      if (href !== pathname) {
        router.push(href);
      }
    },
    [pathname, router],
  );

  const handleSectionChange = useCallback(
    (section: SectionId) => {
      const href = buildStudioHref({ section, pathname });
      if (href !== pathname) {
        router.push(href);
      }
    },
    [pathname, router],
  );

  const handleTileSelect = useCallback(
    (itemId: string) => {
      openItem(itemId);
    },
    [openItem],
  );

  const handleBack = useCallback(() => {
    const section = activeItem ? getSectionForItem(activeItem) ?? activeSection : activeSection;
    const href = buildStudioHref({ section, pathname });
    if (href !== pathname) {
      router.push(href);
    }
  }, [activeItem, activeSection, pathname, router]);

  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(STUDIO_PHONE_MQ);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={["studio-page", activeItem ? "studio-page--item" : "", phone ? "studio-page--phone" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="studio-scene" aria-hidden>
        <span className="studio-scene__orb studio-scene__orb--blue" />
        <span className="studio-scene__orb studio-scene__orb--violet" />
        <span className="studio-scene__orb studio-scene__orb--ice" />
        <span className="studio-scene__orb studio-scene__orb--pink" />
        <span className="studio-scene__grid" />
      </div>

      <main className="studio-stage">
        <StudioTopMenu
          activeSection={activeSection}
          activeItem={activeItem}
          onSectionChange={handleSectionChange}
          onBack={handleBack}
        />

        <div
          id={`studio-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`studio-tab-${activeSection}`}
          className="studio-surface"
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeItem !== null ? (
              <StudioItemView
                key={`detail-${activeItem}`}
                itemId={activeItem}
                section={activeSection}
                onBack={handleBack}
              />
            ) : (
              <StudioBlock key={`block-${activeSection}`} section={activeSection} onTileSelect={handleTileSelect} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
