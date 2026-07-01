"use client";

import type { Platform } from "./types";

const ALL: Platform[] = ["Instagram", "TikTok", "YouTube", "Pinterest", "LinkedIn"];

export function PlatformMultiSelect({
  value,
  onChange,
}: {
  value: Platform[];
  onChange: (next: Platform[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-xs font-semibold text-[var(--muted)]">Platforms</div>
      <div className="flex flex-wrap gap-2">
        {ALL.map((p) => {
          const active = value.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(active ? value.filter((x) => x !== p) : [...value, p]);
              }}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                active
                  ? "border-[var(--ice)]/35 bg-[var(--ice)]/12 text-[var(--ice)]"
                  : "border-white/10 bg-white/5 text-[var(--fg)] hover:bg-white/10",
              ].join(" ")}
              aria-pressed={active}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

