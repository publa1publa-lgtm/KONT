"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  GitBranch,
  Inbox,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";

const NAV = [
  { icon: CalendarDays, label: "Calendar", active: true },
  { icon: LayoutGrid, label: "Content", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
  { icon: Inbox, label: "Inbox", active: false },
  { icon: GitBranch, label: "Automations", active: false },
] as const;

const KPIS = [
  { label: "Reach", value: "128K", delta: "+18%", up: true, spark: [6, 9, 7, 12, 10, 15, 14, 19] },
  { label: "Engagement", value: "6.8%", delta: "+2.1pp", up: true, spark: [8, 7, 10, 9, 12, 11, 14, 16] },
  { label: "Scheduled", value: "6", delta: "this week", up: null, spark: [4, 6, 5, 7, 6, 8, 7, 6] },
] as const;

const QUEUE = [
  { src: "/home/icons/color/instagram.svg", title: "Spring drop — teaser reel", time: "Tue · 18:30", status: "Scheduled", tone: "ok" },
  { src: "/home/icons/color/youtube.svg", title: "Studio tour (Short)", time: "Thu · 12:00", status: "Draft", tone: "muted" },
  { src: "/home/icons/color/tiktok.svg", title: "Behind the scenes", time: "Fri · 09:15", status: "Scheduled", tone: "ok" },
] as const;

export function HeroDashboard() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="nh-hero-dash"
      initial={reduced ? false : { opacity: 0, y: 48, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
    >
      <TiltShell>
        <div className="nh-hero-dash__chrome">
          <span className="nh-hero-dash__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="nh-hero-dash__search">
            <Search className="h-3 w-3" aria-hidden />
            KONT · Creator workspace
          </span>
          <span className="nh-hero-dash__pill">
            <span className="nh-hero-dash__pill-dot" aria-hidden />
            Live
          </span>
        </div>

        <div className="nh-hero-dash__body">
          <aside className="nh-hero-dash__sidebar">
            <span className="nh-hero-dash__brand" aria-hidden />
            {NAV.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={active ? "nh-hero-dash__nav nh-hero-dash__nav--on" : "nh-hero-dash__nav"}
                title={label}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            ))}
          </aside>

          <div className="nh-hero-dash__main">
            <div className="nh-hd-toolbar">
              <div className="nh-hd-toolbar__title">
                <strong>This week</strong>
                <span>Apr 13 – 19</span>
              </div>
              <div className="nh-hd-toolbar__right">
                <div className="nh-hd-seg">
                  <span className="nh-hd-seg__item nh-hd-seg__item--on">Week</span>
                  <span className="nh-hd-seg__item">Month</span>
                </div>
                <span className="nh-hd-new">
                  <Plus className="h-3 w-3" aria-hidden />
                  New
                </span>
              </div>
            </div>

            <div className="nh-hd-kpis">
              {KPIS.map((k, i) => (
                <div key={k.label} className="nh-hd-kpi">
                  <small>{k.label}</small>
                  <strong>{k.value}</strong>
                  <span className={k.up ? "nh-hd-kpi__delta nh-hd-kpi__delta--up" : "nh-hd-kpi__delta nh-hd-kpi__delta--flat"}>
                    {k.delta}
                  </span>
                  <Sparkline points={k.spark} delay={0.4 + i * 0.12} reduced={!!reduced} />
                </div>
              ))}
            </div>

            <div className="nh-hd-list">
              <div className="nh-hd-list__head">
                <span>Upcoming</span>
                <span>{QUEUE.length} queued</span>
              </div>
              {QUEUE.map((q) => (
                <div key={q.title} className="nh-hd-item">
                  <span className="nh-hd-item__avatar">
                    <Image src={q.src} alt="" width={18} height={18} />
                  </span>
                  <span className="nh-hd-item__meta">
                    <strong>{q.title}</strong>
                    <small>{q.time}</small>
                  </span>
                  <span className={`nh-hd-item__status nh-hd-item__status--${q.tone}`}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TiltShell>
    </motion.div>
  );
}

function Sparkline({ points, delay, reduced }: { points: readonly number[]; delay: number; reduced: boolean }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg className="nh-hd-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path className="nh-hd-spark__area" d={area} />
      <motion.path
        className="nh-hd-spark__line"
        d={d}
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

function TiltShell({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className="nh-hero-dash__shell">{children}</div>;
  }

  return (
    <motion.div
      className="nh-hero-dash__shell"
      whileHover={{ scale: 1.01 }}
      style={{ transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `rotateX(${py * -8}deg) rotateY(${px * 8}deg)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
      }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
