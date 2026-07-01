"use client";

import { Check, X } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";

export function ConnectionToggle({
  connected,
  className = "",
  label,
}: {
  connected: boolean;
  className?: string;
  /** If set, fixed left text (overrides Online / Offline). */
  label?: string;
}) {
  const { messages } = useI18n();
  const C = messages.studio.connection;
  const stateText = connected ? C.online : C.offline;
  const text = label ?? stateText;
  const ariaTemplate = connected ? C.ariaConnected : C.ariaDisconnected;
  const ariaLabel = ariaTemplate.replace("{state}", stateText);

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={[
        "inline-flex shrink-0 select-none items-stretch overflow-hidden rounded-lg border text-start shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[2px] transition-[box-shadow,border-color,color,background-color] duration-200",
        connected
          ? "border-[var(--ice)]/28 bg-[color-mix(in_srgb,var(--ice)_12%,var(--studio-surface-3))] shadow-[0_12px_36px_-28px_rgba(0,234,255,0.35)]"
          : "border-[var(--line)] bg-[var(--studio-surface-3)]/90 shadow-[0_10px_28px_-26px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "flex min-w-[4.25rem] items-center justify-center px-2 py-1 text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200",
          connected ? "text-[var(--ice)]/95" : "text-[var(--muted)]",
        ].join(" ")}
      >
        {text}
      </span>
      <span
        className={[
          "flex w-7 items-center justify-center border-s",
          connected
            ? "border-[var(--ice)]/22 bg-[color-mix(in_srgb,var(--ice)_18%,transparent)] text-[var(--ice)]"
            : "border-[var(--line)] bg-[var(--studio-surface-2)] text-[var(--muted)]",
        ].join(" ")}
      >
        {connected ? (
          <Check className="h-3.5 w-3.5" strokeWidth={2.75} aria-hidden />
        ) : (
          <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        )}
      </span>
    </div>
  );
}
