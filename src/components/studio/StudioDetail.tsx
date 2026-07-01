"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellIcon } from "@phosphor-icons/react";
import { ArrowLeft } from "lucide-react";

import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";

import { SECTIONS, type SectionId } from "./sections";

type StudioDetailProps = {
  itemId: string;
  section: SectionId;
  onBack: () => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

function findItem(itemId: string) {
  for (const section of Object.values(SECTIONS)) {
    const match = section.items.find((item) => item.id === itemId);
    if (match) return match;
  }
  return null;
}

export function StudioDetail({ itemId, section, onBack }: StudioDetailProps) {
  const { studio } = useMessages();
  const { openModal } = useDemoModal();
  const reduced = useReducedMotion();

  const item = findItem(itemId);
  const Icon = item?.icon ?? BellIcon;
  const copy = studio.items[itemId as keyof typeof studio.items];
  const sectionLabel = studio.sections[section].label;
  const detailCopy = studio.itemDetails?.[itemId as keyof typeof studio.itemDetails];
  const body = detailCopy?.body ?? studio.detail.body;
  const primary = detailCopy?.primary ?? studio.detail.primary;

  return (
    <motion.section
      className="studio-detail"
      aria-label={copy?.label ?? itemId}
      initial={reduced ? false : { opacity: 0, scale: 0.985, filter: "blur(16px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.985, filter: "blur(16px)" }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <div className="studio-detail__aura" aria-hidden />
      <div className="studio-detail__inner">
        <span className="studio-detail__icon" aria-hidden>
          <Icon weight="duotone" aria-hidden />
        </span>
        <p className="studio-detail__kicker">{studio.detail.kicker}</p>
        <h2 className="studio-detail__title">{copy?.label ?? itemId}</h2>
        <p className="studio-detail__body">{body}</p>

        <div className="studio-detail__actions">
          <button type="button" onClick={openModal} className="studio-btn studio-btn--primary cursor-pointer">
            <BellIcon weight="duotone" className="h-4 w-4" aria-hidden />
            {primary}
          </button>
          <button type="button" onClick={onBack} className="studio-btn studio-btn--ghost cursor-pointer">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            {studio.detail.secondary.replace("{section}", sectionLabel)}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
