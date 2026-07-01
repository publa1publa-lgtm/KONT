"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, KeyboardEvent } from "react";

import { useMessages } from "@/contexts/messages-context";

import { STUDIO_TILE_ARROW, type SectionId } from "./sections";
import type { StudioItem } from "./sections";

type StudioTileProps = {
  item: StudioItem;
  section: SectionId;
  index: number;
  onSelect: (id: string) => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function StudioTile({ item, section, index, onSelect }: StudioTileProps) {
  const { studio } = useMessages();
  const reduced = useReducedMotion();
  const Icon = item.icon;
  const Arrow = STUDIO_TILE_ARROW;
  const copy = studio.items[item.id as keyof typeof studio.items];
  const compact = item.variant === "compact";

  const style: CSSProperties = { gridArea: item.area };

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
      data-variant={compact ? "compact" : undefined}
      style={style}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
      className="studio-tile"
      initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, delay: 0.05 * index, ease: EASE }}
      whileHover={reduced ? undefined : { y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.995 }}
    >
      <span className="studio-tile__sheen" aria-hidden />

      {compact ? (
        <>
          <span className="studio-tile__icon" aria-hidden>
            <Icon weight="duotone" aria-hidden />
          </span>
          <div className="studio-tile__foot">
            <span className="studio-tile__label">{copy.label}</span>
            <span className="studio-tile__pitch">{copy.hint}</span>
          </div>
          <span className="studio-tile__arrow" aria-hidden>
            <Arrow weight="bold" aria-hidden />
          </span>
        </>
      ) : (
        <>
          <div className="studio-tile__top">
            <span className="studio-tile__icon" aria-hidden>
              <Icon weight="duotone" aria-hidden />
            </span>
            <span className="studio-tile__arrow" aria-hidden>
              <Arrow weight="bold" aria-hidden />
            </span>
          </div>
          <div className="studio-tile__foot">
            <span className="studio-tile__label">{copy.label}</span>
            <span className="studio-tile__pitch">{copy.hint}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
