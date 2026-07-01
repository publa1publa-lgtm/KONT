"use client";

import { useMemo, useState } from "react";
import { TabPanel, Tabs, type TabSpec } from "./Tabs";
import {
  DiscordLogo,
  DropboxLogo,
  EmailLogo,
  FacebookLogo,
  GoogleDriveLogo,
  InstagramLogo,
  NotionLogo,
  TelegramLogo,
  TikTokLogo,
  YouTubeLogo,
  PinterestLogo,
  LinkedInLogo,
} from "./platformLogos";
import { ConnectionToggle } from "./ConnectionToggle";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { PLATFORM_CARD_ACCENT, PLATFORM_CARD_SURFACE_CLASS, PLATFORM_CARD_ACCENT_OVERLAY_OPACITY, PLATFORM_PANEL_SURFACE_CLASS, platformAccentOverlay, platformIconTileStyle } from "./platformCardStyles";
import { StudioWrapperList, studioWrapperList } from "./StudioWrapperList";

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

function PlatformIcon({ id, className }: { id: PlatformId; className?: string }) {
  switch (id) {
    case "youtube":
      return <YouTubeLogo className={className} />;
    case "tiktok":
      return <TikTokLogo className={className} />;
    case "instagram":
      return <InstagramLogo className={className} />;
    case "facebook":
      return <FacebookLogo className={className} />;
    case "pinterest":
      return <PinterestLogo className={className} />;
    case "linkedin":
      return <LinkedInLogo className={className} />;
    case "telegram":
      return <TelegramLogo className={className} />;
    case "notion":
      return <NotionLogo className={className} />;
    case "googleDrive":
      return <GoogleDriveLogo className={className} />;
    case "dropbox":
      return <DropboxLogo className={className} />;
    case "email":
      return <EmailLogo className={className} />;
    case "discord":
      return <DiscordLogo className={className} />;
  }
}

type TabId = "details" | "settings" | "logs";

export function QuickConnectionsPanel({
  open,
  active,
  onClose,
  onConnect,
  onDisconnect,
  onSyncNow,
}: {
  open: boolean;
  active: QuickConnectionsActive | null;
  onClose: () => void;
  onConnect: (id: PlatformId) => void;
  onDisconnect: (id: PlatformId) => void;
  onSyncNow: (id: PlatformId) => void;
}) {
  const [tab, setTab] = useState<TabId>("details");

  const tabs = useMemo<Array<TabSpec<TabId>>>(
    () => [
      { id: "details", label: "Details", hint: "status + account" },
      { id: "settings", label: "Settings", hint: "permissions" },
      { id: "logs", label: "Logs", hint: "sync history" },
    ],
    [],
  );

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border",
        PLATFORM_PANEL_SURFACE_CLASS,
        "transition-[max-height,opacity,transform] duration-300 ease-out",
        open ? "max-h-[1100px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1",
      ].join(" ")}
      aria-hidden={!open}
    >
      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Quick panel</div>
            <div className="mt-2 text-base font-semibold text-[var(--fg)]">
              {active ? active.meta.label : "Select a platform"}
            </div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {active ? active.meta.subtitle : "Pick a connected platform above to view details."}
            </div>
          </div>

          <StudioGhostButton
            type="button"
            className="studio-btn-ghost--sm"
            onClick={() => {
              onClose();
              setTab("details");
            }}
          >
            Close
          </StudioGhostButton>
        </div>

        <div className="mt-4">
          <Tabs tabs={tabs} activeId={tab} onChange={setTab} />
        </div>

        {!active ? (
          <div className={`mt-4 rounded-2xl border p-4 text-sm text-[var(--muted)] ${PLATFORM_PANEL_SURFACE_CLASS}`}>
            Nothing selected.
          </div>
        ) : (
          <div className="mt-4">
            <TabPanel hidden={tab !== "details"}>
              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={`relative overflow-hidden rounded-[1.25rem] border p-4 shadow-[var(--studio-card-stack-shadow)] ${PLATFORM_CARD_SURFACE_CLASS}`}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ ...platformAccentOverlay(PLATFORM_CARD_ACCENT), opacity: PLATFORM_CARD_ACCENT_OVERLAY_OPACITY }}
                    aria-hidden
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ice)]/13 to-transparent" aria-hidden />
                  <div className="relative z-[1]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                          style={platformIconTileStyle(PLATFORM_CARD_ACCENT)}
                        >
                          <PlatformIcon id={active.meta.id} className="h-[1.35rem] w-[1.35rem] text-[var(--fg)]/92" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-snug tracking-tight text-[var(--fg)]">{active.meta.label}</div>
                          <div className="mt-0.5 text-xs leading-snug text-[var(--muted)]">
                            {active.state.connected && active.state.account
                              ? active.state.account.displayName
                              : active.meta.subtitle}
                          </div>
                        </div>
                      </div>

                      <ConnectionToggle connected={active.state.connected} />
                    </div>

                    <div className="mt-4">
                      {active.state.connected && active.state.account ? (
                        <p className="text-[13px] leading-snug">
                          <span className="font-semibold text-[var(--fg)]/92">{active.state.account.displayName}</span>
                        </p>
                      ) : (
                        <p className="text-[13px] leading-relaxed text-[var(--muted)]">{active.meta.subtitle}</p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {active.state.connected ? (
                        <>
                          <StudioGhostButton type="button" className="studio-btn-ghost--md" onClick={() => onSyncNow(active.meta.id)}>
                            Sync now
                          </StudioGhostButton>
                          <StudioGhostButton type="button" className="studio-btn-ghost--md" onClick={() => onDisconnect(active.meta.id)}>
                            Disconnect
                          </StudioGhostButton>
                        </>
                      ) : (
                        <StudioCreateButton type="button" className="studio-create-btn--sm" onClick={() => onConnect(active.meta.id)}>
                          Connect (demo)
                        </StudioCreateButton>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Notes</div>
                  <div className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    This is currently a UI mock. When wired to API, you’ll see token health, scopes, and actual sync status here.
                  </div>
                  <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3 text-xs text-[var(--muted)]">
                    Next step: OAuth redirect → callback → store refresh tokens → background sync.
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel hidden={tab !== "settings"}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Publishing</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--fg)]">Auto-sync metadata</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        When enabled, studio will refresh connection status periodically.
                      </div>
                    </div>
                    <div className="rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                      Soon
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Permissions</div>
                  <div className="mt-2 grid gap-2 text-sm text-[var(--muted)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">Upload content</span>
                      <span className="rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">Read analytics</span>
                      <span className="rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">Manage schedules</span>
                      <span className="rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-1 text-xs font-semibold text-[var(--fg)]/70">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>

            <TabPanel hidden={tab !== "logs"}>
              <div className={`rounded-2xl border p-4 ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Logs</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--fg)]">Recent actions</div>
                  </div>
                  <div className="text-xs text-[var(--muted)]">UI-only demo</div>
                </div>

                <StudioWrapperList className="mt-4">
                  <table className={studioWrapperList.table}>
                    <thead className={studioWrapperList.thead}>
                      <tr>
                        <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Time</th>
                        <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Event</th>
                        <th className={`${studioWrapperList.th} px-4 py-3 text-start`}>Info</th>
                      </tr>
                    </thead>
                    <tbody className={studioWrapperList.tbody}>
                      <tr className={studioWrapperList.tr}>
                        <td className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}>
                          {active.state.account?.lastSyncAt ? formatRelative(active.state.account.lastSyncAt) : "—"}
                        </td>
                        <td className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>Sync</td>
                        <td className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>Last sync timestamp</td>
                      </tr>
                      <tr className={studioWrapperList.tr}>
                        <td className={`${studioWrapperList.td} px-4 py-3 font-mono text-xs text-[var(--st-muted)]`}>
                          {active.state.account?.connectedAt ? formatRelative(active.state.account.connectedAt) : "—"}
                        </td>
                        <td className={`${studioWrapperList.td} px-4 py-3 font-medium text-[var(--st-ink)]`}>Connect</td>
                        <td className={`${studioWrapperList.td} px-4 py-3 text-xs text-[var(--st-muted)]`}>Connected demo account</td>
                      </tr>
                    </tbody>
                  </table>
                </StudioWrapperList>
              </div>
            </TabPanel>
          </div>
        )}
      </div>
    </div>
  );
}

