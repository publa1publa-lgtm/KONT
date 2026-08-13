"use client";

import { CalendarDays, Clapperboard, ImageIcon } from "lucide-react";
import type { ComposerKind } from "./ComposerKindToggle";

type Props = {
  kind: ComposerKind;
  label: string;
};

const META: Record<
  ComposerKind,
  { icon: typeof ImageIcon; ratio: string; className: string }
> = {
  reel: {
    icon: Clapperboard,
    ratio: "9:16",
    className: "border-[var(--ice)]/25 bg-[var(--ice)]/10 text-[var(--ice)]",
  },
  post: {
    icon: ImageIcon,
    ratio: "4:5",
    className: "border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 text-[var(--fg)]/85",
  },
  event: {
    icon: CalendarDays,
    ratio: "—",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  },
};

export function ComposerKindMetaChip({ kind, label }: Props) {
  const meta = META[kind];
  const Icon = meta.icon;

  return (
    <div className={["flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3", meta.className].join(" ")}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
        <span className="mt-0.5 font-mono text-[9px] tabular-nums opacity-70">{meta.ratio}</span>
      </span>
    </div>
  );
}
