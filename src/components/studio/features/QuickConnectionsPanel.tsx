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
import { permissionLabel, type PlatformId as PermissionPlatformId } from "./PlatformPermissionsModal";

type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "linkedin"
  | "telegram"
  | "notion"
  | "googleDrive"
  | "dropbox"
  | "email"
  | "discord";

type ConnectedAccount = {
  displayName: string;
  connectedAt: number;
  lastSyncAt: number | null;
};

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

function formatRelative(ms: number): string {
  const d = Math.max(0, Date.now() - ms);
  const min = Math.round(d / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

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
  const hasNotice = Boolean(scopeNotice && (scopeNotice.missingIds.length || scopeNotice.extraIds.length));
  const [tab, setTab] = useState<TabId>(hasNotice ? "settings" : "details");
  const connected = active.state.connected;

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
                <p className="text-sm font-semibold leading-snug text-[var(--fg)]">{P.youtubeScopeMismatch}</p>
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
                  {formatTemplate(P.youtubeScopeMissing, {
                    list: scopeNotice.missingIds.map((id) => permissionLabel(active.meta.id as PermissionPlatformId, id)).join(", "),
                  })}
                </p>
              ) : null}
              {scopeNotice.extraIds.length ? (
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                  {formatTemplate(P.youtubeScopeExtra, {
                    list: scopeNotice.extraIds.map((id) => permissionLabel(active.meta.id as PermissionPlatformId, id)).join(", "),
                  })}
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
                ).map((perm) => (
                  <div key={perm} className="flex items-center justify-between gap-3">
                    <span className="truncate">{permissionLabel(active.meta.id as PermissionPlatformId, perm)}</span>
                    <span className="rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                      {connected ? P.live : P.available}
                    </span>
                  </div>
                ))}
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
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Time</th>
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Event</th>
                  <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Info</th>
                </tr>
              </thead>
              <tbody className={studioWrapperList.tbody}>
                <tr className={studioWrapperList.tr}>
                  <td
                    data-label="Time"
                    className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}
                  >
                    {active.state.account?.lastSyncAt ? formatRelative(active.state.account.lastSyncAt) : "—"}
                  </td>
                  <td data-label="Event" className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>
                    Sync
                  </td>
                  <td data-label="Info" className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>
                    {P.lastSync}
                  </td>
                </tr>
                <tr className={studioWrapperList.tr}>
                  <td
                    data-label="Time"
                    className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}
                  >
                    {active.state.account?.connectedAt ? formatRelative(active.state.account.connectedAt) : "—"}
                  </td>
                  <td data-label="Event" className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>
                    {connected ? "Connect" : P.disconnect}
                  </td>
                  <td data-label="Info" className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>
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
