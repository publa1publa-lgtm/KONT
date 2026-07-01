"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useMessages } from "@/contexts/messages-context";

import { SECTIONS, type SectionId } from "./sections";
import { StudioTile } from "./StudioTile";

type StudioBlockProps = {
  section: SectionId;
  onTileSelect: (id: string) => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function StudioBlock({ section, onTileSelect }: StudioBlockProps) {
  const { studio } = useMessages();
  const reduced = useReducedMotion();
  const data = SECTIONS[section];
  const oddTileCount = data.items.length % 2 !== 0;

  return (
    <motion.section
      key={section}
      className="studio-panel"
      aria-label={studio.sections[section].label}
      initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(14px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduced ? undefined : { opacity: 0, y: -12, filter: "blur(14px)" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className={`studio-grid ${data.gridClass}${oddTileCount ? " studio-grid--odd" : ""}`}>
        {data.items.map((item, index) => (
          <StudioTile
            key={item.id}
            item={item}
            section={section}
            index={index}
            mobileLead={oddTileCount && index === 0}
            onSelect={onTileSelect}
          />
        ))}
      </div>
    </motion.section>
  );
}
