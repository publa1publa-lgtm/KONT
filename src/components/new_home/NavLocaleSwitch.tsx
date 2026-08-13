"use client";

import { Check, Globe2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/contexts/i18n-context";
import { LOCALES, type AppLocale } from "@/i18n/config";

const LANGS: { id: AppLocale; short: string; native: string }[] = [
  { id: "en", short: "EN", native: "English" },
  { id: "ru", short: "RU", native: "Русский" },
  { id: "he", short: "HE", native: "עברית" },
];

function Flag({ locale }: { locale: AppLocale }) {
  if (locale === "ru") {
    return (
      <svg className="new-home-nav__flag" viewBox="0 0 18 18" aria-hidden>
        <rect width="18" height="18" rx="4" fill="#fff" />
        <rect y="6" width="18" height="6" fill="#0039a6" />
        <rect y="12" width="18" height="6" fill="#d52b1e" />
      </svg>
    );
  }

  if (locale === "he") {
    return (
      <svg className="new-home-nav__flag" viewBox="0 0 18 18" aria-hidden>
        <rect width="18" height="18" rx="4" fill="#fff" />
        <rect y="3" width="18" height="2.1" fill="#0038b8" />
        <rect y="12.9" width="18" height="2.1" fill="#0038b8" />
        <path
          fill="#0038b8"
          d="M9 5.55 10.18 8.1h2.67l-2.16 1.57.83 2.55L9 10.7l-2.52 1.52.83-2.55-2.16-1.57h2.67z"
        />
      </svg>
    );
  }

  return (
    <svg className="new-home-nav__flag" viewBox="0 0 18 18" aria-hidden>
      <rect width="18" height="18" rx="4" fill="#fff" />
      <rect y="2.25" width="18" height="1.5" fill="#b22234" />
      <rect y="5.25" width="18" height="1.5" fill="#b22234" />
      <rect y="8.25" width="18" height="1.5" fill="#b22234" />
      <rect y="11.25" width="18" height="1.5" fill="#b22234" />
      <rect y="14.25" width="18" height="1.5" fill="#b22234" />
      <rect width="8.2" height="9" fill="#3c3b6e" />
    </svg>
  );
}

export function NavLocaleSwitch({
  variant = "nav",
  onPicked,
}: {
  variant?: "nav" | "drawer";
  onPicked?: () => void;
}) {
  const { locale, setLocale, messages } = useI18n();
  const label = messages.story.nav.language;
  const current = LANGS.find((item) => item.id === locale) ?? LANGS[0];
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 176;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8);
      setCoords({ top: rect.bottom + 8, left });
    };

    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const pick = (id: AppLocale) => {
    setOpen(false);
    onPicked?.();
    if (id === locale) return;
    void setLocale(id);
  };

  const rows = LOCALES.map((id) => {
    const lang = LANGS.find((item) => item.id === id)!;
    const active = locale === id;
    return (
      <button
        key={id}
        type="button"
        role="option"
        aria-selected={active}
        className={active ? "new-home-nav__lang-row is-active" : "new-home-nav__lang-row"}
        onClick={() => pick(id)}
      >
        <Flag locale={id} />
        <span className="new-home-nav__lang-native">{lang.native}</span>
        {active ? <Check className="new-home-nav__lang-check" aria-hidden /> : <span />}
      </button>
    );
  });

  if (variant === "drawer") {
    return (
      <div className="new-home-nav__lang-sheet" role="listbox" aria-label={label}>
        {rows}
      </div>
    );
  }

  return (
    <div className="new-home-nav__locale">
      <button
        ref={btnRef}
        type="button"
        className={open ? "new-home-nav__locale-btn is-open" : "new-home-nav__locale-btn"}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe2 aria-hidden />
        <span>{current.short}</span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="listbox"
              aria-label={label}
              className="new-home-nav__locale-menu"
              style={{ top: coords.top, left: coords.left }}
            >
              {rows}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
