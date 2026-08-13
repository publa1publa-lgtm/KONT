"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { auth } = useMessages();
  const { open, mode, setMode, closeModal } = useAuthModal();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open, closeModal]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden'])",
      );
      first?.focus();
    }, 40);
    return () => window.clearTimeout(t);
  }, [open, mode]);

  if (!open || typeof document === "undefined") return null;

  const isLogin = mode === "login";
  const title = isLogin ? auth.login.title : auth.register.modalTitle;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="absolute inset-0 bg-[#0b1a38]/35 backdrop-blur-[10px]" aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[1] flex w-full max-w-[32rem] flex-col overflow-hidden",
          "rounded-[1.5rem] border border-[rgba(0,113,227,0.14)]",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.96)_100%)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_8px_20px_-8px_rgba(8,16,46,0.18),0_40px_72px_-36px_rgba(6,12,40,0.38)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% -30%, rgba(0,113,227,0.14), transparent 70%)",
          }}
        />

        <h2 id={titleId} className="sr-only">
          {title}
        </h2>

        <div className="relative flex shrink-0 items-center justify-between gap-3 px-5 pb-0 pt-4 sm:px-6 sm:pt-5">
          <span className="inline-flex rounded-full bg-[linear-gradient(120deg,#0071e3,#5e5ce6)] px-2.5 py-1">
            <KontBrandLogo decorative className="h-5 w-auto" />
          </span>

          <button
            type="button"
            onClick={closeModal}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[rgba(0,113,227,0.14)] bg-white text-[rgba(29,29,31,0.55)] transition hover:border-[rgba(0,113,227,0.28)] hover:bg-[rgba(0,113,227,0.06)] hover:text-[#1d1d1f]"
            aria-label={auth.cancel}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="relative px-5 pt-4 sm:px-6">
          <div
            role="tablist"
            aria-label="Auth"
            className="grid grid-cols-2 gap-1 rounded-xl border border-[rgba(0,113,227,0.12)] bg-white p-1"
          >
            <ModeTab
              active={isLogin}
              label={auth.login.title}
              onClick={() => setMode("login")}
            />
            <ModeTab
              active={!isLogin}
              label={auth.register.title}
              onClick={() => setMode("register")}
            />
          </div>
        </div>

        <div className="relative overflow-hidden px-5 py-4 sm:px-6 sm:pb-5">
          {isLogin ? (
            <LoginForm embedded onRequestRegister={() => setMode("register")} />
          ) : (
            <RegisterForm compact showHeader={false} onRequestSignIn={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-[rgba(219,234,254,0.95)] text-[#0071e3]"
          : "bg-transparent text-[rgba(29,29,31,0.48)] hover:bg-[rgba(15,23,42,0.04)] hover:text-[#1d1d1f]",
      )}
    >
      {label}
    </button>
  );
}
