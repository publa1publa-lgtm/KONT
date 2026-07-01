"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { type SectionId } from "./sections";
import { StudioBlock } from "./StudioBlock";
import { StudioItemView } from "./StudioItemView";
import { StudioTopMenu } from "./StudioTopMenu";
import {
  buildStudioHref,
  getSectionForItem,
  parseStudioItemFromPathname,
  parseStudioSectionFromPathname,
} from "./studioRouting";

import "./studio.css";

export function StudioShell() {
  const pathname = usePathname();
  const router = useRouter();

  const activeItem = useMemo(() => parseStudioItemFromPathname(pathname), [pathname]);

  const activeSection = useMemo(() => parseStudioSectionFromPathname(pathname), [pathname]);

  useEffect(() => {
    document.documentElement.classList.add("studio-route-active", "theme-studio-light");
    return () => {
      document.documentElement.classList.remove("studio-route-active", "theme-studio-light");
    };
  }, []);

  const openItem = useCallback(
    (itemId: string) => {
      const href = buildStudioHref({ item: itemId });
      if (href !== pathname) {
        router.push(href);
      }
    },
    [pathname, router],
  );

  const handleSectionChange = useCallback(
    (section: SectionId) => {
      if (activeItem) return;
      const href = buildStudioHref({ section });
      if (href !== pathname) {
        router.push(href);
      }
    },
    [activeItem, pathname, router],
  );

  const handleTileSelect = useCallback(
    (itemId: string) => {
      openItem(itemId);
    },
    [openItem],
  );

  const handleBack = useCallback(() => {
    const section = activeItem ? getSectionForItem(activeItem) ?? activeSection : activeSection;
    const href = buildStudioHref({ section });
    if (href !== pathname) {
      router.push(href);
    }
  }, [activeItem, activeSection, pathname, router]);

  return (
    <div className="studio-page">
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
