"use client";

import { CalendarDays, Clapperboard, ImageIcon } from "lucide-react";

export type ComposerKind = "reel" | "post" | "event";

type Props = {
  kind: ComposerKind;
  allowed: ComposerKind[];
  onChange: (k: ComposerKind) => void;
  labels: { post: string; reel: string; event: string };
  ariaLabel: string;
};

const KIND_META: Record<
  ComposerKind,
  { icon: typeof ImageIcon; ratio: string; selectedClass: string }
> = {
  post: { icon: ImageIcon, ratio: "4:5", selectedClass: "text-[var(--fg)]" },
  reel: { icon: Clapperboard, ratio: "9:16", selectedClass: "text-[var(--ice)]" },
  event: { icon: CalendarDays, ratio: "—", selectedClass: "text-amber-200" },
};

function KindSegment({
  selected,
  onClick,
  icon: Icon,
  label,
  ratio,
  selectedClass,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof ImageIcon;
  label: string;
  ratio: string;
  selectedClass: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={[
        "relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 transition-[color] duration-300 sm:min-w-[4.75rem] sm:px-3",
        selected ? selectedClass : "text-[var(--muted)] hover:text-[var(--fg)]/85",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-[11px] sm:tracking-[0.12em]">
          {label}
        </span>
      </span>
      <span className="font-mono text-[9px] tabular-nums tracking-wide opacity-70">{ratio}</span>
    </button>
  );
}

export function ComposerKindToggle({ kind, allowed, onChange, labels, ariaLabel }: Props) {
  if (allowed.length <= 1) return null;

  const activeIndex = Math.max(0, allowed.indexOf(kind));
  const segmentPct = 100 / allowed.length;

  return (
    <div
      className="relative isolate flex h-11 shrink-0 overflow-hidden rounded-xl border border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-none absolute inset-1">
        <div
          className="flex h-full px-px transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{
            width: `${segmentPct}%`,
            transform: `translate3d(${activeIndex * 100}%,0,0)`,
          }}
        >
          <span className="block h-full w-full rounded-lg bg-[var(--glass)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] ring-1 ring-[var(--line)]/70" />
        </div>
      </div>

      {allowed.map((k) => {
        const meta = KIND_META[k];
        return (
          <KindSegment
            key={k}
            selected={kind === k}
            onClick={() => onChange(k)}
            icon={meta.icon}
            label={labels[k]}
            ratio={meta.ratio}
            selectedClass={meta.selectedClass}
          />
        );
      })}
    </div>
  );
}
