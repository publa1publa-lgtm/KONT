"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { useMessages } from "@/contexts/messages-context";
import { useCountUp } from "@/hooks/useCountUp";

type BenefitStatData = {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
};

function ShiftStat({ stat }: { stat: BenefitStatData }) {
  const { ref, display } = useCountUp<HTMLDivElement>(stat.value, {
    decimals: stat.decimals ?? 0,
  });

  return (
    <div ref={ref} className="nh-shift-metric">
      <strong className="nh-shift-metric__value">
        {display}
        {stat.suffix ? <span className="nh-shift-metric__suffix">{stat.suffix}</span> : null}
      </strong>
      <span className="nh-shift-metric__label">{stat.label}</span>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export function BenefitsSection() {
  const { landing } = useMessages();
  const b = landing.benefits;
  const reduced = useReducedMotion();

  const motionProps = reduced
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <section id="benefits" className="home-section home-section--shift scroll-mt-28" aria-label="Why KONT">
      <div className="nh-shift__bleed">
        <div className="nh-shift__atmosphere" aria-hidden>
          <span className="nh-shift__glow nh-shift__glow--left" />
          <span className="nh-shift__glow nh-shift__glow--right" />
          <span className="nh-shift__glow nh-shift__glow--center" />
        </div>

        <div className="home-section__inner home-section__inner--shift">
          <motion.header className="nh-shift__head" variants={fadeUp} {...motionProps}>
            <p className="nh-shift__label">{b.label}</p>
            <h2 className="nh-shift__title">
              {b.title}
              <span className="nh-shift__title-accent">{b.titleAccent}</span>
            </h2>
            <p className="nh-shift__lead">{b.text}</p>
          </motion.header>

          <motion.div
            className="nh-shift__stage"
            variants={fadeUp}
            {...motionProps}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <article className="nh-shift-pane nh-shift-pane--before">
              <header className="nh-shift-pane__head">
                <span className="nh-shift-pane__tag">{b.compare.before.tag}</span>
                <h3 className="nh-shift-pane__title">{b.compare.before.title}</h3>
              </header>
              <ul className="nh-shift-pane__list">
                {b.compare.before.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="nh-shift-pane__metric nh-shift-pane__metric--warn">{b.compare.before.metric}</p>
            </article>

            <div className="nh-shift__bridge" aria-hidden>
              <span className="nh-shift__bridge-line" />
              <span className="nh-shift__bridge-core">
                <ArrowRight />
              </span>
            </div>

            <article className="nh-shift-pane nh-shift-pane--after">
              <header className="nh-shift-pane__head">
                <span className="nh-shift-pane__tag nh-shift-pane__tag--ok">{b.compare.after.tag}</span>
                <h3 className="nh-shift-pane__title">{b.compare.after.title}</h3>
              </header>
              <ul className="nh-shift-pane__list nh-shift-pane__list--ok">
                {b.compare.after.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="nh-shift-pane__metric nh-shift-pane__metric--ok">{b.compare.after.metric}</p>
            </article>
          </motion.div>

          <motion.div
            className="nh-shift__metrics"
            aria-label="Key metrics"
            variants={fadeUp}
            {...motionProps}
            transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            {b.stats.map((stat) => (
              <ShiftStat key={stat.label} stat={stat} />
            ))}
          </motion.div>

          <motion.div
            className="nh-shift__pillars"
            aria-label="Key benefits"
            variants={fadeUp}
            {...motionProps}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {b.items.map((item, i) => (
              <article key={item.title} className="nh-shift-pillar">
                <span className="nh-shift-pillar__index">{String(i + 1).padStart(2, "0")}</span>
                <div className="nh-shift-pillar__copy">
                  <h3 className="nh-shift-pillar__title">{item.title}</h3>
                  <p className="nh-shift-pillar__body">{item.body}</p>
                </div>
                <span className="nh-shift-pillar__outcome">{item.outcome}</span>
              </article>
            ))}
          </motion.div>

          <motion.figure
            className="nh-shift__quote"
            variants={fadeUp}
            {...motionProps}
            transition={{ duration: 0.75, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <blockquote className="nh-shift__quote-text">&ldquo;{b.testimonial.quote}&rdquo;</blockquote>
            <figcaption className="nh-shift__quote-foot">
              <div className="nh-shift__quote-author">
                <span className="nh-shift__quote-avatar" aria-hidden>
                  {b.testimonial.author
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div>
                  <cite className="nh-shift__quote-name">{b.testimonial.author}</cite>
                  <span className="nh-shift__quote-role">{b.testimonial.role}</span>
                </div>
              </div>
              <span className="nh-shift__quote-metric">{b.testimonial.metric}</span>
            </figcaption>
          </motion.figure>

          <motion.div
            className="nh-shift__cta"
            variants={fadeUp}
            {...motionProps}
            transition={{ duration: 0.7, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <a className="nh-shift__cta-link" href="#product">
              Explore the workspace
              <ArrowRight aria-hidden />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
