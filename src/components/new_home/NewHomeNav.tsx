"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { NavLocaleSwitch } from "@/components/new_home/NavLocaleSwitch";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";

export function NewHomeNav() {
  const { locale, messages } = useI18n();
  const { story } = messages;
  const { openLogin, openRegister } = useAuthModal();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const closeMenu = () => setMenuOpen(false);
  const homeHref = withLocale(locale, "/");

  const navLinks = [
    { href: "#pillars", label: story.nav.howItWorks },
    { href: "#product", label: story.nav.product },
    { href: "#benefits", label: story.nav.benefits },
  ] as const;

  return (
    <header className="new-home-nav">
      <nav className="new-home-nav__shell" aria-label="Main">
        <Link href={homeHref} className="new-home-nav__brand cursor-pointer" aria-label={story.brand}>
          <KontBrandLogo decorative className="new-home-nav__logo" priority />
        </Link>

        <div className="new-home-nav__links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="new-home-nav__link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="new-home-nav__actions">
          <NavLocaleSwitch />
          <button type="button" onClick={openLogin} className="new-home-nav__sign-in cursor-pointer">
            {story.nav.signIn}
          </button>
          <button type="button" onClick={openRegister} className="new-home-nav__cta cursor-pointer">
            {story.nav.signUp}
          </button>

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

      {menuOpen ? (
        <div id={menuId} className="new-home-nav__drawer" role="dialog" aria-modal="true">
          <div className="new-home-nav__drawer-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="new-home-nav__drawer-link" onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            <NavLocaleSwitch variant="drawer" />
            <button
              type="button"
              className="new-home-nav__drawer-link cursor-pointer text-start"
              onClick={() => {
                closeMenu();
                openLogin();
              }}
            >
              {story.nav.signIn}
            </button>
            <button
              type="button"
              className="new-home-nav__drawer-cta cursor-pointer"
              onClick={() => {
                closeMenu();
                openRegister();
              }}
            >
              {story.nav.signUp}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
