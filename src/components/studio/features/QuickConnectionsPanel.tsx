"use client";

import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { formatTemplate } from "@/lib/formatTemplate";
import { TabPanel, Tabs, type TabSpec } from "./Tabs";
import { ConnectionToggle } from "./ConnectionToggle";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { PLATFORM_PANEL_SURFACE_CLASS } from "./platformCardStyles";
import { StudioWrapperList, studioWrapperList } from "./StudioWrapperList";
import {
  PLATFORM_PERMISSIONS,
  permissionCategoryOf,
  permissionLabel,
} from "./PlatformPermissionsModal";
import { formatRelative, type PlatformId, type ConnectedAccount } from "./platformShared";

export type QuickConnectionsActive = {
  meta: {
    id: PlatformId;
    label: string;
    subtitle: string;
    hint: string;
    accent: string;
  };
  state: {
    id: PlatformId;
    connected: boolean;
    account: ConnectedAccount | null;
    grantedPermissionIds?: string[];
  };
};

type TabId = "details" | "settings" | "logs";

export type ScopeNotice = {
  missingIds: string[];
  extraIds: string[];
};

/** Inline manage body — lives inside the same account row, not a second card. */
export function QuickConnectionsPanel({
  active,
  onConnect,
  onDisconnect,
  onSyncNow,
  scopeNotice,
  onDismissScopeNotice,
}: {
  active: QuickConnectionsActive;
  onConnect: (id: PlatformId) => void;
  onDisconnect: (id: PlatformId) => void;
  onSyncNow: (id: PlatformId) => void;
  scopeNotice?: ScopeNotice | null;
  onDismissScopeNotice?: () => void;
}) {
  const { messages } = useI18n();
  const P = messages.studio.platforms;
  const C = messages.common;
  const PC = messages.studio.platformConnect;
  const hasNotice = Boolean(scopeNotice && (scopeNotice.missingIds.length || scopeNotice.extraIds.length));
  const [tab, setTab] = useState<TabId>(hasNotice ? "settings" : "details");
  const connected = active.state.connected;

  function labelForPermission(permissionId: string): string {
    const category = permissionCategoryOf(active.meta.id, permissionId);
    if (category) return PC.categories[category] ?? permissionLabel(active.meta.id, permissionId);
    return permissionLabel(active.meta.id, permissionId);
  }

  function scopesForPermission(permissionId: string): readonly string[] {
    return PLATFORM_PERMISSIONS[active.meta.id].find((p) => p.id === permissionId)?.scopes ?? [];
  }

  const tabs = useMemo<Array<TabSpec<TabId>>>(
    () => [
      { id: "details", label: P.manageDetails, hint: "status + account" },
      { id: "settings", label: P.manageSettings, hint: "permissions" },
      { id: "logs", label: P.manageLogs, hint: "sync history" },
    ],
    [P.manageDetails, P.manageLogs, P.manageSettings],
  );

  return (
    <div className="platform-account-manage">
      {hasNotice && scopeNotice ? (
        <div
          className="mb-4 rounded-xl border border-amber-400/55 bg-amber-400/16 p-3.5"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-amber-400/20 text-amber-600">
              <CircleAlert className="size-4" strokeWidth={2.4} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-snug text-[var(--fg)]">
                  {active.meta.id === "youtube" || active.meta.id === "googleDrive" ? P.youtubeScopeMismatch : P.scopeMismatch}
                </p>
                {onDismissScopeNotice ? (
                  <button
                    type="button"
                    onClick={onDismissScopeNotice}
                    className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[var(--muted)] transition-colors hover:bg-amber-400/20 hover:text-[var(--fg)]"
                  >
                    {C.close}
                  </button>
                ) : null}
              </div>
              {scopeNotice.missingIds.length ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                  {formatTemplate(
                    active.meta.id === "youtube" || active.meta.id === "googleDrive" ? P.youtubeScopeMissing : P.scopeMissing,
                    { list: scopeNotice.missingIds.map((id) => labelForPermission(id)).join(", ") },
                  )}
                </p>
              ) : null}
              {scopeNotice.extraIds.length ? (
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                  {formatTemplate(
                    active.meta.id === "youtube" || active.meta.id === "googleDrive" ? P.youtubeScopeExtra : P.scopeExtra,
                    { list: scopeNotice.extraIds.map((id) => labelForPermission(id)).join(", ") },
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Tabs tabs={tabs} activeId={tab} onChange={setTab} />

      <div className="mt-4">
        <TabPanel hidden={tab !== "details"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-xl border p-3.5 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {P.account}
                  </div>
                  <div className="mt-1.5 truncate text-sm font-semibold text-[var(--fg)]">
                    {connected && active.state.account ? active.state.account.displayName : active.meta.subtitle}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{active.meta.hint}</div>
                </div>
                <ConnectionToggle connected={connected} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {connected ? (
                  <StudioGhostButton
                    type="button"
                    className="studio-btn-ghost--md"
                    onClick={() => onSyncNow(active.meta.id)}
                  >
                    {P.sync}
                  </StudioGhostButton>
                ) : (
                  <StudioCreateButton
                    type="button"
                    className="studio-create-btn--sm"
                    onClick={() => onConnect(active.meta.id)}
                  >
                    {P.connect}
                  </StudioCreateButton>
                )}
              </div>
            </div>

            <div className={`rounded-xl border p-3.5 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {P.lastSync}
              </div>
              <div className="mt-1.5 text-sm font-semibold text-[var(--fg)]">
                {active.state.account?.lastSyncAt
                  ? formatRelative(active.state.account.lastSyncAt)
                  : P.noSync}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{P.connectedHintSome}</p>
            </div>
          </div>
        </TabPanel>

        <TabPanel hidden={tab !== "settings"}>
          <div className="grid gap-3">
            <div className={`rounded-xl border p-3.5 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {messages.studio.platformConnect.permissions}
              </div>
              <div className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                {(active.state.grantedPermissionIds?.length
                  ? active.state.grantedPermissionIds
                  : ["account.identity"]
                ).map((perm) => {
                  const scopes = scopesForPermission(perm);
                  return (
                    <div key={perm} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[var(--fg)]">{labelForPermission(perm)}</div>
                        {scopes.length > 0 ? (
                          <div className="mt-1 grid gap-1">
                            {scopes.map((scope) => (
                              <code
                                key={scope}
                                className="block truncate text-[0.68rem] text-[var(--muted)]"
                              >
                                {scope}
                              </code>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                        {connected ? P.live : P.available}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {connected ? (
              <div className="rounded-xl border border-[color-mix(in_srgb,var(--ember)_28%,var(--line))] bg-[color-mix(in_srgb,var(--ember)_7%,transparent)] p-3.5">
                <div className="text-sm font-semibold text-[var(--fg)]">{P.revokeTitle}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{P.revokeHint}</p>
                <StudioGhostButton
                  type="button"
                  className="studio-btn-ghost--md mt-3"
                  onClick={() => onDisconnect(active.meta.id)}
                >
                  {P.disconnect}
                </StudioGhostButton>
              </div>
            ) : (
              <div className={`rounded-xl border p-3.5 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                <div className="text-sm font-semibold text-[var(--fg)]">{P.revokeTitle}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{P.emptyConnectedBody}</p>
                <StudioCreateButton
                  type="button"
                  className="studio-create-btn--sm mt-3"
                  onClick={() => onConnect(active.meta.id)}
                >
                  {P.connect}
                </StudioCreateButton>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel hidden={tab !== "logs"}>
          <StudioWrapperList>
            <table className={`${studioWrapperList.table} studio-stack-table`}>
              <thead className={studioWrapperList.thead}>
                <tr>
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>{P.logTime}</th>
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>{P.logEvent}</th>
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>{P.logInfo}</th>
                </tr>
              </thead>
              <tbody className={studioWrapperList.tbody}>
                <tr className={studioWrapperList.tr}>
                  <td
                    data-label={P.logTime}
                    className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}
                  >
                    {active.state.account?.lastSyncAt ? formatRelative(active.state.account.lastSyncAt) : "—"}
                  </td>
                  <td data-label={P.logEvent} className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>
                    {P.sync}
                  </td>
                  <td data-label={P.logInfo} className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>
                    {P.lastSync}
                  </td>
                </tr>
                <tr className={studioWrapperList.tr}>
                  <td
                    data-label={P.logTime}
                    className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}
                  >
                    {active.state.account?.connectedAt ? formatRelative(active.state.account.connectedAt) : "—"}
                  </td>
                  <td data-label={P.logEvent} className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>
                    {connected ? P.logConnect : P.disconnect}
                  </td>
                  <td data-label={P.logInfo} className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>
                    {active.meta.label}
                  </td>
                </tr>
              </tbody>
            </table>
          </StudioWrapperList>
        </TabPanel>
      </div>
    </div>
  );
}
