"use client";

import { StudioModalPortal } from "@/components/studio/StudioModalPortal";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-[var(--ember)]/20 text-[var(--ember)] hover:bg-[var(--ember)]/28"
      : "bg-[var(--ice)]/20 text-[var(--ice)] hover:bg-[var(--ice)]/28";

  return (
    <StudioModalPortal>
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-8">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[rgba(12,12,14,0.92)] p-5 text-[#f4f4f5] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a1a1aa]">{title}</div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#e4e4e7]">{message}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#e4e4e7] transition hover:bg-white/10 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={["rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50", confirmClass].join(" ")}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </StudioModalPortal>
  );
}
