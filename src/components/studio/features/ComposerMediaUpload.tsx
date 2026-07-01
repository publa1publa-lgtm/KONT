"use client";

import type { ChangeEventHandler } from "react";
import { Loader2, Upload } from "lucide-react";

type ComposerMediaUploadProps = {
  label: string;
  accept: string;
  hint?: string;
  disabled?: boolean;
  busy?: boolean;
  hasMedia?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function ComposerMediaUpload({
  label,
  accept,
  hint = "Tap to upload",
  disabled,
  busy,
  hasMedia,
  onChange,
}: ComposerMediaUploadProps) {
  return (
    <label
      className={[
        "group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl border px-4 py-3.5 transition",
        hasMedia
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
        <span className="block text-xs font-semibold text-[var(--fg)]">{label}</span>
        <span className="mt-0.5 block text-[10px] text-[var(--muted)]">{hasMedia ? "Tap to replace" : hint}</span>
      </span>
      <input type="file" accept={accept} disabled={disabled || busy} onChange={onChange} className="sr-only" />
    </label>
  );
}
