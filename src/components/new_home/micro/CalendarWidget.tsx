"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// April 2026 starts on a Wednesday (Monday-first → 2 leading blanks), 30 days → 5 tidy rows.
const LEADING_BLANKS = 2;
const DAYS_IN_MONTH = 30;
const SELECTED_DAY = 15;

const PLATFORMS = {
  ig: "#E1306C",
  yt: "#FF0000",
  tt: "#FE2C55",
  tg: "#229ED9",
} as const;

// Scheduled content per day — mirrors how posts/reels show on the real calendar.
const EVENTS: Record<number, (keyof typeof PLATFORMS)[]> = {
  3: ["yt"],
  9: ["ig"],
  15: ["ig", "yt"],
  16: ["tt"],
  22: ["tg"],
  24: ["ig"],
  29: ["yt", "tt"],
};

const LEGEND = [
  { key: "ig", label: "Instagram" },
  { key: "yt", label: "YouTube" },
  { key: "tt", label: "TikTok" },
] as const;

export function CalendarWidget() {
  const reduced = useReducedMotion();

  const cells: (number | null)[] = [
    ...Array.from({ length: LEADING_BLANKS }, () => null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];

  return (
    <div className="nh-cal" aria-hidden>
      <div className="nh-cal__head">
        <div className="nh-cal__title">
          <span>April 2026</span>
        </div>
        <div className="nh-cal__nav">
          <span className="nh-cal__nav-btn">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="nh-cal__nav-btn">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>

      <div className="nh-cal__weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="nh-cal__grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={`b-${i}`} className="nh-cal__cell nh-cal__cell--empty" />;
          const events = EVENTS[day] ?? [];
          const selected = day === SELECTED_DAY;
          return (
            <motion.span
              key={day}
              className={selected ? "nh-cal__cell nh-cal__cell--sel" : "nh-cal__cell"}
              initial={reduced || !events.length ? false : { opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.03 * (day % 7), ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="nh-cal__num">{day}</span>
              {events.length > 0 && (
                <span className="nh-cal__dots">
                  {events.map((p, di) => (
                    <i key={di} style={{ background: PLATFORMS[p] }} />
                  ))}
                </span>
              )}
            </motion.span>
          );
        })}
      </div>

      <div className="nh-cal__legend">
        {LEGEND.map((l) => (
          <span key={l.key} className="nh-cal__legend-item">
            <i style={{ background: PLATFORMS[l.key] }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
