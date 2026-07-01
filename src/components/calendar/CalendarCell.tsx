"use client";

import { dateKeyLocal, isSameDay, isSameMonth } from "./dateUtils";
import type { CalendarEvent, ScheduledPost } from "./types";
import { useI18n } from "@/contexts/i18n-context";

type Props = {
  date: Date;
  month: Date;
  events?: CalendarEvent[];
  posts?: ScheduledPost[];
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
  onSelectDate,
  nowMs,
  selected = false,
  fillHeight = false,
}: Props) {
  const { messages } = useI18n();
  const C = messages.calendar;
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
  const totalCount = postCount + reelCount;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !isPastDay && onSelectDate(date)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isPastDay) onSelectDate(date);
      }}
      className={[
        "group relative flex w-full touch-manipulation flex-col rounded-xl p-1.5 text-left transition sm:rounded-[0.9rem] sm:p-2",
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
      aria-label={C.cellAria.replace("{dateKey}", key)}
    >
      <div className="flex items-start justify-between gap-1">
        <div
          className={[
            "cal-day-num",
            selected ? "is-selected" : "",
            today && !selected ? "is-today" : "",
          ].join(" ")}
        >
          {date.getDate()}
        </div>
        {totalCount > 0 ? <div className="cal-cell-count">{totalCount}</div> : null}
      </div>

      {totalCount > 0 ? (
        <div className="mt-auto flex items-center gap-1 pt-1.5">
          {postCount > 0 ? <span className="cal-cell-dot cal-cell-dot--post" title={`${postCount} posts`} /> : null}
          {reelCount > 0 ? <span className="cal-cell-dot cal-cell-dot--reel" title={`${reelCount} reels`} /> : null}
        </div>
      ) : null}
    </div>
  );
}
