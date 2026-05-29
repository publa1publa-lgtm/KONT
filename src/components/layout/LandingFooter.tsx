"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";

export function LandingFooter() {
  const { story } = useMessages();
  const F = story.footer;
  const { openModal } = useDemoModal();

  return (
    <footer
      id="footer-cta"
      className="story-footer-shell relative z-10 mt-10 w-full pb-[max(1.75rem,env(safe-area-inset-bottom,0px))]"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="story-footer-shell__inner mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14"
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.55fr_0.75fr_0.75fr_0.75fr] lg:items-start lg:gap-x-16">
          <div className="min-w-0">
            <p className="font-display text-[clamp(1.9rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.03em] text-[var(--fg)]">
              {story.brand}
            </p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--muted)] sm:text-[16px]">
              {F.tagline}
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.32em] text-white/25">
              {F.trustLine}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
              {F.productColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-white/70">
              {F.productLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-[var(--fg)] hover:underline hover:underline-offset-4"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
              {F.resourcesColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-white/70">
              {F.resourceLinks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={openModal}
                  className="text-left transition hover:text-[var(--fg)] hover:underline hover:underline-offset-4"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
              {F.companyColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-white/70">
              {F.companyLinks.map((item) => (
                <span key={item.label} className="text-white/35">
                  {item.label}
                </span>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.09] pt-6 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/25">
            © {new Date().getFullYear()} {story.brand}
          </p>
          <p className="text-[12px] text-white/35">{F.trustLine}</p>
        </div>
      </motion.div>
    </footer>
  );
}
