"use client";

import type { ReactNode } from "react";

export function StudioHeader({
  label,
  title,
  subtitle,
  right,
  accent = "ice",
  size = "default",
  /** Left accent bar (platform-style). Disable for nested panels (e.g. Link Tree studio). */
  showAccentBar = true,
  className = "",
}: {
  label: string;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  accent?: "ice" | "ember";
  /** Tighter typography (e.g. Inbox). */
  size?: "default" | "compact";
  showAccentBar?: boolean;
  className?: string;
}) {
  const accentBorder = accent === "ember" ? "border-[var(--ember)]/26" : "border-[var(--ice)]/26";
  const titleColor = accent === "ember" ? "text-[var(--ember)]" : "text-[var(--fg)]";
  const compact = size === "compact";

  return (
    <div
      className={[
        "studio-view-header flex flex-wrap items-end justify-between",
        showAccentBar ? ["border-s-2", compact ? "gap-2 ps-4" : "gap-4 ps-6", accentBorder].join(" ") : compact ? "gap-2" : "gap-4",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        <div
          className={[
            "studio-view-header__kicker font-semibold uppercase tracking-[0.14em] text-[var(--muted)]",
            compact ? "text-[10px] tracking-[0.12em]" : "text-xs",
          ].join(" ")}
        >
          {label}
        </div>
        {title ? (
          <div
            className={[
              "studio-view-header__title font-semibold tracking-tight",
              compact ? ["mt-0.5 line-clamp-2 text-sm leading-snug", titleColor].join(" ") : ["mt-1 text-[15px]", titleColor].join(" "),
            ].join(" ")}
          >
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div
            className={[
              "leading-relaxed text-[var(--muted)]",
              compact ? "mt-0.5 line-clamp-2 text-[11px]" : "mt-1 text-[13px]",
            ].join(" ")}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="studio-view-header__right flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

