"use client";

import Link from "next/link";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useDemoModal } from "@/contexts/demo-modal-context";
import { useMessages } from "@/contexts/messages-context";

export function NewHomeNav() {
  const { story } = useMessages();
  const { openModal } = useDemoModal();

  return (
    <header className="new-home-nav">
      <nav className="new-home-nav__shell" aria-label="Main">
        <Link href="/" className="new-home-nav__brand cursor-pointer" aria-label={story.brand}>
          <KontBrandLogo decorative className="new-home-nav__logo" priority />
        </Link>

        <div className="new-home-nav__links">
          <a href="#pillars" className="new-home-nav__link">
            {story.nav.howItWorks}
          </a>
          <a href="#product" className="new-home-nav__link">
            Product
          </a>
          <a href="#benefits" className="new-home-nav__link">
            {story.nav.benefits}
          </a>
        </div>

        <div className="new-home-nav__actions">
          <Link href="/studio" className="new-home-nav__studio">
            {story.nav.studio}
          </Link>
          <button type="button" onClick={openModal} className="new-home-nav__cta cursor-pointer">
            {story.nav.cta}
          </button>
        </div>
      </nav>
    </header>
  );
}
