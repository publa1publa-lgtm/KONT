"use client";

import { useMemo } from "react";
import { buildMonthGrid, CALENDAR_DISPLAY_WEEK_ROWS, dateKeyLocal } from "./dateUtils";
import type { CalendarEventsByDate, ScheduledPostsByDate } from "./types";
import { CalendarCell } from "./CalendarCell";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";

type Props = {
  month: Date;
  eventsByDate: CalendarEventsByDate;
  postsByDate?: ScheduledPostsByDate;
  onSelectDate: (date: Date) => void;
  nowMs: number;
  selectedDayKey?: string | null;
  /** Fixed week row count so height stays equal (studio: 6 rows, incl. 4- and 5-week months). */
  fixedWeekRows?: number;
  /** Render inside studio-calendar shell (no extra glass card). */
  embedded?: boolean;
  className?: string;
};

function weekDaysMondayFirst(locale: string): string[] {
  const base = new Date("2021-11-01T00:00:00");
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const raw = fmt.format(d);
    const s = raw.length > 0 ? raw[0]!.toUpperCase() + raw.slice(1) : raw;
    days.push(s);
  }
  return days;
}

export function CalendarGrid({
  month,
  eventsByDate,
  postsByDate,
  onSelectDate,
  nowMs,
  selectedDayKey = null,
  fixedWeekRows,
  embedded = false,
  className = "",
}: Props) {
  const { locale } = useI18n();
  const grid = useMemo(
    () => buildMonthGrid(month, fixedWeekRows ? { weekRows: fixedWeekRows } : undefined),
    [month, fixedWeekRows],
  );
  const weekDays = useMemo(() => weekDaysMondayFirst(intlLocale(locale)), [locale]);

  return (
    <div
      className={[
        embedded
          ? "studio-calendar__grid flex h-full min-h-0 w-full flex-col overflow-hidden"
          : "cal-surface cal-grid-lines flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-y-3 left-0 z-[2] w-8 studio-cal-scroll-fade sm:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-3 right-0 z-[2] w-8 studio-cal-scroll-fade studio-cal-scroll-fade--right sm:hidden"
          aria-hidden
        />
        <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-x-auto overscroll-x-contain">
          <div className="flex min-h-0 min-w-[32rem] flex-1 flex-col sm:min-w-0">
            <div className="cal-weekday-bar shrink-0">
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                {weekDays.map((d, idx) => (
                  <div key={`${idx}:${d}`} className={["cal-weekday", idx >= 5 ? "is-weekend" : ""].join(" ")}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-2 grid min-h-0 flex-1 grid-cols-7 gap-2 sm:mt-2.5 sm:gap-2.5"
              style={
                fixedWeekRows
                  ? { gridTemplateRows: `repeat(${fixedWeekRows}, minmax(0, 1fr))` }
                  : undefined
              }
            >
              {grid.map((date) => {
                const key = dateKeyLocal(date);
                const events = eventsByDate[key] ?? [];
                const posts = postsByDate?.[key] ?? [];
                return (
                  <CalendarCell
                    key={key}
                    date={date}
                    month={month}
                    events={events}
                    posts={posts}
                    onSelectDate={onSelectDate}
                    nowMs={nowMs}
                    selected={selectedDayKey === key}
                    fillHeight={Boolean(fixedWeekRows)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CALENDAR_DISPLAY_WEEK_ROWS };
