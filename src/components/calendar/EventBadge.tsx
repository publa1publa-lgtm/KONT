"use client";

import type { CalendarEvent } from "./types";

function platformDot(platforms: CalendarEvent["platforms"]) {
  if (!platforms.length) return "bg-white/30";
  const p = platforms[0];
  if (p === "TikTok") return "bg-[var(--ember)]/80";
  if (p === "YouTube") return "bg-[var(--electric)]/80";
  return "bg-[var(--ice)]/80";
}

export function EventBadge({
  event,
  disabled,
  onClick,
}: {
  event: CalendarEvent;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const platforms = event.platforms.join(", ");
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.();
      }}
      aria-disabled={disabled ? true : undefined}
      className={[
        "cal-badge flex min-h-[1.75rem] w-full touch-manipulation items-center truncate rounded-md px-1.5 py-1 text-left text-[10px] leading-tight sm:min-h-[2rem] sm:px-2 sm:py-1",
        disabled
          ? "cal-badge-expired pointer-events-none cursor-default text-[var(--muted)] line-through decoration-white/20"
          : "text-[var(--fg)]",
      ].join(" ")}
      title={`${event.time} — ${event.title}${platforms ? ` (${platforms})` : ""}`}
    >
      <span className={["mr-2 inline-flex h-1.5 w-1.5 align-middle rounded-full", platformDot(event.platforms)].join(" ")} />
      <span className="font-mono text-[var(--muted)]">{event.time}</span>{" "}
      <span className="font-medium">{event.title}</span>
      {platforms ? <span className="ml-2 text-[9px] text-[var(--muted)]">{platforms}</span> : null}
    </button>
  );
}

