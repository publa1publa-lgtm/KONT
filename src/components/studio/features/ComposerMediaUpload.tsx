"use client";

import type { ChangeEventHandler, ReactNode } from "react";
import { Loader2, Upload } from "lucide-react";

import { ComposerFieldError } from "./ComposerContentPreview";
import type { CloudMediaOrigin } from "@/lib/cloud/types";
import { CloudOriginBadge } from "./CloudOriginBadge";
import { StudioGhostButton } from "./StudioCreateButton";

type ComposerMediaUploadProps = {
  label: string;
  accept: string;
  hint?: string;
  disabled?: boolean;
  busy?: boolean;
  hasMedia?: boolean;
  error?: string;
  origin?: CloudMediaOrigin | null;
  cloudAction?: ReactNode;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function ComposerMediaUpload({
  label,
  accept,
  hint = "Tap to upload",
  disabled,
  busy,
  hasMedia,
  error,
  origin,
  cloudAction,
  onChange,
}: ComposerMediaUploadProps) {
  return (
    <div className="grid gap-1.5">
      <label
        className={[
          "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border px-4 py-3.5 transition",
          error
            ? "border-[var(--ember)]/50 bg-[var(--ember)]/6"
            : hasMedia
              ? "border-[var(--wrapper-color-rim)] bg-white/90 hover:border-[var(--ice)]/30 hover:bg-white"
              : "border-dashed border-[var(--ice)]/28 bg-[var(--ice)]/6 hover:border-[var(--ice)]/45 hover:bg-[var(--ice)]/10",
          disabled || busy ? "pointer-events-none opacity-55" : "",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
            hasMedia
              ? "border-[var(--wrapper-color-rim)] bg-white text-[var(--muted)] group-hover:text-[var(--fg)]"
              : "border-[var(--ice)]/25 bg-[var(--ice)]/12 text-[var(--ice)]",
          ].join(" ")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--fg)]">{label}</span>
            <CloudOriginBadge origin={origin} />
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-[var(--muted)]">
            {hasMedia ? (origin ? origin.label : "Tap to replace") : hint}
          </span>
        </span>
        <input type="file" accept={accept} disabled={disabled || busy} onChange={onChange} className="sr-only" />
      </label>
      {cloudAction ? <div className="flex justify-end">{cloudAction}</div> : null}
      <ComposerFieldError message={error} />
    </div>
  );
}

export function ComposerCloudActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <StudioGhostButton type="button" className="studio-btn-ghost--sm" disabled={disabled} onClick={onClick}>
      {label}
    </StudioGhostButton>
  );
}
