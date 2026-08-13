"use client";

import { Clapperboard, ImageIcon } from "lucide-react";
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
  const kindsLabel = [
    postCount > 0 ? `${postCount} ${CC.typePost}` : null,
    reelCount > 0 ? `${reelCount} ${CC.typeReel}` : null,
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
        <div
          className={[
            "cal-day-num",
            selected ? "is-selected" : "",
            today && !selected ? "is-today" : "",
          ].join(" ")}
        >
          {date.getDate()}
        </div>
        {postCount > 0 || reelCount > 0 ? (
          <div className="cal-cell-kinds">
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
