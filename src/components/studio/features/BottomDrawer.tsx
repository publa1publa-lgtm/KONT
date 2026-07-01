"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function BottomDrawer({
  open,
  title,
  description,
  children,
  onClose,
  cancelLabel = "Cancel",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  cancelLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={[
        "fixed inset-0 z-[70]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div
        className={[
          "absolute inset-0 bg-[var(--studio-overlay)] backdrop-blur-sm transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden
      />

      <div
        className={[
          "absolute inset-x-0 bottom-0 w-full",
          "transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="overflow-hidden rounded-t-3xl border border-[var(--line)] bg-[var(--glass)] shadow-[0_-40px_140px_-90px_rgba(78,52,32,0.28)] backdrop-blur-xl">
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-[var(--studio-hairline)]" aria-hidden />
          </div>
          <div className="px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-10 rounded-full bg-gradient-to-r from-[var(--ice)] via-[var(--electric)] to-[var(--ember)] opacity-80" />
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Panel</div>
              </div>
              <div className="mt-2 truncate text-lg font-semibold tracking-tight text-[var(--fg)] sm:text-xl">{title}</div>
              {description ? <div className="mt-1 text-sm text-[var(--muted)]">{description}</div> : null}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--studio-hairline)] to-transparent" />

          <div className="max-h-[min(78dvh,560px)] overflow-auto px-5 py-5 sm:px-6">
            {children}
            <div className="pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]" />
          </div>

          <div className="border-t border-[var(--line)] bg-[var(--studio-surface-2)]/50 px-5 py-4 sm:px-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-4 py-2.5 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]"
              >
                {cancelLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
