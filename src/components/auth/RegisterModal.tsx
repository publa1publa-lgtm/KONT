"use client";

import { useEffect } from "react";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { useMessages } from "@/contexts/messages-context";

type Props = {
  open: boolean;
  onClose: () => void;
  onRequestSignIn?: () => void;
};

export function RegisterModal({ open, onClose, onRequestSignIn }: Props) {
  const { auth } = useMessages();

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[rgba(10,10,12,0.92)] shadow-[0_32px_96px_-48px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl sm:max-h-[min(92dvh,780px)]"
      >
        <div id="register-modal-title" className="sr-only">
          {auth.register.modalTitle}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
          <RegisterForm
            showHeader
            className="pr-0 sm:pr-0"
            onRequestSignIn={
              onRequestSignIn
                ? () => {
                    onClose();
                    onRequestSignIn();
                  }
                : undefined
            }
          />
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/20 px-6 py-4 sm:px-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-[var(--fg)] transition hover:border-white/20 hover:bg-white/[0.10]"
            >
              {auth.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
