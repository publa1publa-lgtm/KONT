"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useId, useState } from "react";

import { useMessages } from "@/contexts/messages-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ease = [0.22, 1, 0.36, 1] as const;

export function HomeCtaCard() {
  const { landing, demoModal } = useMessages();
  const reduced = useReducedMotion();
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const duration = reduced ? 0 : 0.4;
  const done = status === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(demoModal.errorInvalid);
      return;
    }

    setError(null);
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 650));
    setStatus("success");
  }

  return (
    <div className="home-cta-card">
      <span className="home-cta-card__badge">
        <span className="home-hero__badge-dot" aria-hidden />
        {landing.cta.badge}
      </span>
      <h2 className="home-screen__title home-screen__title--sm">{landing.cta.title}</h2>
      <p className="home-screen__text home-cta-card__text">{landing.cta.text}</p>

      <div className="home-cta-card__stage" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {!done ? (
            <motion.form
              key="email"
              className="home-cta-email"
              onSubmit={handleSubmit}
              noValidate
              initial={false}
              exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration, ease }}
            >
              <label className="sr-only" htmlFor={inputId}>
                {demoModal.emailLabel}
              </label>
              <div className="home-cta-email__shell">
                <input
                  id={inputId}
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={demoModal.emailPlaceholder}
                  className={`home-cta-email__input${error ? " home-cta-email__input--error" : ""}`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  disabled={status === "submitting"}
                />
                <button
                  type="submit"
                  className="home-cta-email__submit"
                  disabled={status === "submitting"}
                >
                  <span>
                    {status === "submitting" ? demoModal.submitting : landing.cta.primary}
                  </span>
                  {status !== "submitting" ? (
                    <ArrowRight className="home-cta-email__submit-icon" aria-hidden />
                  ) : null}
                </button>
              </div>
              {error ? (
                <p id={errorId} className="home-cta-email__error" role="alert">
                  {error}
                </p>
              ) : null}
            </motion.form>
          ) : (
            <motion.div
              key="success"
              className="home-cta-success"
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration, ease }}
            >
              <span className="home-cta-success__icon" aria-hidden>
                <Check className="size-5" strokeWidth={2.5} />
              </span>
              <p className="home-cta-success__title">{demoModal.successTitle}</p>
              <p className="home-cta-success__body">{demoModal.successBody}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ul className="home-cta-card__trust" aria-label="Trust indicators">
        {landing.cta.trust.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="home-screen__note">{landing.cta.note}</p>
    </div>
  );
}
