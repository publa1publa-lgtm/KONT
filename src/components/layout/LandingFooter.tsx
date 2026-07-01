"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";

type LandingFooterProps = {
  brandWordmark?: boolean;
  variant?: "default" | "landing";
};

export function LandingFooter({ brandWordmark = false, variant = "default" }: LandingFooterProps) {
  const { story } = useMessages();
  const F = story.footer;
  const { openModal } = useDemoModal();
  const isLanding = variant === "landing";

  const trustItems = F.trustLine.split("·").map((item) => item.trim()).filter(Boolean);

  const renderResourceLink = (item: (typeof F.resourceLinks)[number], className: string) => {
    if (item.href === "#") {
      return (
        <button key={item.label} type="button" onClick={openModal} className={className}>
          {item.label}
        </button>
      );
    }

    return (
      <Link key={item.href} href={item.href} className={className}>
        {item.label}
      </Link>
    );
  };

  if (isLanding) {
    return (
      <footer id="footer-cta" className="story-footer-shell nh-footer">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="nh-footer__inner"
        >
          <div className="nh-footer__main">
            <div className="nh-footer__intro">
              <Link href="/" className="nh-footer__brand" aria-label={story.brand}>
                <KontBrandLogo decorative className="nh-footer__logo" />
              </Link>
              <p className="nh-footer__tagline">{F.tagline}</p>
              <ul className="nh-footer__trust" aria-label="Trust indicators">
                {trustItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="nh-footer__columns">
              <div className="nh-footer__col">
                <p className="nh-footer__label">{F.productColumn}</p>
                <nav className="nh-footer__nav" aria-label={F.productColumn}>
                  {F.productLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="nh-footer__link">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="nh-footer__col">
                <p className="nh-footer__label">{F.resourcesColumn}</p>
                <nav className="nh-footer__nav" aria-label={F.resourcesColumn}>
                  {F.resourceLinks.map((item) =>
                    renderResourceLink(
                      item,
                      item.href === "#"
                        ? "nh-footer__link nh-footer__link--button"
                        : "nh-footer__link",
                    ),
                  )}
                </nav>
              </div>

              <div className="nh-footer__col">
                <p className="nh-footer__label">{F.companyColumn}</p>
                <nav className="nh-footer__nav" aria-label={F.companyColumn}>
                  {F.companyLinks.map((item) => (
                    <span key={item.label} className="nh-footer__link nh-footer__link--muted">
                      {item.label}
                    </span>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="nh-footer__bar">
            <p className="nh-footer__copy">
              © {new Date().getFullYear()} {story.brand}
            </p>
          </div>
        </motion.div>
      </footer>
    );
  }

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
            {brandWordmark ? (
              <p className="font-display text-[clamp(1.9rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.03em] text-[var(--fg)]">
                {story.brand}
              </p>
            ) : (
              <p className="font-display text-[clamp(1.9rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.03em] text-[var(--fg)]">
                {story.brand}
              </p>
            )}
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--muted)] sm:text-[16px]">
              {F.tagline}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {F.productColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-[var(--muted)]">
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
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {F.resourcesColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-[var(--muted)]">
              {F.resourceLinks.map((item) =>
                renderResourceLink(
                  item,
                  item.href === "#"
                    ? "text-left transition hover:text-[var(--fg)] hover:underline hover:underline-offset-4"
                    : "transition hover:text-[var(--fg)] hover:underline hover:underline-offset-4",
                ),
              )}
            </nav>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {F.companyColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-[var(--muted)]">
              {F.companyLinks.map((item) => (
                <span key={item.label} className="text-[var(--muted)] opacity-60">
                  {item.label}
                </span>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[rgba(15,23,42,0.1)] pt-6 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            © {new Date().getFullYear()} {story.brand}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
