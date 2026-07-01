"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { I18nProvider } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import type { AppLocale } from "@/i18n/config";
import type { AppMessages } from "@/i18n/messages";

import { ITEM_REGISTRY } from "./itemRegistry";
import { StudioDetail } from "./StudioDetail";
import type { SectionId } from "./sections";

type StudioItemViewProps = {
  itemId: string;
  section: SectionId;
  onBack: () => void;
};

const EASE = [0.16, 1, 0.3, 1] as const;

function StudioFeatureFrame({ children }: { children: ReactNode }) {
  return (
    <div className="studio-feature">
      <div className="studio-feature__body">{children}</div>
    </div>
  );
}

function StudioItemViewInner({ itemId, section, onBack }: StudioItemViewProps) {
  const reduced = useReducedMotion();
  const entry = ITEM_REGISTRY[itemId];

  if (!entry?.wired || !entry.View) {
    return <StudioDetail itemId={itemId} section={section} onBack={onBack} />;
  }

  const View = entry.View;

  return (
    <motion.section
      className="studio-detail studio-detail--feature"
      aria-label={itemId}
      initial={reduced ? false : { opacity: 0, scale: 0.99, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.99, filter: "blur(12px)" }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <div className="studio-detail__aura" aria-hidden />
      <StudioFeatureFrame>
        <View onBack={onBack} />
      </StudioFeatureFrame>
    </motion.section>
  );
}

/** Wraps feature views with i18n context expected by ported contentfabric components. */
export function StudioItemView(props: StudioItemViewProps) {
  const messages = useMessages() as unknown as AppMessages;
  const locale: AppLocale = "en";

  return (
    <I18nProvider locale={locale} messages={messages}>
      <StudioItemViewInner {...props} />
    </I18nProvider>
  );
}
