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
import { useCallback, useEffect, useRef, useState } from "react";

import { useCountUp } from "@/hooks/useCountUp";
import { landingDemoEn } from "@/lib/i18n/landingDemoEn";

const METRIC_ICONS = [TrendingUp, Layers, LayoutGrid] as const;
const TAG_ICONS = [Shield, Sparkles, Activity] as const;
const TAG_TONES = ["green", "violet", "ice"] as const;
const STAR_COUNT = 14;

const MOBILE_PLATFORM_ICONS = [
  "/home/icons/color/instagram.svg",
  "/home/icons/color/youtube.svg",
  "/home/icons/color/tiktok.svg",
  "/home/icons/color/x.svg",
  "/home/icons/color/telegram.svg",
  "/home/icons/color/linkedin.svg",
  "/home/icons/color/facebook.svg",
  "/home/icons/color/threads.svg",
] as const;

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

function HeroMobileSparkline() {
  return (
    <svg className="hero-mobile__sparkline" viewBox="0 0 120 28" aria-hidden="true">
      <defs>
        <linearGradient id="hero-mobile-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 113, 227, 0.35)" />
          <stop offset="100%" stopColor="rgba(94, 92, 230, 0)" />
        </linearGradient>
        <linearGradient id="hero-mobile-spark-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0071e3" />
          <stop offset="100%" stopColor="#5e5ce6" />
        </linearGradient>
      </defs>
      <path
        d="M0 22 L14 18 L28 20 L42 11 L56 14 L70 7 L84 10 L98 4 L120 2 L120 28 L0 28 Z"
        fill="url(#hero-mobile-spark-fill)"
      />
      <path
        className="hero-mobile__sparkline-line"
        d="M0 22 L14 18 L28 20 L42 11 L56 14 L70 7 L84 10 L98 4 L120 2"
        fill="none"
        stroke="url(#hero-mobile-spark-stroke)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroMobileHeroMetric({ value, label }: { value: string; label: string }) {
  const parsed = parseMetricValue(value);
  const { ref, display } = useCountUp<HTMLElement>(parsed.num, {
    decimals: parsed.decimals,
  });

  return (
    <div className="hero-mobile__hero-metric">
      <strong ref={ref} className="hero-mobile__hero-value">
        {parsed.prefix}
        {display}
        {parsed.suffix}
      </strong>
      <span className="hero-mobile__hero-label">{label}</span>
      <HeroMobileSparkline />
    </div>
  );
}

function HeroMobileSideStat({
  value,
  label,
  accent = "blue",
}: {
  value: string;
  label: string;
  accent?: "blue" | "violet";
}) {
  const parsed = parseMetricValue(value);
  const { ref, display } = useCountUp<HTMLElement>(parsed.num, {
    decimals: parsed.decimals,
  });

  return (
    <div className={`hero-mobile__side-stat hero-mobile__side-stat--${accent}`}>
      <strong ref={ref}>
        {parsed.prefix}
        {display}
        {parsed.suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

function HeroVisualMobile() {
  // Demo UI stays English regardless of site locale.
  const h = landingDemoEn.hero;
  const metrics = h.pulse.metrics;
  const tags = h.tags;
  const activities = h.pulse.activities;
  const insights = h.pulse.insights;
  const [activeActivity, setActiveActivity] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActiveActivity((current) => (current + 1) % activities.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [activities.length]);

  const marqueeIcons = [...MOBILE_PLATFORM_ICONS, ...MOBILE_PLATFORM_ICONS];

  return (
    <div className="hero-mobile" aria-hidden="true">
      <span className="hero-mobile__aura hero-mobile__aura--left" />
      <span className="hero-mobile__aura hero-mobile__aura--right" />

      <div className="hero-mobile__card">
        <span className="hero-mobile__card-grid" aria-hidden />
        <span className="hero-mobile__card-shine" aria-hidden />
        <span className="hero-mobile__border-glow" aria-hidden />

        <header className="hero-mobile__head">
          <span className="hero-mobile__live">
            <span className="hero-mobile__live-dot" />
            {h.pulse.kicker}
          </span>
          <span className="hero-mobile__chip">{h.multiChannel.kicker}</span>
        </header>

        <p className="hero-mobile__pitch">
          {h.multiChannel.title.split(". ").map((part, i, arr) => (
            <span key={part}>
              {i === 0 ? (
                <>
                  {part}
                  {arr.length > 1 ? ". " : ""}
                </>
              ) : (
                <span className="hero-mobile__pitch-accent">{part}</span>
              )}
            </span>
          ))}
        </p>

        <div className="hero-mobile__marquee-mask">
          <span className="hero-mobile__marquee-glow" aria-hidden />
          <div className="hero-mobile__marquee-track">
            {marqueeIcons.map((src, i) => (
              <span key={`${src}-${i}`} className="hero-mobile__marquee-icon">
                <Image src={src} alt="" width={22} height={22} />
              </span>
            ))}
          </div>
        </div>

        <div className="hero-mobile__feed" aria-live="polite">
          {activities.map((item, i) => (
            <article
              key={`${item.action}-${item.detail}`}
              className={`hero-mobile__feed-item${activeActivity === i ? " is-active" : ""}`}
            >
              <span className="hero-mobile__feed-icon">
                <Image src={item.icon} alt="" width={20} height={20} />
              </span>
              <span className="hero-mobile__feed-copy">
                <strong>{item.action}</strong>
                <span>{item.detail}</span>
              </span>
              <span className="hero-mobile__feed-pulse" aria-hidden />
            </article>
          ))}
          <div className="hero-mobile__feed-dots" aria-hidden>
            {activities.map((item, i) => (
              <span
                key={`dot-${item.action}`}
                className={`hero-mobile__feed-dot${activeActivity === i ? " is-active" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="hero-mobile__stats">
          {metrics[0] ? (
            <HeroMobileHeroMetric value={metrics[0].value} label={metrics[0].label} />
          ) : null}
          <div className="hero-mobile__stats-col">
            {metrics[1] ? (
              <HeroMobileSideStat value={metrics[1].value} label={metrics[1].label} accent="blue" />
            ) : null}
            {insights[0] ? (
              <HeroMobileSideStat value={insights[0].value} label={insights[0].label} accent="violet" />
            ) : null}
          </div>
        </div>

        <p className="hero-mobile__social">
          <span className="hero-mobile__social-avatars" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>{h.social.count}</strong> {h.social.text}
          </span>
        </p>

        <ul className="hero-mobile__tags">
          {tags.map((label, i) => {
            const Icon = TAG_ICONS[i] ?? Sparkles;
            const tone = TAG_TONES[i] ?? "blue";
            return (
              <li key={label} className={`hero-mobile__tag hero-mobile__tag--${tone}`}>
                <Icon className="hero-mobile__tag-icon" aria-hidden />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function HeroVisual() {
  // Demo UI stays English regardless of site locale.
  const h = landingDemoEn.hero;
  const metrics = h.pulse.metrics;
  const tags = h.tags;
  const activities = h.pulse.activities;
  const insights = h.pulse.insights;
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
    <>
      <HeroVisualMobile />

      <div
        ref={orbitRef}
        className="hero-orbit hero-orbit--desktop"
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
    </>
  );
}
