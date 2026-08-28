"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  GitBranch,
  Globe2,
  Inbox,
  Link2,
  Sparkles,
} from "lucide-react";

import { useMessages } from "@/contexts/messages-context";
import { landingDemoEn } from "@/lib/i18n/landingDemoEn";

import { AccountsWidget } from "../micro/AccountsWidget";
import { AudienceWidget } from "../micro/AudienceWidget";
import { AutomationFlow } from "../micro/AutomationFlow";
import { CalendarWidget } from "../micro/CalendarWidget";
import { DashboardWidget } from "../micro/DashboardWidget";
import { InboxWidget } from "../micro/InboxWidget";
import { InsightsWidget } from "../micro/InsightsWidget";

export function ProductSection() {
  const { landing } = useMessages();
  // Section chrome: translated. Demo card labels/widgets: English only.
  const bento = landing.bento;
  const tabs = landingDemoEn.bento.tabs;

  return (
    <section
      id="product"
      className="home-section home-section--product scroll-mt-28"
      aria-label="Product"
    >
      <div className="home-section__inner home-section__inner--product">
        <header className="nh-product__head">
          <p className="home-screen__label">{bento.label}</p>
          <h2 className="home-screen__title home-screen__title--section">{bento.title}</h2>
          <p className="home-screen__text home-screen__text--section">{bento.text}</p>
        </header>

        <div className="nh-constellation">
          <span className="nh-constellation__glow" aria-hidden="true" />

          <div className="nh-constellation__col nh-constellation__col--left">
            <FloatCard id="product-dashboard" variant="dash" icon={BarChart3} kicker={tabs.dashboard} chip="Last 7 days" delay={0}>
              <DashboardWidget />
            </FloatCard>

            <FloatCard id="product-automation" variant="auto" icon={GitBranch} kicker={tabs.automation} chip={<LiveChip />} delay={0.08}>
              <AutomationFlow />
            </FloatCard>
          </div>

          <div className="nh-constellation__col nh-constellation__col--mid">
            <FloatCard id="product-calendar" variant="cal" icon={CalendarDays} kicker={tabs.calendar} delay={0.06}>
              <CalendarWidget />
            </FloatCard>

            <FloatCard id="product-inbox" variant="inbox" icon={Inbox} kicker={tabs.inbox} chip="3 unread" tall delay={0.14}>
              <InboxWidget />
            </FloatCard>
          </div>

          <div className="nh-constellation__col nh-constellation__col--right">
            <FloatCard id="product-platforms" variant="accounts" icon={Link2} kicker={tabs.platforms} chip="5 live" delay={0.1}>
              <AccountsWidget />
            </FloatCard>

            <FloatCard id="product-insights" variant="insights" icon={Sparkles} kicker={tabs.insights} chip="AI" delay={0.12}>
              <InsightsWidget />
            </FloatCard>

            <FloatCard id="product-audience" variant="audience" icon={Globe2} kicker={tabs.audience} chip="142 regions" delay={0.18}>
              <AudienceWidget />
            </FloatCard>
          </div>
        </div>
      </div>
    </section>
  );
}

type FloatCardProps = {
  id?: string;
  variant: string;
  icon: typeof BarChart3;
  kicker: string;
  chip?: ReactNode;
  tall?: boolean;
  delay?: number;
  children: ReactNode;
};

function LiveChip() {
  return (
    <span className="nh-glass-card__chip nh-glass-card__chip--live">
      <span className="nh-glass-card__chip-pulse" aria-hidden />
      Live
    </span>
  );
}

function FloatCard({ id, variant, icon: Icon, kicker, chip, tall = false, delay = 0, children }: FloatCardProps) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltX = useSpring(0, { stiffness: 260, damping: 22, mass: 0.55 });
  const tiltY = useSpring(0, { stiffness: 260, damping: 22, mass: 0.55 });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    tiltY.set(px * 16);
    tiltX.set(-py * 12);
  };

  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      id={id}
      ref={cardRef}
      className={`nh-float nh-float--${variant}${tall ? " nh-float--tall" : ""}`}
      style={
        reduced
          ? undefined
          : {
              rotateX: tiltX,
              rotateY: tiltY,
              transformPerspective: 1400,
            }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="nh-glass-card nh-glass-card--volume">
        <span className="nh-glass-card__sheen" aria-hidden />
        <header className="nh-glass-card__head">
          <div className="nh-glass-card__mark">
            <span className="nh-glass-card__mark-icon">
              <Icon aria-hidden />
            </span>
            <span className="nh-glass-card__mark-title">{kicker}</span>
          </div>
          {chip ? (
            <div className="nh-glass-card__chip-wrap">
              {typeof chip === "string" ? <span className="nh-glass-card__chip">{chip}</span> : chip}
            </div>
          ) : null}
        </header>
        <div className="nh-glass-card__body">{children}</div>
      </div>
    </motion.div>
  );
}
