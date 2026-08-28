"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useI18n } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import { useStartWorkspace } from "@/hooks/useStartWorkspace";
import { stripLocalePrefix, withLocale, type AppLocale } from "@/i18n/config";

type LandingFooterProps = {
  variant?: "default" | "landing";
};

function localizeHref(locale: AppLocale, href: string) {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
    return href;
  }
  if (href.startsWith("#")) {
    return `${withLocale(locale, "/")}${href}`;
  }
  if (href.startsWith("/")) {
    return withLocale(locale, href);
  }
  return href;
}

function isLegalHrefActive(pathname: string, href: string) {
  const bare = stripLocalePrefix(pathname || "/");
  if (href === "/privacy-policy") {
    return bare === "/privacy-policy" || /\/privacy$/.test(bare);
  }
  if (href === "/terms") {
    return bare === "/terms" || /\/terms$/.test(bare) || (bare.startsWith("/terms/") && !bare.endsWith("/privacy"));
  }
  return false;
}

export function LandingFooter({ variant = "default" }: LandingFooterProps) {
  const { story } = useMessages();
  const { locale } = useI18n();
  const pathname = usePathname();
  const F = story.footer;
  const { start, isAuthenticated, studioHref } = useStartWorkspace();
  const isLanding = variant === "landing";
  const homeHref = withLocale(locale, "/");

  const renderCompanyLink = (item: (typeof F.companyLinks)[number], className: string) => {
    const href = localizeHref(locale, item.href);
    const active = isLegalHrefActive(pathname || "/", item.href);
    return (
      <Link
        key={item.href}
        href={href}
        className={active ? `${className} is-active` : className}
        aria-current={active ? "page" : undefined}
      >
        {item.label}
      </Link>
    );
  };

  const trustItems = F.trustLine.split("·").map((item) => item.trim()).filter(Boolean);

  const renderResourceLink = (item: (typeof F.resourceLinks)[number], className: string) => {
    if (item.href === "#") {
      if (isAuthenticated) {
        return (
          <Link key={item.label} href={studioHref} className={className}>
            {story.nav.studio}
          </Link>
        );
      }
      return (
        <button key={item.label} type="button" onClick={start} className={className}>
          {item.label}
        </button>
      );
    }

    return (
      <Link key={item.href} href={localizeHref(locale, item.href)} className={className}>
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
          <div className="nh-footer__intro">
            <Link href={homeHref} className="nh-footer__brand cursor-pointer" aria-label={story.brand}>
              <KontBrandLogo variant="mark" decorative className="nh-footer__logo" />
              <span className="nh-footer__wordmark" aria-hidden="true">{story.brand}</span>
            </Link>
            <p className="nh-footer__tagline">{F.tagline}</p>
          </div>

          <ul className="nh-footer__trust" aria-label="Trust indicators">
            {trustItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="nh-footer__columns">
            <div className="nh-footer__col">
              <p className="nh-footer__label">{F.productColumn}</p>
              <nav className="nh-footer__nav" aria-label={F.productColumn}>
                {F.productLinks.map((item) => (
                  <Link key={item.href} href={localizeHref(locale, item.href)} className="nh-footer__link">
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

            <div className="nh-footer__col nh-footer__col--legal">
              <p className="nh-footer__label">{F.companyColumn}</p>
              <nav className="nh-footer__nav" aria-label={F.companyColumn}>
                {F.companyLinks.map((item) => renderCompanyLink(item, "nh-footer__link"))}
              </nav>
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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[0.75fr_0.75fr_0.75fr_1.55fr] lg:items-end lg:gap-x-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {F.productColumn}
            </p>
            <nav className="mt-4 grid gap-2 text-[13px] text-[var(--muted)]">
              {F.productLinks.map((item) => (
                <Link
                  key={item.href}
                  href={localizeHref(locale, item.href)}
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
              {F.companyLinks.map((item) =>
                renderCompanyLink(
                  item,
                  "transition hover:text-[var(--fg)] hover:underline hover:underline-offset-4",
                ),
              )}
            </nav>
          </div>

          <div className="min-w-0 flex flex-col items-end text-end sm:col-span-2 lg:col-span-1">
            <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)] sm:text-[16px]">
              {F.tagline}
            </p>
            <Link href={homeHref} className="mt-4 inline-flex items-center" aria-label={story.brand}>
              <KontBrandLogo variant="mark" decorative className="h-12 w-12 rounded-[0.7rem]" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-end border-t border-[rgba(15,23,42,0.1)] pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            © {new Date().getFullYear()} {story.brand}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
