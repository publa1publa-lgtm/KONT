"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

import { StudioModalPortal } from "@/components/studio/StudioModalPortal";
import { StudioGhostButton } from "./StudioCreateButton";

type StudioDialogHeaderProps = { titleId: string };

/**
 * Modal shell aligned with ContentComposerModal (overlay + portaled dialog card).
 */
export function StudioDialog({
  open,
  onClose,
  label,
  title,
  description,
  header,
  children,
  footer,
  cancelLabel = "Cancel",
  widthClassName = "w-full max-w-[480px]",
  maxHeightClassName = "max-h-[min(92dvh,680px)]",
  heightClassName = "",
  bodyClassName = "",
  showCloseButton = true,
  fillViewport = false,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  title?: string;
  description?: string;
  header?: ReactNode | ((props: StudioDialogHeaderProps) => ReactNode);
  children: ReactNode;
  footer?: ReactNode;
  cancelLabel?: string;
  widthClassName?: string;
  maxHeightClassName?: string;
  heightClassName?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  fillViewport?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const headerNode = typeof header === "function" ? header({ titleId }) : header;

  return (
    <StudioModalPortal>
      <div
        className={[
          "studio-dialog-overlay fixed inset-0 z-50 flex justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-6 sm:pb-6",
          fillViewport ? "studio-dialog-overlay--sheet items-stretch sm:items-center" : "items-start",
        ].join(" ")}
      >
        <button
          type="button"
          className="absolute inset-0 cursor-default bg-[var(--studio-overlay)] backdrop-blur-sm"
          aria-label={cancelLabel}
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title || header ? titleId : undefined}
          className={[
            "studio-dialog-card relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border shadow-[0_40px_120px_-60px_rgba(15,23,42,0.22)]",
            fillViewport ? "studio-dialog-card--sheet mb-0 h-[min(92dvh,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)]" : "mb-8",
            widthClassName,
            heightClassName,
            !fillViewport ? maxHeightClassName : "",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="relative shrink-0 border-b border-[var(--line)] px-5 py-4">
            {showCloseButton ? (
              <button
                type="button"
                className="studio-dialog-close absolute end-4 top-4 z-[1]"
                aria-label={cancelLabel}
                onClick={onClose}
              >
                <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}

            <div className="pe-8">
              {headerNode ?? (
                <>
                  {label ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                  ) : null}
                  {title ? (
                    <h2
                      id={titleId}
                      className={[
                        "font-semibold leading-tight text-[var(--fg)]",
                        label ? "mt-1 text-lg" : "text-lg",
                      ].join(" ")}
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{description}</p> : null}
                </>
              )}
            </div>
          </header>

          <div
            className={[
              "min-h-0 flex-1 overscroll-contain [scrollbar-color:rgba(147,197,253,0.35)_transparent] [scrollbar-width:thin]",
              fillViewport ? "flex flex-col overflow-hidden" : "overflow-y-auto px-5 py-4",
              bodyClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </div>

          <footer className="shrink-0 border-t border-[var(--line)] px-5 py-4">
            {footer ?? (
              <div className="flex justify-end">
                <StudioGhostButton type="button" className="studio-btn-ghost--md" onClick={onClose}>
                  {cancelLabel}
                </StudioGhostButton>
              </div>
            )}
          </footer>
        </div>
      </div>
    </StudioModalPortal>
  );
}
