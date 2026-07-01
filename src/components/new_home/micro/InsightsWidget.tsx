"use client";

import { ArrowUpRight } from "lucide-react";

const INSIGHTS = [
  {
    id: "window",
    label: "Best window",
    value: "Tue · 6:00 PM",
    delta: "+24% reach",
    tone: "brand" as const,
  },
  {
    id: "format",
    label: "Top format",
    value: "Reels under 30s",
    delta: "+34% saves",
    tone: "violet" as const,
  },
  {
    id: "hook",
    label: "Hook length",
    value: "8–12 seconds",
    delta: "sweet spot",
    tone: "ice" as const,
  },
] as const;

export function InsightsWidget() {
  return (
    <div className="nh-insights" aria-hidden>
      <ul className="nh-insights__list">
        {INSIGHTS.map((item) => (
          <li key={item.id} className={`nh-insights__item nh-insights__item--${item.tone}`}>
            <span className="nh-insights__item-copy">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </span>
            <span className="nh-insights__item-delta">
              <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
              {item.delta}
            </span>
          </li>
        ))}
      </ul>

      <p className="nh-insights__foot">Updated from last 14 days of posts</p>
    </div>
  );
}
