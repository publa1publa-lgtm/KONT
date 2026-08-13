"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

import { useI18n } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import { intlLocale } from "@/i18n/config";

import { StudioCalendarTilePreview } from "./StudioCalendarTilePreview";
import { STUDIO_TILE_ARROW, type SectionId } from "./sections";
import type { StudioItem } from "./sections";

const STUDIO_MOBILE_GRID_MQ = "(max-width: 768px)";

type StudioTileProps = {
  item: StudioItem;
  section: SectionId;
  index: number;
  mobileLead?: boolean;
  onSelect: (id: string) => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function StudioTile({ item, section, index, mobileLead = false, onSelect }: StudioTileProps) {
  const { studio } = useMessages();
  const { locale } = useI18n();
  const reduced = useReducedMotion();
  const [mobileGrid, setMobileGrid] = useState(false);
  const Icon = item.icon;
  const Arrow = STUDIO_TILE_ARROW;
  const copy = studio.items[item.id as keyof typeof studio.items];
  const isCalendar = item.id === "calendar";
  const monthLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat(intlLocale(locale), {
      month: "long",
      year: "numeric",
    }).format(new Date());
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [locale]);

  useEffect(() => {
    const mq = window.matchMedia(STUDIO_MOBILE_GRID_MQ);
    const sync = () => setMobileGrid(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const style: CSSProperties | undefined = mobileGrid
    ? mobileLead
      ? { gridColumn: "1 / -1" }
      : undefined
    : { gridArea: item.area };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={copy.label}
      data-tile-id={item.id}
      data-section={section}
      style={style}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      className={[
        "studio-tile",
        mobileLead ? "studio-tile--mobile-lead" : "",
        isCalendar ? "studio-tile--calendar" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay: 0.05 * index, ease: EASE }}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.995 }}
    >
      <span className="studio-tile__sheen" aria-hidden />

      <div className="studio-tile__top">
        <span className="studio-tile__icon" aria-hidden>
          <Icon weight="duotone" aria-hidden />
        </span>
        {isCalendar ? <span className="studio-tile__month">{monthLabel}</span> : null}
        <span className="studio-tile__arrow" aria-hidden>
          <Arrow weight="bold" aria-hidden />
        </span>
      </div>
      {isCalendar ? (
        <div className="studio-tile__preview" aria-hidden>
          <StudioCalendarTilePreview />
        </div>
      ) : null}

      <div className="studio-tile__foot">
        <span className="studio-tile__label">{copy.label}</span>
        <span className="studio-tile__pitch">{copy.hint}</span>
      </div>
    </motion.div>
  );
}
