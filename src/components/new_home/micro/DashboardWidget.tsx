"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const BARS = [38, 52, 44, 68, 58, 74, 62, 80];
const DAYS = ["M", "T", "W", "T", "F", "S", "S", "M"];

export function DashboardWidget({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion();

  return (
    <div className={compact ? "nh-dash-widget nh-dash-widget--compact" : "nh-dash-widget"} aria-hidden>
      <div className="nh-dash-widget__kpis">
        <div>
          <small>Reach</small>
          <strong>128K</strong>
          <em className="nh-dash-widget__delta">
            <ArrowUpRight className="h-3 w-3" aria-hidden />
            18%
          </em>
        </div>
        <div>
          <small>Engagement</small>
          <strong>6.8%</strong>
          <em className="nh-dash-widget__delta">
            <ArrowUpRight className="h-3 w-3" aria-hidden />
            2.1pp
          </em>
        </div>
        {!compact && (
          <div>
            <small>Growth</small>
            <strong>3.2×</strong>
            <em className="nh-dash-widget__delta">
              <ArrowUpRight className="h-3 w-3" aria-hidden />
              cycles
            </em>
          </div>
        )}
      </div>

      <div className="nh-dash-widget__chart">
        {BARS.map((h, i) => (
          <span className="nh-dash-widget__col" key={i}>
            <motion.span
              className="nh-dash-widget__bar"
              style={{ height: `${h}%` }}
              initial={reduced ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
            />
            <i>{DAYS[i]}</i>
          </span>
        ))}
      </div>

      <div className="nh-dash-widget__legend">
        <span><i style={{ background: "var(--nh-ice)" }} />Instagram</span>
        <span><i style={{ background: "var(--nh-brand)" }} />YouTube</span>
        <span><i style={{ background: "var(--nh-violet)" }} />TikTok</span>
      </div>
    </div>
  );
}
