"use client";

import Image from "next/image";
import {
  Activity,
  LayoutGrid,
  Layers,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useCallback, useRef } from "react";

import { useMessages } from "@/contexts/messages-context";
import { useCountUp } from "@/hooks/useCountUp";

const METRIC_ICONS = [TrendingUp, Layers, LayoutGrid] as const;
const TAG_ICONS = [Shield, Sparkles, Activity] as const;
const TAG_TONES = ["green", "violet", "ice"] as const;
const STAR_COUNT = 14;

const LINK_PATHS = [
  "M200 200 Q290 105 338 58",
  "M200 200 Q85 285 48 328",
  "M200 200 Q315 285 345 328",
] as const;

function parseMetricValue(raw: string) {
  const match = raw.match(/^([^0-9.-]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) {
    return { prefix: "", num: 0, suffix: raw, decimals: 0 };
  }

  const [, prefix, numStr, suffix] = match;
  const num = Number(numStr);
  const decimals = numStr.includes(".") ? numStr.split(".")[1]?.length ?? 0 : 0;

  return { prefix, num, suffix, decimals };
}

function MetricSparkline() {
  return (
    <svg className="hero-orbit__sparkline" viewBox="0 0 80 24" aria-hidden="true">
      <defs>
        <linearGradient id="hero-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 113, 227, 0.28)" />
          <stop offset="100%" stopColor="rgba(0, 113, 227, 0)" />
        </linearGradient>
      </defs>
      <path
        className="hero-orbit__sparkline-area"
        d="M0 20 L10 16 L22 18 L34 10 L46 12 L58 6 L70 8 L80 4 L80 24 L0 24 Z"
        fill="url(#hero-spark-fill)"
      />
      <path
        className="hero-orbit__sparkline-line"
        d="M0 20 L10 16 L22 18 L34 10 L46 12 L58 6 L70 8 L80 4"
      />
    </svg>
  );
}

function HeroMetric({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  const Icon = METRIC_ICONS[index] ?? TrendingUp;
  const parsed = parseMetricValue(value);
  const { ref, display } = useCountUp<HTMLElement>(parsed.num, {
    decimals: parsed.decimals,
  });

  return (
    <div className={`hero-orbit__metric hero-orbit__metric--${index + 1}`}>
      <span className="hero-orbit__metric-icon">
        <Icon aria-hidden />
      </span>
      <strong ref={ref}>
        {parsed.prefix}
        {display}
        {parsed.suffix}
      </strong>
      {index === 0 ? <MetricSparkline /> : null}
      <span>{label}</span>
    </div>
  );
}

export function HeroVisual() {
  const { landing } = useMessages();
  const metrics = landing.hero.pulse.metrics;
  const tags = landing.hero.tags;
  const activities = landing.hero.pulse.activities;
  const insights = landing.hero.pulse.insights;
  const orbitRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const el = orbitRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    el.style.setProperty("--hero-tilt-x", `${(-y * 9).toFixed(2)}deg`);
    el.style.setProperty("--hero-tilt-y", `${(x * 11).toFixed(2)}deg`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const el = orbitRef.current;
    if (!el) return;
    el.style.setProperty("--hero-tilt-x", "0deg");
    el.style.setProperty("--hero-tilt-y", "0deg");
  }, []);

  return (
    <div
      ref={orbitRef}
      className="hero-orbit"
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="hero-orbit__stars">
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <span key={i} className={`hero-orbit__star hero-orbit__star--${i + 1}`} />
        ))}
      </div>

      <span className="hero-orbit__glow" />
      <span className="hero-orbit__monogram">K</span>

      <svg className="hero-orbit__links" viewBox="0 0 400 400" fill="none">
        <defs>
          <linearGradient id="hero-link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(147,197,253,0.35)" />
          </linearGradient>
        </defs>
        {LINK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
        {LINK_PATHS.map((d, i) => (
          <circle key={`pulse-${d}`} r="3.5" className="hero-orbit__link-pulse">
            <animateMotion
              dur={`${3.2 + i * 0.7}s`}
              repeatCount="indefinite"
              path={d}
            />
          </circle>
        ))}
      </svg>

      <div className="hero-orbit__stage">
        <div className="hero-orbit__ring-system">
          <span className="hero-orbit__ring" />
          <span className="hero-orbit__ring hero-orbit__ring--inner" />
          <span className="hero-orbit__beacon hero-orbit__beacon--1" />
          <span className="hero-orbit__beacon hero-orbit__beacon--2" />
          <span className="hero-orbit__beacon hero-orbit__beacon--3" />
          <span className="hero-orbit__beacon hero-orbit__beacon--4" />
        </div>

        <div className="hero-orbit__hub-wrap">
          <div className="hero-orbit__hub">
            <span className="hero-orbit__hub-dot" />
          </div>
        </div>

        <ul className="hero-orbit__feed">
          {activities.map((item, i) => (
            <li
              key={`${item.action}-${item.detail}`}
              className={`hero-orbit__feed-item hero-orbit__feed-item--${i + 1}`}
            >
              <span className="hero-orbit__feed-icon">
                <Image src={item.icon} alt="" width={18} height={18} />
              </span>
              <span className="hero-orbit__feed-copy">
                <strong>{item.action}</strong>
                <span>{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        {metrics.map((m, i) => (
          <HeroMetric key={m.label} value={m.value} label={m.label} index={i} />
        ))}

        <ul className="hero-orbit__insights">
          {insights.map((item, i) => (
            <li
              key={`${item.value}-${item.label}`}
              className={`hero-orbit__insight hero-orbit__insight--${i + 1}`}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <ul className="hero-orbit__tags">
          {tags.map((label, i) => {
            const Icon = TAG_ICONS[i] ?? Sparkles;
            const tone = TAG_TONES[i] ?? "blue";
            return (
              <li
                key={label}
                className={`hero-orbit__tag hero-orbit__tag--${i + 1} hero-orbit__tag--${tone}`}
              >
                <Icon className="hero-orbit__tag-icon" aria-hidden />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
