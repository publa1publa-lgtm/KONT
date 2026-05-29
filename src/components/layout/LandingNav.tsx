"use client";

import Link from "next/link";

import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const { story } = useMessages();
  const { openModal } = useDemoModal();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center overflow-visible px-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] sm:px-8">
      <nav
        className={cn(
          "glass-nav story-nav-shell story-nav-shell--home pointer-events-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6",
        )}
      >
        <div className="story-nav-rail story-nav-rail--centered grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              href="/"
              className="story-nav-wordmark font-display min-w-0 text-sm font-bold tracking-tight text-[var(--fg)] drop-shadow-[0_0_14px_rgba(0,234,255,0.22)] transition sm:text-base"
            >
              <span className="story-nav-logo-dot" aria-hidden />
              <span className="truncate">{story.brand}</span>
            </Link>
          </div>

          <div className="story-nav-links-track justify-self-center">
            <div className="story-nav-links-inner story-nav-links-inner--segmented">
              <a href="#pillars" className="story-nav-link hidden sm:inline-flex">
                {story.nav.howItWorks}
              </a>
              <a href="#benefits" className="story-nav-link hidden sm:inline-flex">
                {story.nav.benefits}
              </a>
            </div>
          </div>

          <div className="flex justify-self-end">
            <button
              type="button"
              onClick={openModal}
              className="story-nav-cta-primary shrink-0"
            >
              {story.nav.cta}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
