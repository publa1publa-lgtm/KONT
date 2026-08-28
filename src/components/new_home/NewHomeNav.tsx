"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDotsIcon, ChartLineUpIcon, PenNibIcon } from "@phosphor-icons/react";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { NavLocaleSwitch } from "@/components/new_home/NavLocaleSwitch";
import { SECTIONS, STUDIO_TILE_ARROW, type SectionId } from "@/components/studio/sections";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { stripLocalePrefix, withLocale } from "@/i18n/config";
import {
  hrefForLandingItem,
  LANDING_SECTION_FEATURES,
  LANDING_SECTIONS,
  landingHashForItem,
  landingHashForSection,
  scrollToLandingHash,
  sectionFromLandingHash,
} from "@/lib/landingNav";

const SECTION_ICONS = {
  create: PenNibIcon,
  manage: CalendarDotsIcon,
  grow: ChartLineUpIcon,
} as const;

export function NewHomeNav() {
  const { locale, messages } = useI18n();
  const { story, studio } = messages;
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated, loading: authLoading } = useCurrentUser();
  const studioHref = withLocale(locale, "/studio");
  const menuId = useId();
  const flyId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [hoverSection, setHoverSection] = useState<SectionId>("create");
  const [mobilePlatformOpen, setMobilePlatformOpen] = useState(true);
  const [mobileSection, setMobileSection] = useState<SectionId | null>("create");
  const [flyCoords, setFlyCoords] = useState({ top: 0, left: 0, width: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState<SectionId | "benefits" | "">("");

  const pathname = usePathname();
  const homeHref = withLocale(locale, "/");
  const isHome = stripLocalePrefix(pathname || "/") === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `${homeHref}${href}` : href);
  const platformActive = activeKey !== "" && activeKey !== "benefits";

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
    if (!platformOpen) return;

    const place = () => {
      const shell = document.querySelector<HTMLElement>(".new-home-nav__shell");
      const rect = shell?.getBoundingClientRect();
      if (!rect) return;
      setFlyCoords({ top: rect.bottom + 10, left: rect.left, width: rect.width });
    };

    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPlatformOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || flyRef.current?.contains(t)) return;
      setPlatformOpen(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [platformOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((was) => (was ? y > 8 : y > 28));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const hashes = [
      "#benefits",
      ...LANDING_SECTIONS.map(landingHashForSection),
      ...Object.values(LANDING_SECTION_FEATURES).flat().map(landingHashForItem),
    ];
    const nodes = [...new Set(hashes)]
      .map((href) => document.getElementById(href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target.id) return;
        const next = sectionFromLandingHash(`#${visible.target.id}`) ?? "";
        setActiveKey(next);
        if (next && next !== "benefits") setHoverSection(next);
      },
      { rootMargin: "-16% 0px -68% 0px", threshold: [0.08, 0.22, 0.45] },
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!isHome || !window.location.hash) return;
    const hash = window.location.hash;
    const id = requestAnimationFrame(() => {
      scrollToLandingHash(hash, "auto");
      const next = sectionFromLandingHash(hash) ?? "";
      setActiveKey(next);
      if (next && next !== "benefits") setHoverSection(next);
    });
    return () => cancelAnimationFrame(id);
  }, [isHome]);

  const closeAll = () => {
    window.clearTimeout(hoverTimer.current);
    setMenuOpen(false);
    setPlatformOpen(false);
  };

  const previewSection = (section: SectionId) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoverSection(section), 70);
  };

  const goHash = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") || !isHome) {
      closeAll();
      return;
    }
    event.preventDefault();
    closeAll();
    const next = sectionFromLandingHash(href) ?? "";
    setActiveKey(next);
    if (next && next !== "benefits") setHoverSection(next);
    scrollToLandingHash(href);
  };

  const itemHref = (itemId: string) =>
    isAuthenticated ? hrefForLandingItem(itemId, locale, true) : resolveHref(landingHashForItem(itemId));

  return (
    <header className={["new-home-nav", scrolled ? "is-scrolled" : "", menuOpen ? "is-open" : ""].filter(Boolean).join(" ")}>
      <nav className="new-home-nav__shell" aria-label="Main">
        <Link href={homeHref} className="new-home-nav__brand cursor-pointer" aria-label={story.brand}>
          <KontBrandLogo decorative className="new-home-nav__logo" priority />
        </Link>

        <div className="new-home-nav__links">
          <button
            ref={triggerRef}
            type="button"
            className={
              platformOpen || platformActive
                ? "new-home-nav__link is-active cursor-pointer"
                : "new-home-nav__link cursor-pointer"
            }
            aria-expanded={platformOpen}
            aria-controls={flyId}
            aria-haspopup="menu"
            onClick={() => setPlatformOpen((open) => !open)}
          >
            {story.nav.ourPlatform}
            <ChevronDown aria-hidden />
          </button>
          <a
            href={resolveHref("#benefits")}
            className={activeKey === "benefits" ? "new-home-nav__link is-active" : "new-home-nav__link"}
            onClick={(event) => goHash(event, "#benefits")}
          >
            {story.nav.benefits}
          </a>
        </div>

        {platformOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={flyRef}
                id={flyId}
                className={`new-home-nav__fly new-home-nav__fly--${hoverSection}`}
                role="menu"
                aria-label={story.nav.ourPlatform}
                style={{ top: flyCoords.top, left: flyCoords.left, width: flyCoords.width }}
              >
                <div className="new-home-nav__fly-rail" role="none">
                  {LANDING_SECTIONS.map((section) => {
                    const SectionIcon = SECTION_ICONS[section];
                    const active = hoverSection === section;
                    return (
                      <button
                        key={section}
                        type="button"
                        role="menuitem"
                        className={
                          active
                            ? "new-home-nav__fly-section is-active cursor-pointer"
                            : "new-home-nav__fly-section cursor-pointer"
                        }
                        aria-haspopup="true"
                        onMouseEnter={() => previewSection(section)}
                        onFocus={() => setHoverSection(section)}
                        onClick={() => setHoverSection(section)}
                      >
                        <span className="new-home-nav__fly-ico" aria-hidden>
                          <SectionIcon weight={active ? "duotone" : "regular"} />
                        </span>
                        <strong>{studio.sections[section].label}</strong>
                        <ChevronRight aria-hidden className="new-home-nav__fly-chevron" />
                      </button>
                    );
                  })}
                </div>

                <div className="new-home-nav__fly-pane" role="none">
                  <div className="new-home-nav__tile-grid" data-section={hoverSection} key={hoverSection}>
                    {SECTIONS[hoverSection].items.map((entry) => {
                      const item = studio.items[entry.id as keyof typeof studio.items];
                      const Icon = entry.icon;
                      const Arrow = STUDIO_TILE_ARROW;
                      return (
                        <Link
                          key={entry.id}
                          href={itemHref(entry.id)}
                          role="menuitem"
                          aria-label={item?.label ?? entry.id}
                          className="new-home-nav__tile cursor-pointer"
                          data-section={hoverSection}
                          style={{ gridArea: entry.area }}
                          onClick={(event) => {
                            if (!isAuthenticated) goHash(event, landingHashForItem(entry.id));
                            else closeAll();
                          }}
                        >
                          <span className="new-home-nav__tile-sheen" aria-hidden />
                          <span className="new-home-nav__tile-top">
                            <span className="new-home-nav__tile-icon" aria-hidden>
                              <Icon weight="duotone" />
                            </span>
                            <span className="new-home-nav__tile-arrow" aria-hidden>
                              <Arrow weight="bold" />
                            </span>
                          </span>
                          <span className="new-home-nav__tile-foot">
                            <span className="new-home-nav__tile-label">{item?.label ?? entry.id}</span>
                            {item?.hint ? <span className="new-home-nav__tile-pitch">{item.hint}</span> : null}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

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
            aria-label={menuOpen ? story.nav.closeMenu : story.nav.openMenu}
            onClick={() => {
              setPlatformOpen(false);
              setMenuOpen((open) => !open);
            }}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </nav>

      <div id={menuId} className={`new-home-nav__mobile${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <button
          type="button"
          className="new-home-nav__mobile-backdrop"
          aria-label={story.nav.closeMenu}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeAll}
        />

        <div className="new-home-nav__mobile-panel" role="dialog" aria-modal="true" aria-label={story.nav.openMenu}>
          <div className="new-home-nav__mobile-links">
            <div className={mobilePlatformOpen ? "new-home-nav__mobile-group is-open" : "new-home-nav__mobile-group"}>
              <button
                type="button"
                className={
                  platformActive
                    ? "new-home-nav__mobile-link new-home-nav__mobile-link--btn is-active cursor-pointer"
                    : "new-home-nav__mobile-link new-home-nav__mobile-link--btn cursor-pointer"
                }
                aria-expanded={mobilePlatformOpen}
                onClick={() => setMobilePlatformOpen((open) => !open)}
              >
                <span className="new-home-nav__mobile-label">{story.nav.ourPlatform}</span>
                <ChevronDown className="new-home-nav__mobile-chevron" aria-hidden />
              </button>

              {mobilePlatformOpen
                ? LANDING_SECTIONS.map((section) => (
                    <div key={section} className="new-home-nav__mobile-nested">
                      <button
                        type="button"
                        className={
                          mobileSection === section
                            ? "new-home-nav__mobile-sub is-active cursor-pointer"
                            : "new-home-nav__mobile-sub cursor-pointer"
                        }
                        onClick={() => setMobileSection((current) => (current === section ? null : section))}
                      >
                        {studio.sections[section].label}
                        <ChevronDown aria-hidden />
                      </button>
                      {mobileSection === section
                        ? LANDING_SECTION_FEATURES[section].map((itemId) => {
                            const item = studio.items[itemId as keyof typeof studio.items];
                            return (
                              <Link
                                key={itemId}
                                href={itemHref(itemId)}
                                className="new-home-nav__mobile-leaf"
                                onClick={(event) => {
                                  if (!isAuthenticated) goHash(event, landingHashForItem(itemId));
                                  else closeAll();
                                }}
                              >
                                {item?.label ?? itemId}
                              </Link>
                            );
                          })
                        : null}
                    </div>
                  ))
                : null}
            </div>

            <a
              href={resolveHref("#benefits")}
              className={activeKey === "benefits" ? "new-home-nav__mobile-link is-active" : "new-home-nav__mobile-link"}
              onClick={(event) => goHash(event, "#benefits")}
            >
              <span className="new-home-nav__mobile-label">{story.nav.benefits}</span>
              <ChevronRight className="new-home-nav__mobile-chevron" aria-hidden />
            </a>
          </div>

          <NavLocaleSwitch variant="drawer" onPicked={closeAll} />

          <div className="new-home-nav__mobile-actions">
            <div className="new-home-nav__mobile-btns">
              {isAuthenticated ? (
                <Link href={studioHref} className="new-home-nav__mobile-cta cursor-pointer" onClick={closeAll}>
                  {story.nav.studio}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className="new-home-nav__mobile-cta cursor-pointer"
                    onClick={() => {
                      closeAll();
                      openRegister();
                    }}
                  >
                    {story.nav.signUp}
                  </button>
                  <button
                    type="button"
                    className="new-home-nav__mobile-sign-in cursor-pointer"
                    onClick={() => {
                      closeAll();
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
