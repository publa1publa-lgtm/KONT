"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { NavLocaleSwitch } from "@/components/new_home/NavLocaleSwitch";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { stripLocalePrefix, withLocale } from "@/i18n/config";

const NAV_HREFS = ["#pillars", "#product", "#benefits"] as const;

export function NewHomeNav() {
  const { locale, messages } = useI18n();
  const { story } = messages;
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated, loading: authLoading } = useCurrentUser();
  const studioHref = withLocale(locale, "/studio");
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = NAV_HREFS.map((href) => document.getElementById(href.slice(1))).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveHref(`#${visible.target.id}`);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.08, 0.25, 0.5] },
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const pathname = usePathname();
  const homeHref = withLocale(locale, "/");
  const isHome = stripLocalePrefix(pathname || "/") === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `${homeHref}${href}` : href);

  const navLinks = [
    { href: "#pillars", label: story.nav.howItWorks },
    { href: "#product", label: story.nav.product },
    { href: "#benefits", label: story.nav.benefits },
  ] as const;

  return (
    <header className={["new-home-nav", scrolled ? "is-scrolled" : "", menuOpen ? "is-open" : ""].filter(Boolean).join(" ")}>
      <nav className="new-home-nav__shell" aria-label="Main">
        <Link href={homeHref} className="new-home-nav__brand cursor-pointer" aria-label={story.brand}>
          <KontBrandLogo decorative className="new-home-nav__logo" priority />
        </Link>

        <div className="new-home-nav__links">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={resolveHref(link.href)}
              className={link.href === activeHref ? "new-home-nav__link is-active" : "new-home-nav__link"}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="new-home-nav__actions">
          <NavLocaleSwitch />
          {authLoading ? (
            <span className="new-home-nav__auth-slot" aria-hidden />
          ) : isAuthenticated ? (
            <Link href={studioHref} className="new-home-nav__cta cursor-pointer">
              {story.nav.studio}
            </Link>
          ) : (
            <>
              <button type="button" onClick={openLogin} className="new-home-nav__sign-in cursor-pointer">
                {story.nav.signIn}
              </button>
              <button type="button" onClick={openRegister} className="new-home-nav__cta cursor-pointer">
                {story.nav.signUp}
              </button>
            </>
          )}

          <button
            type="button"
            className="new-home-nav__menu-btn cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        id={menuId}
        className={`new-home-nav__mobile${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="new-home-nav__mobile-backdrop"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />

        <div className="new-home-nav__mobile-panel" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="new-home-nav__mobile-links">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={resolveHref(link.href)}
                className={
                  link.href === activeHref
                    ? "new-home-nav__mobile-link is-active"
                    : "new-home-nav__mobile-link"
                }
                onClick={closeMenu}
              >
                <span className="new-home-nav__mobile-label">{link.label}</span>
                <ChevronRight className="new-home-nav__mobile-chevron" aria-hidden />
              </a>
            ))}
          </div>

          <div className="new-home-nav__mobile-actions">
            <div className="new-home-nav__mobile-btns">
              {isAuthenticated ? (
                <Link
                  href={studioHref}
                  className="new-home-nav__mobile-cta cursor-pointer"
                  onClick={closeMenu}
                >
                  {story.nav.studio}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="new-home-nav__mobile-cta cursor-pointer"
                    onClick={() => {
                      closeMenu();
                      openRegister();
                    }}
                  >
                    {story.nav.signUp}
                  </button>
                  <button
                    type="button"
                    className="new-home-nav__mobile-sign-in cursor-pointer"
                    onClick={() => {
                      closeMenu();
                      openLogin();
                    }}
                  >
                    {story.nav.signIn}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
