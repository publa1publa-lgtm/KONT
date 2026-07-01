"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";

export function NewHomeNav() {
  const { story } = useMessages();
  const { openModal } = useDemoModal();
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

  const navLinks = [
    { href: "#pillars", label: story.nav.howItWorks },
    { href: "#product", label: "Product" },
    { href: "#benefits", label: story.nav.benefits },
  ] as const;

  return (
    <header className="new-home-nav">
      <nav className="new-home-nav__shell" aria-label="Main">
        <Link href="/" className="new-home-nav__brand cursor-pointer" aria-label={story.brand}>
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
          <Link href="/studio" className="new-home-nav__studio">
            {story.nav.studio}
          </Link>
          <button type="button" onClick={openModal} className="new-home-nav__cta cursor-pointer">
            {story.nav.cta}
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
              <a key={link.href} href={link.href} className="new-home-nav__mobile-link" onClick={closeMenu}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="new-home-nav__mobile-actions">
            <Link href="/studio" className="new-home-nav__mobile-studio" onClick={closeMenu}>
              {story.nav.studio}
            </Link>
            <button
              type="button"
              className="new-home-nav__mobile-cta cursor-pointer"
              onClick={() => {
                closeMenu();
                openModal();
              }}
            >
              {story.nav.cta}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
