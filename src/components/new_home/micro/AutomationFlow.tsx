"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Filter, MessageCircle, Send } from "lucide-react";

const STEPS = [
  {
    kind: "trigger" as const,
    label: "Trigger",
    title: "New comment",
    hint: "Instagram · Reel",
    icon: MessageCircle,
  },
  {
    kind: "condition" as const,
    label: "Condition",
    title: 'Keyword "price"',
    hint: "Match any comment",
    icon: Filter,
  },
  {
    kind: "action" as const,
    label: "Action",
    title: "Send catalog DM",
    hint: "Instant reply",
    icon: Send,
  },
];

function FlowBridge({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <div className="nh-auto__bridge" aria-hidden>
      <span className="nh-auto__bridge-line" />
      {!reduced && (
        <motion.span
          className="nh-auto__bridge-dot"
          animate={{ top: ["0%", "100%"] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 0.35,
            delay,
          }}
        />
      )}
    </div>
  );
}

export function AutomationFlow() {
  const reduced = useReducedMotion();

  return (
    <div className="nh-auto" aria-hidden>
      <div className="nh-auto__pipeline">
        {STEPS.map((step, index) => (
          <Fragment key={step.kind}>
            {index > 0 ? <FlowBridge delay={index * 0.65} /> : null}
            <motion.div
              className={`nh-auto__step nh-auto__step--${step.kind}`}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="nh-auto__step-index">0{index + 1}</span>
              <span className={`nh-auto__step-icon nh-auto__step-icon--${step.kind}`}>
                <step.icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="nh-auto__step-copy">
                <small>{step.label}</small>
                <strong>{step.title}</strong>
                <em>{step.hint}</em>
              </span>
            </motion.div>
          </Fragment>
        ))}
      </div>

      <p className="nh-auto__foot">
        <span className="nh-auto__foot-line" aria-hidden />
        Auto-replies while you create
      </p>
    </div>
  );
}
