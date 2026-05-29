"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestDemoModal() {
  const { demoModal } = useMessages();
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
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
          "relative z-[1] w-full max-w-md rounded-2xl border border-white/10 p-6 sm:p-8",
          "bg-[linear-gradient(165deg,rgba(18,18,22,0.95)_0%,rgba(10,10,14,0.92)_100%)]",
          "shadow-[0_28px_90px_-36px_rgba(0,0,0,0.92),0_0_48px_-20px_rgba(0,234,255,0.12)]",
        )}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
          aria-label={demoModal.close}
        >
          <X className="size-4" aria-hidden />
        </button>

        {status === "success" ? (
          <div className="pr-8">
            <h2 id={titleId} className="font-display text-xl font-bold text-[var(--fg)]">
              {demoModal.successTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
              {demoModal.successBody}
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="story-nav-cta-primary mt-8 w-full"
            >
              {demoModal.close}
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="font-display pr-8 text-xl font-bold text-[var(--fg)]">
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
                  autoComplete="email"
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
                className="story-nav-cta-primary w-full disabled:cursor-wait disabled:opacity-70"
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
