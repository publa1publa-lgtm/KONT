"use client";

import { useEffect, useMemo } from "react";
import { Link2, Search, X } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { StudioModalPortal } from "@/components/studio/StudioModalPortal";
import {
  PlatformIcon,
  type ConnectedAccount,
  type PlatformGroupId,
  type PlatformId,
} from "./platformShared";
import { StudioGhostButton } from "./StudioCreateButton";
import { QuickConnectionsPanel, type QuickConnectionsActive, type ScopeNotice } from "./QuickConnectionsPanel";
import { platformBrandAccent, platformGroupAccent, platformIconTileStyle } from "./platformCardStyles";

export type PlatformsMobileRow = {
  id: PlatformId;
  group: PlatformGroupId;
  label: string;
  subtitle: string;
  hint: string;
  comingSoon?: boolean;
  connected: boolean;
  account: ConnectedAccount | null;
  grantedPermissionIds: string[];
};

type PlatformsMobileDeckProps = {
  items: PlatformsMobileRow[];
  connectedItems: PlatformsMobileRow[];
  connectedCount: number;
  availableCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  connectedOnly: boolean;
  onConnectedOnlyChange: (value: boolean) => void;
  groupFilter: PlatformGroupId | "all";
  onGroupFilterChange: (value: PlatformGroupId | "all") => void;
  groupLabels: Record<PlatformGroupId, string>;
  groupOrder: PlatformGroupId[];
  active: QuickConnectionsActive | null;
  manageOpen: boolean;
  onOpenManage: (id: PlatformId) => void;
  onCloseManage: () => void;
  onConnect: (id: PlatformId) => void;
  onDisconnect: (id: PlatformId) => void;
  onSyncNow: (id: PlatformId) => void;
  scopeNotice: ScopeNotice | null;
  onDismissScopeNotice: () => void;
  onResetDemo: () => void;
};

function rowAccountName(row: PlatformsMobileRow) {
  return row.account?.displayName ?? row.subtitle;
}

export function PlatformsMobileDeck({
  items,
  connectedItems,
  connectedCount,
  availableCount,
  query,
  onQueryChange,
  connectedOnly,
  onConnectedOnlyChange,
  groupFilter,
  onGroupFilterChange,
  groupLabels,
  groupOrder,
  active,
  manageOpen,
  onOpenManage,
  onCloseManage,
  onConnect,
  onDisconnect,
  onSyncNow,
  scopeNotice,
  onDismissScopeNotice,
  onResetDemo,
}: PlatformsMobileDeckProps) {
  const { messages } = useI18n();
  const P = messages.studio.platforms;
  const title = messages.studio.items.platforms.label;

  const grouped = useMemo(
    () =>
      groupOrder
        .map((group) => ({
          id: group,
          label: groupLabels[group],
          items: items.filter((row) => row.group === group),
        }))
        .filter((section) => section.items.length > 0),
    [groupLabels, groupOrder, items],
  );

  useEffect(() => {
    if (!manageOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseManage();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [manageOpen, onCloseManage]);

  function onRow(row: PlatformsMobileRow) {
    if (row.comingSoon) return;
    if (row.connected) onOpenManage(row.id);
    else onConnect(row.id);
  }

  return (
    <div className="studio-plat-deck">
      <header className="studio-plat-deck__head">
        <div className="studio-plat-deck__head-copy">
          <p className="studio-plat-deck__eyebrow">{title}</p>
          <h1 className="studio-plat-deck__title">{P.connectedLabel}</h1>
          <p className="studio-plat-deck__hint">
            {connectedCount === 0 ? P.connectedHintNone : P.connectedHintSome}
          </p>
        </div>
        <div className="studio-plat-deck__count" aria-label={P.connectedCount}>
          <span className="studio-plat-deck__count-label">{P.connectedCount}</span>
          <span className="studio-plat-deck__count-value">
            <em>{connectedCount}</em>
            <span>/ {availableCount}</span>
          </span>
        </div>
      </header>

      <label className="studio-plat-deck__search">
        <span className="sr-only">{P.searchPlaceholder}</span>
        <Search className="studio-plat-deck__search-icon" aria-hidden />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={P.searchPlaceholder}
          className="studio-plat-deck__search-input"
        />
      </label>

      <div className="studio-plat-deck__tags" role="tablist" aria-label={P.catalogSubtitle}>
        {(
          [
            ["all", P.allGroups, "var(--ice)"] as const,
            ...groupOrder.map((g) => [g, groupLabels[g], platformGroupAccent(g)] as const),
          ]
        ).map(([id, label, color]) => {
          const selected = groupFilter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onGroupFilterChange(id)}
              className={["studio-plat-deck__tag", selected ? "is-active" : ""].filter(Boolean).join(" ")}
              style={{ ["--platform-group" as string]: color }}
            >
              <span className="studio-plat-deck__tag-dot" aria-hidden />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={connectedOnly}
          onClick={() => onConnectedOnlyChange(!connectedOnly)}
          className={[
            "studio-plat-deck__tag studio-plat-deck__tag--filter",
            connectedOnly ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ ["--platform-group" as string]: "var(--ice)" }}
        >
          <span className="studio-plat-deck__tag-dot" aria-hidden />
          {P.connectedOnly}
        </button>
      </div>

      {connectedItems.length > 0 ? (
        <div className="studio-plat-deck__accounts" aria-label={P.connectedLabel}>
          {connectedItems.map((row) => {
            const accent = platformBrandAccent(row.id);
            const selected = manageOpen && active?.meta.id === row.id;
            return (
              <button
                key={row.id}
                type="button"
                className={["studio-plat-deck__account", selected ? "is-selected" : ""].filter(Boolean).join(" ")}
                style={{ ["--platform-accent" as string]: accent }}
                onClick={() => onOpenManage(row.id)}
              >
                <span className="studio-plat-deck__account-icon" style={platformIconTileStyle(accent)}>
                  <PlatformIcon id={row.id} />
                </span>
                <span className="studio-plat-deck__account-copy">
                  <span className="studio-plat-deck__account-name">{row.label}</span>
                  <span className="studio-plat-deck__account-meta">{rowAccountName(row)}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="studio-plat-deck__empty-connect">
          <span className="studio-plat-deck__empty-icon" style={platformIconTileStyle("var(--ice)")}>
            <Link2 className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="studio-plat-deck__empty-title">{P.emptyConnectedTitle}</p>
            <p className="studio-plat-deck__empty-body">{P.emptyConnectedBody}</p>
          </div>
        </div>
      )}

      <div className="studio-plat-deck__list">
        {grouped.length === 0 ? (
          <div className="studio-plat-deck__empty">{P.noMatch}</div>
        ) : (
          grouped.map((section) => (
            <section key={section.id} className="studio-plat-deck__section">
              <h2 className="studio-plat-deck__section-title">{section.label}</h2>
              <ul className="studio-plat-deck__rows">
                {section.items.map((row) => {
                  const accent = platformBrandAccent(row.id);
                  const disabled = Boolean(row.comingSoon);
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onRow(row)}
                        aria-label={row.label}
                        className={[
                          "studio-plat-deck__row",
                          row.connected ? "is-connected" : "",
                          disabled ? "is-soon" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{ ["--platform-accent" as string]: accent }}
                      >
                        <span className="studio-plat-deck__row-icon" style={platformIconTileStyle(accent)}>
                          <PlatformIcon id={row.id} />
                        </span>
                        <span className="studio-plat-deck__row-name">{row.label}</span>
                        <span className="studio-plat-deck__row-action">
                          {disabled ? (
                            <span className="studio-plat-deck__soon">Coming soon</span>
                          ) : row.connected ? (
                            <span className="studio-plat-deck__online">{P.onlineLabel}</span>
                          ) : (
                            <span className="studio-plat-deck__cta">{P.connect}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <button type="button" className="studio-plat-deck__reset" onClick={onResetDemo}>
          {P.resetDemo}
        </button>
      </div>

      {manageOpen && active ? (
        <StudioModalPortal>
          <div className="studio-plat-sheet" role="dialog" aria-modal="true" aria-label={active.meta.label}>
            <button
              type="button"
              className="studio-plat-sheet__backdrop"
              aria-label={messages.common.close}
              onClick={onCloseManage}
            />
            <div className="studio-plat-sheet__panel">
              <div className="studio-plat-sheet__handle" aria-hidden />
              <header className="studio-plat-sheet__head">
                <span className="studio-plat-sheet__icon" style={platformIconTileStyle(active.meta.accent)}>
                  <PlatformIcon id={active.meta.id} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="studio-plat-sheet__kicker">{P.manage}</p>
                  <h2 className="studio-plat-sheet__title">{active.meta.label}</h2>
                  <p className="studio-plat-sheet__sub">
                    {active.state.connected
                      ? (active.state.account?.displayName ?? active.meta.subtitle)
                      : active.meta.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  className="studio-plat-sheet__close"
                  aria-label={messages.common.close}
                  onClick={onCloseManage}
                >
                  <X className="size-4" strokeWidth={2.25} aria-hidden />
                </button>
              </header>
              <div className="studio-plat-sheet__body">
                <QuickConnectionsPanel
                  active={active}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onSyncNow={onSyncNow}
                  scopeNotice={
                    active.meta.id === "youtube" ||
                    active.meta.id === "googleDrive" ||
                    active.meta.id === "facebook" ||
                    active.meta.id === "instagram"
                      ? scopeNotice
                      : null
                  }
                  onDismissScopeNotice={onDismissScopeNotice}
                />
              </div>
              <div className="studio-plat-sheet__foot">
                <StudioGhostButton type="button" className="w-full" onClick={onCloseManage}>
                  {messages.common.close}
                </StudioGhostButton>
              </div>
            </div>
          </div>
        </StudioModalPortal>
      ) : null}
    </div>
  );
}
