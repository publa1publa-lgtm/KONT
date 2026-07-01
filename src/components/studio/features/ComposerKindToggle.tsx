"use client";

import { Clapperboard, ImageIcon } from "lucide-react";

export type ComposerKind = "reel" | "post";

type Props = {
  kind: ComposerKind;
  allowed: ComposerKind[];
  onChange: (k: ComposerKind) => void;
  labels: { post: string; reel: string };
  ariaLabel: string;
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
        "relative z-10 flex min-w-[5.75rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-[color] duration-300",
        selected ? selectedClass : "text-[var(--muted)] hover:text-[var(--fg)]/85",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </span>
      <span className="font-mono text-[9px] tabular-nums tracking-wide opacity-70">{ratio}</span>
    </button>
  );
}

export function ComposerKindToggle({ kind, allowed, onChange, labels, ariaLabel }: Props) {
  if (allowed.length <= 1) return null;

  const showPost = allowed.includes("post");
  const showReel = allowed.includes("reel");
  const postSelected = kind === "post";
  const thumbOnPost = postSelected || !showReel;

  return (
    <div
      className="relative isolate flex h-11 shrink-0 overflow-hidden rounded-xl border border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-none absolute inset-1">
        <div
          className="flex h-full w-1/2 px-px transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: thumbOnPost ? "translate3d(0,0,0)" : "translate3d(100%,0,0)" }}
        >
          <span className="block h-full w-full rounded-lg bg-[var(--glass)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] ring-1 ring-[var(--line)]/70" />
        </div>
      </div>

      {showPost ? (
        <KindSegment
          selected={postSelected}
          onClick={() => onChange("post")}
          icon={ImageIcon}
          label={labels.post}
          ratio="1:1"
          selectedClass="text-[var(--fg)]"
        />
      ) : null}
      {showReel ? (
        <KindSegment
          selected={!postSelected}
          onClick={() => onChange("reel")}
          icon={Clapperboard}
          label={labels.reel}
          ratio="9:16"
          selectedClass="text-[var(--ice)]"
        />
      ) : null}
    </div>
  );
}
