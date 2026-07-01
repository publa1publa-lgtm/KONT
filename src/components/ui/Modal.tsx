"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Kicker above the title (uppercase label). */
  title: string;
  /** Main heading; also used as `aria-labelledby` target. */
  subtitle?: string;
  /** Bottom dismiss button label (Cancel). */
  cancelLabel: string;
  children: ReactNode;
  /** Extra actions to the right of Cancel (e.g. primary submit). */
  footerExtra?: ReactNode;
  maxWidthClassName?: string;
  zIndexClassName?: string;
  portal?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  cancelLabel,
  children,
  footerExtra,
  maxWidthClassName = "max-w-2xl",
  zIndexClassName = "z-[80]",
  portal = true,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div className={cn("fixed inset-0 flex items-center justify-center overflow-hidden p-4", zIndexClassName)}>
      <div className="absolute inset-0 bg-[var(--studio-overlay)] backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex max-h-[min(92dvh,940px)] w-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--glass)] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.55)]",
          maxWidthClassName,
        )}
      >
        <div className="shrink-0 space-y-4 border-b border-[var(--line)] px-5 pb-4 pt-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</div>
            {subtitle ? (
              <h2 id={titleId} className="mt-2 text-lg font-semibold text-[var(--fg)]">
                {subtitle}
              </h2>
            ) : (
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]">
          <div className="grid gap-4">{children}</div>
        </div>

        <div className="shrink-0 border-t border-[var(--line)] bg-[var(--studio-surface-2)]/40 px-5 py-4">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-4 py-2 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]"
            >
              {cancelLabel}
            </button>
            {footerExtra}
          </div>
        </div>
      </div>
    </div>
  );

  return portal && typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}
