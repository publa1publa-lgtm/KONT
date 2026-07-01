"use client";

import { useI18n } from "@/contexts/i18n-context";
import type { ReelPlatformId } from "@/lib/reelPlatformIds";

export type { ReelPlatformId as PlatformId } from "@/lib/reelPlatformIds";

const PLATFORM_IDS: ReelPlatformId[] = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "pinterest",
  "linkedin",
];

export function ReelPlatformsStep({
  value,
  onChange,
}: {
  value: ReelPlatformId[];
  onChange: (next: ReelPlatformId[]) => void;
}) {
  const { messages } = useI18n();
  const R = messages.studio.reelPlatforms;
  const labels = messages.studio.inbox.platform;
  const subtitles = R.platformSubtitles;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{R.title}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{R.subtitle}</div>

      <div className="mt-4 grid gap-2">
        {PLATFORM_IDS.map((id) => {
          const checked = value.includes(id);
          return (
            <label
              key={id}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition",
                checked
                  ? "border-[var(--accent)] bg-[rgba(0,234,255,0.08)]"
                  : "border-[var(--line)] bg-[var(--studio-surface-2)] hover:border-[var(--muted)]",
              ].join(" ")}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
                checked={checked}
                onChange={() => {
                  if (checked) onChange(value.filter((x) => x !== id));
                  else onChange([...value, id]);
                }}
              />
              <div>
                <div className="text-sm font-semibold text-[var(--fg)]">{labels[id]}</div>
                <div className="text-xs text-[var(--muted)]">{subtitles[id]}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
