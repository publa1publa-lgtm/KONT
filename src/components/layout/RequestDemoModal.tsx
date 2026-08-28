"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { useDemoModal } from "@/contexts/demo-modal-context";
import { useI18n, useMessages } from "@/contexts/i18n-context";
import { submitDemoRequest } from "@/lib/demoRequestClient";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestDemoModal() {
  const { demoModal } = useMessages();
  const { locale } = useI18n();
  const { open, closeModal } = useDemoModal();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setError(null);
    setStatus("idle");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeModal]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(demoModal.errorInvalid);
      return;
    }
    setError(null);
    setStatus("submitting");
    const result = await submitDemoRequest(trimmed, locale);
    if (!result.ok) {
      setStatus("idle");
      setError(demoModal.errorSend);
      return;
    }
    setStatus("success");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] w-full max-w-md overflow-y-auto border border-white/10",
          "max-h-[min(92dvh,40rem)] rounded-t-[1.5rem] px-5 pb-[max(1.35rem,env(safe-area-inset-bottom,0px))] pt-6",
          "sm:rounded-2xl sm:p-8",
          "bg-[linear-gradient(165deg,rgba(18,18,22,0.95)_0%,rgba(10,10,14,0.92)_100%)]",
          "shadow-[0_28px_90px_-36px_rgba(0,0,0,0.92),0_0_48px_-20px_rgba(0,234,255,0.12)]",
        )}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute end-3 top-3 grid size-11 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white sm:end-4 sm:top-4 sm:size-9"
          aria-label={demoModal.close}
        >
          <X className="size-4" aria-hidden />
        </button>

        {status === "success" ? (
          <div className="pe-12">
            <h2 id={titleId} className="font-display text-xl font-bold text-[var(--fg)]">
              {demoModal.successTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
              {demoModal.successBody}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="story-nav-cta-primary mt-8 min-h-12 w-full sm:min-h-0"
            >
              {demoModal.close}
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="font-display pe-12 text-xl font-bold text-[var(--fg)]">
              {demoModal.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
              {demoModal.subtitle}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="demo-email"
                  className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-white/45"
                >
                  {demoModal.emailLabel}
                </label>
                <input
                  ref={inputRef}
                  id="demo-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={demoModal.emailPlaceholder}
                  className={cn(
                    "w-full rounded-xl border bg-black/30 px-4 py-3 text-[15px] text-[var(--fg)] outline-none transition",
                    "placeholder:text-white/30 focus:border-[rgba(0,234,255,0.45)] focus:ring-2 focus:ring-[rgba(0,234,255,0.2)]",
                    error ? "border-red-400/60" : "border-white/12",
                  )}
                />
                {error ? (
                  <p className="mt-2 text-[13px] text-red-300/90" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="story-nav-cta-primary min-h-12 w-full disabled:cursor-wait disabled:opacity-70 sm:min-h-0"
              >
                {status === "submitting" ? demoModal.submitting : demoModal.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
