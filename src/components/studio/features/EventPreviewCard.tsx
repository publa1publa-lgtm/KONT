"use client";

import type { CSSProperties, ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { eventColorStyle, normalizeEventColor } from "@/lib/eventColors";

function excerpt(text: string | null | undefined, max = 72): string | null {
  const t = text?.trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export type EventPreviewCardProps = {
  title: string;
  time?: string | null;
  dateKey?: string | null;
  description?: string | null;
  /** When true and description is non-empty, show a short excerpt. */
  showDescription?: boolean;
  color?: string | null;
  eventLabel: string;
  untitledLabel?: string;
  className?: string;
  style?: CSSProperties;
  /** Extra content (e.g. action toolbar) on the right. */
  trailing?: ReactNode;
  onClick?: () => void;
  compact?: boolean;
};

export function EventPreviewCard({
  title,
  time,
  dateKey,
  description,
  showDescription = false,
  color,
  eventLabel,
  untitledLabel = "Untitled",
  className = "",
  style,
  trailing,
  onClick,
  compact = false,
}: EventPreviewCardProps) {
  const accent = normalizeEventColor(color);
  const displayTitle = title.trim() || untitledLabel;
  const desc = showDescription ? excerpt(description, compact ? 56 : 90) : null;
  const classNames = ["studio-event-card", compact ? "studio-event-card--compact" : "", className]
    .filter(Boolean)
    .join(" ");
  const mergedStyle = { ...eventColorStyle(accent), ...style };

  const inner = (
    <>
      <span className="studio-event-card__rail" aria-hidden />
      <div className="studio-event-card__body">
        <div className="studio-event-card__head">
          <span className="studio-event-card__badge">
            <CalendarDays className="size-3 shrink-0" aria-hidden />
            {eventLabel}
          </span>
          {time ? <span className="studio-event-card__time">{time}</span> : null}
        </div>
        <p className="studio-event-card__title">{displayTitle}</p>
        {dateKey ? <p className="studio-event-card__date">{dateKey}</p> : null}
        {desc ? <p className="studio-event-card__desc">{desc}</p> : null}
      </div>
      {trailing ? <div className="studio-event-card__trailing">{trailing}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classNames} style={mergedStyle}>
        {inner}
      </button>
    );
  }

  return (
    <div className={classNames} style={mergedStyle}>
      {inner}
    </div>
  );
}
