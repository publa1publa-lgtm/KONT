"use client";

import { Clapperboard, ImageIcon } from "lucide-react";
import type { ComposerKind } from "./ComposerKindToggle";

type Props = {
  kind: ComposerKind;
  label: string;
};

export function ComposerKindMetaChip({ kind, label }: Props) {
  const reel = kind === "reel";
  const Icon = reel ? Clapperboard : ImageIcon;
  const ratio = reel ? "9:16" : "4:5";

  return (
    <div
      className={[
        "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3",
        reel
          ? "border-[var(--ice)]/25 bg-[var(--ice)]/10 text-[var(--ice)]"
          : "border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 text-[var(--fg)]/85",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
        <span className="mt-0.5 font-mono text-[9px] tabular-nums opacity-70">{ratio}</span>
      </span>
    </div>
  );
}
