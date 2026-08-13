"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, ImageIcon } from "lucide-react";

import { buildMonthGrid, CALENDAR_DISPLAY_WEEK_ROWS, dateKeyLocal, isSameMonth } from "@/components/calendar/dateUtils";
import { CONTENT_LIST_CHANGED_EVENT, fetchContents } from "@/lib/contentApi";
import { contentsToCalendarMaps } from "@/lib/contentMappers";

type DayCounts = { posts: number; reels: number };

export function StudioCalendarTilePreview() {
  const month = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const todayKey = dateKeyLocal(new Date());
  const [counts, setCounts] = useState<Record<string, DayCounts>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { items, unauthorized } = await fetchContents();
        if (cancelled) return;
        if (unauthorized) {
          setCounts({});
          return;
        }
        const { eventsByDate, scheduledPosts } = contentsToCalendarMaps(items);
        const next: Record<string, DayCounts> = {};
        for (const [key, events] of Object.entries(eventsByDate)) {
          (next[key] ??= { posts: 0, reels: 0 }).reels += events.length;
        }
        for (const post of scheduledPosts) {
          (next[post.dateKey] ??= { posts: 0, reels: 0 }).posts += 1;
        }
        setCounts(next);
      } catch {
        if (!cancelled) setCounts({});
      }
    };

    void load();
    const onChange = () => void load();
    window.addEventListener(CONTENT_LIST_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CONTENT_LIST_CHANGED_EVENT, onChange);
    };
  }, []);

  const grid = useMemo(
    () => buildMonthGrid(month, { weekRows: CALENDAR_DISPLAY_WEEK_ROWS }),
    [month],
  );

  return (
    <div className="studio-tile-cal">
      <div className="studio-tile-cal__grid">
        {grid.map((date) => {
          const key = dateKeyLocal(date);
          const inMonth = isSameMonth(date, month);
          const isToday = key === todayKey;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isPast = key < todayKey;
          const day = counts[key];
          const postCount = day?.posts ?? 0;
          const reelCount = day?.reels ?? 0;
          return (
            <span
              key={key}
              className={[
                "cal-cell relative flex h-full min-h-0 w-full flex-col rounded-[0.9rem] text-left",
                isToday ? "cal-cell-today" : "",
                isPast ? "cal-cell-disabled" : "",
                isWeekend && inMonth ? "cal-weekend" : "",
                inMonth ? "" : "cal-cell-outside",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="cal-cell-head">
                <span className={["cal-day-num", isToday ? "is-today" : ""].join(" ")}>
                  {date.getDate()}
                </span>
                {postCount > 0 || reelCount > 0 ? (
                  <span className="cal-cell-kinds">
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
                  </span>
                ) : null}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
