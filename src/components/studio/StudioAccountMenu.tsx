"use client";

import { CircleUserRound, ChevronDown, LifeBuoy, LogOut, Settings2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useI18n } from "@/contexts/i18n-context";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { AppLocale } from "@/i18n/config";
import { withLocale } from "@/i18n/config";
import { apiMutate } from "@/lib/api/clientFetch";
import { userDisplayName, userInitials } from "@/lib/auth/userDisplay";
import {
  applyStudioTheme,
  readStudioTheme,
  writeStudioTheme,
  type StudioTheme,
} from "@/lib/studio/preferences";

export function StudioAccountMenu() {
  const { locale, messages, setLocale } = useI18n();
  const { studio } = messages;
  const A = studio.account;
  const { user } = useCurrentUser();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<StudioTheme>("light");

  useEffect(() => {
    setTheme(readStudioTheme());
    applyStudioTheme(readStudioTheme());
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [close, open]);

  async function handleLogout() {
    try {
      await apiMutate("/api/auth/logout", { method: "POST" });
    } catch {
      // still leave studio
    }
    window.location.href = withLocale(locale, "/");
  }

  function handleThemeChange(next: StudioTheme) {
    setTheme(next);
    writeStudioTheme(next);
  }

  function handleLocaleChange(next: AppLocale) {
    void setLocale(next);
  }

  const initials = user ? userInitials(user) : null;
  const displayName = user ? userDisplayName(user) : A.label;

  return (
    <aside className="studio-account-dock" aria-label={A.label}>
      <div ref={rootRef} className="studio-account-menu">
        <button
          type="button"
          className={`studio-account-menu__trigger${open ? " is-open" : ""}`}
          aria-label={A.label}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {initials ? (
            <span className="studio-account-menu__avatar" aria-hidden>
              {initials}
            </span>
          ) : (
            <CircleUserRound className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.1} aria-hidden />
          )}
        </button>

        {open ? (
          <div id={menuId} className="studio-account-menu__panel" role="menu">
            <div className="studio-account-menu__panel-head">
              <span className="studio-account-menu__panel-kicker">{A.label}</span>
              <span className="studio-account-menu__panel-name">{displayName}</span>
            </div>

            <div className="studio-account-menu__panel-body">
              <button
                type="button"
                className="studio-account-menu__item"
                role="menuitem"
                onClick={() => void handleLogout()}
              >
                <LogOut className="studio-account-menu__item-icon" strokeWidth={2} aria-hidden />
                <span>{A.logout}</span>
              </button>

              <a
                className="studio-account-menu__item"
                role="menuitem"
                href={`mailto:${A.supportEmail}`}
                onClick={close}
              >
                <LifeBuoy className="studio-account-menu__item-icon" strokeWidth={2} aria-hidden />
                <span>{A.support}</span>
              </a>

              <button
                type="button"
                className={`studio-account-menu__item studio-account-menu__item--settings${settingsOpen ? " is-open" : ""}`}
                role="menuitem"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((value) => !value)}
              >
                <Settings2 className="studio-account-menu__item-icon" strokeWidth={2} aria-hidden />
                <span>{A.settings}</span>
                <ChevronDown className="studio-account-menu__chevron" strokeWidth={2.25} aria-hidden />
              </button>

              {settingsOpen ? (
                <div className="studio-account-menu__settings">
                  <label className="studio-account-menu__field">
                    <span className="studio-account-menu__field-label">{studio.user.theme.label}</span>
                    <select
                      className="studio-account-menu__select"
                      value={theme}
                      onChange={(event) => handleThemeChange(event.target.value as StudioTheme)}
                    >
                      <option value="light">{studio.user.theme.luxury}</option>
                      <option value="dark">{studio.user.theme.dark}</option>
                    </select>
                  </label>

                  <label className="studio-account-menu__field">
                    <span className="studio-account-menu__field-label">{studio.locale.label}</span>
                    <select
                      className="studio-account-menu__select"
                      value={locale}
                      onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
                    >
                      <option value="en">{studio.locale.en}</option>
                      <option value="ru">{studio.locale.ru}</option>
                      <option value="he">{studio.locale.he}</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
