"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/contexts/i18n-context";
import { subscribeToasts, toast, type ToastItem, type ToastType } from "@/lib/toast";

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

function ToastCard({
  item,
  acknowledgeLabel,
  dismissLabel,
}: {
  item: ToastItem;
  acknowledgeLabel: string;
  dismissLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const Icon = ICONS[item.type];

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`studio-toast studio-toast--${item.type}`}
      role={item.type === "error" || item.type === "warning" ? "alert" : "status"}
    >
      <span className="studio-toast__icon" aria-hidden>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <p className="studio-toast__message">{item.message}</p>
      {item.type === "error" ? (
        <button type="button" className="studio-toast__ack" onClick={() => toast.dismiss(item.id)}>
          {acknowledgeLabel}
        </button>
      ) : (
        <button
          type="button"
          className="studio-toast__close"
          aria-label={dismissLabel}
          onClick={() => toast.dismiss(item.id)}
        >
          ×
        </button>
      )}
    </motion.li>
  );
}

export function ToastHost() {
  const { messages } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ToastItem[]>([]);
  const acknowledgeLabel = messages.studio.toasts.acknowledge;
  const dismissLabel = messages.studio.toasts.dismiss;

  useEffect(() => {
    setMounted(true);
    return subscribeToasts(setItems);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="studio-toast-root" aria-live="polite" aria-relevant="additions text">
      <ul className="studio-toast-stack">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              acknowledgeLabel={acknowledgeLabel}
              dismissLabel={dismissLabel}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>,
    document.body,
  );
}
