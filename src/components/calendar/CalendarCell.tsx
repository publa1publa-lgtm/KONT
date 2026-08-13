"use client";

import { CalendarDays, Clapperboard, ImageIcon } from "lucide-react";
import { dateKeyLocal, isSameDay, isSameMonth } from "./dateUtils";
import type { CalendarEvent, ScheduledPlanEvent, ScheduledPost } from "./types";
import { useI18n } from "@/contexts/i18n-context";
import { normalizeEventColor } from "@/lib/eventColors";

type Props = {
  date: Date;
  month: Date;
  events?: CalendarEvent[];
  posts?: ScheduledPost[];
  planEvents?: ScheduledPlanEvent[];
  onSelectDate: (date: Date) => void;
  nowMs: number;
  selected?: boolean;
  /** Stretch to equal row height in a fixed-week grid. */
  fillHeight?: boolean;
};

export function CalendarCell({
  date,
  month,
  events = [],
  posts = [],
  planEvents = [],
  onSelectDate,
  nowMs,
  selected = false,
  fillHeight = false,
}: Props) {
  const { messages } = useI18n();
  const C = messages.calendar;
  const CC = messages.studio.content;
  const inMonth = isSameMonth(date, month);
  const today = isSameDay(date, new Date(nowMs));
  const key = dateKeyLocal(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isPastDay = (() => {
    const now = new Date(nowMs);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const cellStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return cellStart < todayStart;
  })();

  const postCount = posts.length;
  const reelCount = events.length;
  const eventCount = planEvents.length;
  const hasAny = postCount > 0 || reelCount > 0 || eventCount > 0;
  const eventAccent = eventCount > 0 ? normalizeEventColor(planEvents[0]?.color) : "#f59e0b";

  const kindsLabel = [
    postCount > 0 ? `${postCount} ${CC.typePost}` : null,
    reelCount > 0 ? `${reelCount} ${CC.typeReel}` : null,
    eventCount > 0 ? `${eventCount} ${CC.typeEvent}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !isPastDay && onSelectDate(date)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isPastDay) onSelectDate(date);
      }}
      className={[
        "group relative flex w-full touch-manipulation flex-col rounded-xl text-left transition sm:rounded-[0.9rem]",
        fillHeight ? "h-full min-h-0" : "min-h-[4.75rem] sm:min-h-[5rem]",
        "cal-cell",
        today ? "cal-cell-today" : "",
        selected ? "cal-cell-selected" : "",
        isPastDay ? "cal-cell-disabled" : "active:scale-[0.98]",
        isWeekend && inMonth ? "cal-weekend" : "",
        inMonth ? "" : "cal-cell-outside",
      ].join(" ")}
      aria-disabled={isPastDay ? true : undefined}
      aria-selected={selected}
      aria-current={today ? "date" : undefined}
      aria-label={
        kindsLabel
          ? `${C.cellAria.replace("{dateKey}", key)}, ${kindsLabel}`
          : C.cellAria.replace("{dateKey}", key)
      }
    >
      <div className="cal-cell-head">
        <div className="cal-cell-day">
          <div
            className={[
              "cal-day-num",
              selected ? "is-selected" : "",
              today && !selected ? "is-today" : "",
            ].join(" ")}
          >
            {date.getDate()}
          </div>

          {/* Narrow: colored dots only */}
          {hasAny ? (
            <div className="cal-cell-dots" aria-hidden>
              {postCount > 0 ? <span className="cal-cell-dot cal-cell-dot--post" /> : null}
              {reelCount > 0 ? <span className="cal-cell-dot cal-cell-dot--reel" /> : null}
              {eventCount > 0 ? (
                <span className="cal-cell-dot cal-cell-dot--event" style={{ background: eventAccent }} />
              ) : null}
            </div>
          ) : null}
        </div>

        {hasAny ? (
          <>
            {/* Medium: icon pills in a row */}
            <div className="cal-cell-icons" aria-hidden>
              {postCount > 0 ? (
                <span className="cal-cell-icon cal-cell-icon--post" title={`${postCount} ${CC.typePost}`}>
                  <ImageIcon aria-hidden />
                </span>
              ) : null}
              {reelCount > 0 ? (
                <span className="cal-cell-icon cal-cell-icon--reel" title={`${reelCount} ${CC.typeReel}`}>
                  <Clapperboard aria-hidden />
                </span>
              ) : null}
              {eventCount > 0 ? (
                <span
                  className="cal-cell-icon cal-cell-icon--event"
                  title={`${eventCount} ${CC.typeEvent}`}
                  style={{ color: eventAccent, borderColor: `color-mix(in srgb, ${eventAccent} 40%, transparent)` }}
                >
                  <CalendarDays aria-hidden />
                </span>
              ) : null}
            </div>

            {/* Wide: chips with counts */}
            <div className="cal-cell-kinds" aria-hidden>
              {postCount > 0 ? (
                <span className="cal-cell-kind cal-cell-kind--post">
                  {postCount}
                  <ImageIcon aria-hidden />
                </span>
              ) : null}
              {reelCount > 0 ? (
                <span className="cal-cell-kind cal-cell-kind--reel">
                  {reelCount}
                  <Clapperboard aria-hidden />
                </span>
              ) : null}
              {eventCount > 0 ? (
                <span
                  className="cal-cell-kind cal-cell-kind--event"
                  style={{ color: eventAccent, borderColor: `color-mix(in srgb, ${eventAccent} 35%, transparent)` }}
                >
                  {eventCount}
                  <CalendarDays aria-hidden />
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
