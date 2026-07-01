"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import {
  STUDIO_PLATFORMS_STORAGE_KEY,
  readStudioPlatformStates,
  syncReelPlatformConnectionToServer,
} from "@/lib/studioPlatformsStorage";
import { isReelPlatformId } from "@/lib/reelPlatformIds";
import { INBOX_UNIFIED_PERMISSION_ID } from "@/lib/studioInboxPermissions";
import { ChevronDown } from "lucide-react";
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
import { QuickConnectionsPanel } from "./QuickConnectionsPanel";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { StudioHeader } from "./StudioHeader";
import { ConnectionToggle } from "./ConnectionToggle";
import { PlatformPermissionsModal } from "./PlatformPermissionsModal";
import { PLATFORM_CARD_ACCENT, PLATFORM_CARD_SURFACE_CLASS, PLATFORM_CARD_ACCENT_OVERLAY_OPACITY, PLATFORM_CHIP_ACCENT_OVERLAY_OPACITY, PLATFORM_PANEL_SURFACE_CLASS, platformAccentOverlay, platformIconTileStyle } from "./platformCardStyles";

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

type PlatformGroupId = "social" | "messengers" | "storage" | "productivity" | "notifications";

type ConnectedAccount = {
  displayName: string;
  connectedAt: number;
  lastSyncAt: number | null;
};

type PlatformState = {
  id: PlatformId;
  connected: boolean;
  account: ConnectedAccount | null;
  /** Permissions granted on last connect (demo / pre-OAuth). */
  grantedPermissionIds: string[];
};

const PLATFORM_META: Array<{
  id: PlatformId;
  group: PlatformGroupId;
  label: string;
  subtitle: string;
  hint: string;
  accent: string;
}> = [
  {
    id: "youtube",
    group: "social",
    label: "YouTube",
    subtitle: "Upload & schedule videos",
    hint: "OAuth (Google) — scopes, channel access",
    accent: "var(--ice)",
  },
  {
    id: "tiktok",
    group: "social",
    label: "TikTok",
    subtitle: "Short-form distribution",
    hint: "OAuth — account + posting permissions",
    accent: "var(--ice)",
  },
  {
    id: "instagram",
    group: "social",
    label: "Instagram",
    subtitle: "Reels & cross-post",
    hint: "Meta — IG account + page linkage",
    accent: "var(--ice)",
  },
  {
    id: "facebook",
    group: "social",
    label: "Facebook",
    subtitle: "Pages & video publishing",
    hint: "Meta — pages_manage_posts, publish_video",
    accent: "var(--ice)",
  },
  {
    id: "pinterest",
    group: "social",
    label: "Pinterest",
    subtitle: "Pins & boards",
    hint: "OAuth — create pins, read boards",
    accent: "var(--ice)",
  },
  {
    id: "linkedin",
    group: "social",
    label: "LinkedIn",
    subtitle: "Posts & articles",
    hint: "OAuth — organization & member publishing",
    accent: "var(--ice)",
  },
  {
    id: "telegram",
    group: "messengers",
    label: "Telegram",
    subtitle: "Bots & notifications",
    hint: "Bot API — token-based, no heavy review",
    accent: "var(--ice)",
  },
  {
    id: "discord",
    group: "notifications",
    label: "Discord",
    subtitle: "Team notifications",
    hint: "Webhook — paste URL, send messages",
    accent: "var(--ice)",
  },
  {
    id: "email",
    group: "notifications",
    label: "Email",
    subtitle: "Universal alerts",
    hint: "SMTP / provider API key",
    accent: "var(--ice)",
  },
  {
    id: "notion",
    group: "productivity",
    label: "Notion",
    subtitle: "Content planning database",
    hint: "Integration token + shared pages/databases",
    accent: "var(--ice)",
  },
  {
    id: "googleDrive",
    group: "storage",
    label: "Google Drive",
    subtitle: "Import/export assets",
    hint: "OAuth — Drive scopes",
    accent: "var(--ice)",
  },
  {
    id: "dropbox",
    group: "storage",
    label: "Dropbox",
    subtitle: "Import/export assets",
    hint: "OAuth — Dropbox scopes",
    accent: "var(--ice)",
  },
];

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

function defaultState(): PlatformState[] {
  return PLATFORM_META.map((p) => ({ id: p.id, connected: false, account: null, grantedPermissionIds: [] }));
}

function safeParse(raw: string | null): PlatformState[] {
  if (!raw) return defaultState();
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return defaultState();

    const byId = new Map<PlatformId, PlatformState>();
    for (const p of PLATFORM_META) byId.set(p.id, { id: p.id, connected: false, account: null, grantedPermissionIds: [] });

    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Partial<PlatformState>;
      const id = obj.id;
      if (!id) continue;
      if (!PLATFORM_META.some((p) => p.id === id)) continue;
      const connected = Boolean(obj.connected);
      const accountRaw = obj.account as unknown;
      const account =
        accountRaw &&
        typeof accountRaw === "object" &&
        typeof (accountRaw as any).displayName === "string" &&
        typeof (accountRaw as any).connectedAt === "number" &&
        (typeof (accountRaw as any).lastSyncAt === "number" || (accountRaw as any).lastSyncAt === null)
          ? ({
              displayName: (accountRaw as any).displayName,
              connectedAt: (accountRaw as any).connectedAt,
              lastSyncAt: (accountRaw as any).lastSyncAt,
            } satisfies ConnectedAccount)
          : null;

      const rawPerms = (obj as { grantedPermissionIds?: unknown }).grantedPermissionIds;
      const grantedPermissionIds = Array.isArray(rawPerms)
        ? rawPerms.filter((x): x is string => typeof x === "string")
        : connected
          ? [INBOX_UNIFIED_PERMISSION_ID]
          : [];

      byId.set(id, { id, connected, account: connected ? account : null, grantedPermissionIds });
    }

    return PLATFORM_META.map((p) => byId.get(p.id) ?? { id: p.id, connected: false, account: null, grantedPermissionIds: [] });
  } catch {
    return defaultState();
  }
}

function readStoredPlatforms(): PlatformState[] {
  if (typeof window === "undefined") return defaultState();
  readStudioPlatformStates();
  return safeParse(localStorage.getItem(STUDIO_PLATFORMS_STORAGE_KEY));
}

export function PlatformsView() {
  const { messages } = useI18n();
  const P = messages.studio.platforms;

  const [platforms, setPlatforms] = useState<PlatformState[]>(defaultState);
  const storageReadyRef = useRef(false);
  const [activeId, setActiveId] = useState<PlatformId | null>(null);
  const [query, setQuery] = useState("");
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [permPlatformId, setPermPlatformId] = useState<PlatformId | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<PlatformGroupId, boolean>>({
    social: true,
    messengers: true,
    storage: true,
    productivity: true,
    notifications: true,
  });

  useEffect(() => {
    const parsed = readStoredPlatforms();
    setPlatforms(parsed);
    setActiveId((prev) => prev ?? parsed.find((p) => p.connected)?.id ?? parsed[0]?.id ?? null);
    storageReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!storageReadyRef.current) return;
    try {
      localStorage.setItem(STUDIO_PLATFORMS_STORAGE_KEY, JSON.stringify(platforms));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("cf:studio-platforms"));
  }, [platforms]);

  const connectedCount = useMemo(() => platforms.filter((p) => p.connected).length, [platforms]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged = PLATFORM_META.map((meta) => {
      const state = platforms.find((p) => p.id === meta.id) ?? { id: meta.id, connected: false, account: null };
      return { meta, state };
    });
    const filtered = merged.filter(({ meta, state }) => {
      if (connectedOnly && !state.connected) return false;
      if (!q) return true;
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.subtitle.toLowerCase().includes(q) ||
        meta.hint.toLowerCase().includes(q) ||
        (state.account?.displayName ?? "").toLowerCase().includes(q)
      );
    });
    // Keep a stable order (no UI jumping on connect/disconnect)
    return filtered;
  }, [connectedOnly, platforms, query]);

  const groups = useMemo(() => {
    const byGroup = new Map<PlatformGroupId, typeof list>();
    for (const g of ["social", "messengers", "productivity", "storage", "notifications"] as const) byGroup.set(g, []);
    for (const item of list) byGroup.get(item.meta.group)!.push(item);
    return byGroup;
  }, [list]);

  const groupMeta: Record<PlatformGroupId, { title: string; subtitle: string }> = useMemo(
    () => ({
      social: { title: "Social networks", subtitle: "Publish and manage content on social platforms" },
      messengers: { title: "Messengers", subtitle: "Fast token-based messaging integrations" },
      productivity: { title: "Productivity", subtitle: "Docs and planning tools (databases, pages)" },
      storage: { title: "Storage", subtitle: "Import/export assets to cloud storage" },
      notifications: { title: "Notifications", subtitle: "Send alerts to your team or inbox" },
    }),
    [],
  );

  const activePlatform = useMemo(() => {
    if (!activeId) return null;
    const s = platforms.find((p) => p.id === activeId) ?? null;
    const meta = PLATFORM_META.find((p) => p.id === activeId) ?? null;
    return s && meta ? { ...s, meta } : null;
  }, [activeId, platforms]);

  useEffect(() => {
    if (!activeId) return;
    const stillVisible = list.some((x) => x.meta.id === activeId);
    if (!stillVisible) setActiveId(list[0]?.meta.id ?? null);
  }, [activeId, list]);

  async function connect(platformId: PlatformId, grantedPermissionIds: string[]) {
    let displayName =
      platformId === "youtube"
        ? "YouTube Channel • Demo"
        : platformId === "tiktok"
          ? "@demo_creator"
          : platformId === "instagram"
            ? "@demo.reels"
            : platformId === "facebook"
              ? "Demo Page • ContentFabric"
              : platformId === "linkedin"
                ? "LinkedIn • Demo"
                : platformId === "telegram"
                  ? "@contentfabric_bot"
                  : platformId === "discord"
                    ? "Discord webhook • Demo"
                    : platformId === "email"
                      ? "alerts@contentfabric.demo"
                      : platformId === "notion"
                        ? "Workspace • Demo"
                        : platformId === "googleDrive"
                          ? "Drive • Demo"
                          : platformId === "pinterest"
                            ? "Pinterest"
                            : "Dropbox • Demo";

    if (platformId === "pinterest") {
      try {
        const r = await fetch("/api/platforms/pinterest/connect", { method: "POST" });
        const data = (await r.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
          account?: { handle?: string | null; username?: string | null };
        };
        if (!r.ok) {
          window.alert([data.error, data.hint].filter(Boolean).join("\n\n") || P.pinterestConnectFailed);
          return;
        }
        displayName =
          data.account?.handle?.trim() ||
          (data.account?.username ? `@${data.account.username}` : "") ||
          displayName;
      } catch {
        window.alert(P.pinterestNetworkError);
        return;
      }
    }

    const account: ConnectedAccount = {
      displayName,
      connectedAt: Date.now(),
      lastSyncAt: null,
    };
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId ? { ...p, connected: true, account, grantedPermissionIds: [...grantedPermissionIds] } : p,
      ),
    );
    setActiveId(platformId);
    if (isReelPlatformId(platformId)) {
      void syncReelPlatformConnectionToServer(platformId, true, account.displayName);
    }
  }

  function openPermissions(platformId: PlatformId) {
    setPermPlatformId(platformId);
    setPermOpen(true);
  }

  function disconnect(platformId: PlatformId) {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, connected: false, account: null, grantedPermissionIds: [] } : p)),
    );
    if (isReelPlatformId(platformId)) {
      void syncReelPlatformConnectionToServer(platformId, false, null);
    }
  }

  function syncNow(platformId: PlatformId) {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId && p.connected && p.account ? { ...p, account: { ...p.account, lastSyncAt: Date.now() } } : p,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <PlatformPermissionsModal
        open={permOpen}
        platformId={permPlatformId}
        platformLabel={permPlatformId ? (PLATFORM_META.find((x) => x.id === permPlatformId)?.label ?? permPlatformId) : ""}
        onClose={() => setPermOpen(false)}
        onConfirm={(picked) => {
          setPermOpen(false);
          if (!permPlatformId) return;
          connect(permPlatformId, picked);
        }}
      />

      <div className="cal-surface rounded-3xl p-5">
        <StudioHeader
          label={P.connectedLabel}
          subtitle={P.connectedSubtitle}
          right={
            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold text-[var(--fg)] ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                {P.connectedCount} <span className="text-[var(--ice)]">{connectedCount}</span> / {PLATFORM_META.length}
              </div>
              <div className="text-xs font-medium text-[var(--muted)]">
                {connectedCount === 0 ? P.connectedHintNone : P.connectedHintSome}
              </div>
            </div>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {platforms.filter((p) => p.connected).length === 0 ? (
            <div className={`col-span-full rounded-2xl border px-4 py-3 text-sm text-[var(--muted)] ${PLATFORM_PANEL_SURFACE_CLASS}`}>
              {P.noConnected}
            </div>
          ) : (
            platforms
              .filter((p) => p.connected)
              .map((p) => {
                const meta = PLATFORM_META.find((m) => m.id === p.id)!;
                const selected = activeId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveId(p.id);
                      setQcOpen(true);
                    }}
                    className={[
                      "group relative flex min-w-0 w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-start transition duration-300",
                      PLATFORM_CARD_SURFACE_CLASS,
                      "shadow-[var(--studio-card-stack-shadow)]",
                      selected
                        ? "border-[var(--ice)]/30 ring-1 ring-[var(--ice)]/18"
                        : "border-[var(--line)] hover:border-[var(--line)] hover:shadow-[0_20px_44px_-38px_rgba(0,0,0,0.14)]",
                    ].join(" ")}
                  >
                    <span
                      className="pointer-events-none absolute inset-0"
                      style={{ ...platformAccentOverlay(PLATFORM_CARD_ACCENT), opacity: PLATFORM_CHIP_ACCENT_OVERLAY_OPACITY }}
                      aria-hidden
                    />
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ice)]/13 to-transparent" aria-hidden />
                    <span
                      className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      style={platformIconTileStyle(PLATFORM_CARD_ACCENT)}
                    >
                      <PlatformIcon id={p.id} className="h-4 w-4 text-[var(--fg)]/90" />
                    </span>
                    <span className="relative z-[1] min-w-0">
                      <span className="block truncate text-sm font-semibold tracking-tight text-[var(--fg)]">{meta.label}</span>
                      <span className="block truncate text-xs text-[var(--muted)]">{p.account?.displayName ?? meta.subtitle}</span>
                    </span>
                    <span className="relative z-[1] ms-auto h-2 w-2 shrink-0 rounded-full bg-[var(--ice)]/80 ring-[3px] ring-[var(--ice)]/12" />
                  </button>
                );
              })
          )}
        </div>

        <div className="mt-4">
          <QuickConnectionsPanel
            open={qcOpen}
            active={
              activePlatform
                ? {
                    meta: {
                      id: activePlatform.meta.id,
                      label: activePlatform.meta.label,
                      subtitle: activePlatform.meta.subtitle,
                      hint: activePlatform.meta.hint,
                      accent: activePlatform.meta.accent,
                    },
                    state: {
                      id: activePlatform.id,
                      connected: activePlatform.connected,
                      account: activePlatform.account,
                      grantedPermissionIds: activePlatform.grantedPermissionIds,
                    },
                  }
                : null
            }
            onClose={() => setQcOpen(false)}
            onConnect={(id) => openPermissions(id)}
            onDisconnect={(id) => disconnect(id)}
            onSyncNow={(id) => syncNow(id)}
          />
        </div>
      </div>

      <div className="cal-surface rounded-3xl p-5">
        <StudioHeader
          label={P.yourPlatforms}
          title={`Integrations: ${PLATFORM_META.length}`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">{P.searchPlaceholder}</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={P.searchPlaceholder}
                  className="w-[260px] max-w-full rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-sm text-[var(--fg)] outline-none ring-[var(--ice)]/35 placeholder:text-[var(--muted)]/60 focus:ring-2"
                />
              </label>
              <button
                type="button"
                onClick={() => setConnectedOnly((v) => !v)}
                className={
                  connectedOnly
                    ? "studio-create-btn studio-create-btn--sm"
                    : "studio-btn-ghost studio-btn-ghost--sm"
                }
                aria-pressed={connectedOnly}
              >
                {P.connectedOnly}
              </button>
              <StudioGhostButton
                type="button"
                className="studio-btn-ghost--sm"
                onClick={() => {
                  setPlatforms(defaultState());
                  setActiveId("youtube");
                  setQuery("");
                  setConnectedOnly(false);
                }}
              >
                {P.resetDemo}
              </StudioGhostButton>
            </div>
          }
        />

        {list.length === 0 ? (
          <div className={`mt-5 rounded-2xl border p-4 text-sm text-[var(--muted)] ${PLATFORM_PANEL_SURFACE_CLASS}`}>
            {P.noMatch}
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {(["social", "messengers", "productivity", "storage", "notifications"] as const)
              .filter((g) => (groups.get(g)?.length ?? 0) > 0)
              .map((g) => {
                const open = openGroups[g];
                const items = groups.get(g) ?? [];
                const gm = groupMeta[g];
                return (
                  <div key={g} className={`overflow-hidden rounded-3xl border ${PLATFORM_PANEL_SURFACE_CLASS}`}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[color-mix(in_srgb,var(--wrapper-color-soft)_38%,#fff)]"
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }))}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-[var(--fg)]">{gm.title}</div>
                          <div className="rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                            {items.length}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{gm.subtitle}</div>
                      </div>
                      <div
                        className={[
                          "h-9 w-9 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)]/70",
                          "grid place-items-center transition-transform duration-200",
                          open ? "rotate-180" : "rotate-0",
                        ].join(" ")}
                        aria-hidden
                      >
                        <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                    </button>

                    {open ? (
                      <div className="border-t border-[var(--line)] px-4 py-4">
                        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
                          {items.map(({ meta, state }) => {
                            const connected = state.connected;
                            const account = state.account;
                            const selected = meta.id === activeId;
                            return (
                              <div
                                key={meta.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setActiveId(meta.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") setActiveId(meta.id);
                                }}
                                className={[
                                  "group relative min-w-0 cursor-pointer overflow-hidden rounded-[1.25rem] border p-[1.125rem] outline-none transition duration-300",
                                  PLATFORM_CARD_SURFACE_CLASS,
                                  "shadow-[var(--studio-card-stack-shadow)]",
                                  selected
                                    ? "border-[var(--ice)]/32 ring-1 ring-[var(--ice)]/16"
                                    : "hover:border-[var(--line)] hover:shadow-[var(--studio-card-stack-shadow),0_26px_58px_-44px_rgba(0,234,255,0.05)]",
                                ].join(" ")}
                                aria-selected={selected}
                              >
                                <div
                                  className="pointer-events-none absolute inset-0"
                                  style={{ ...platformAccentOverlay(PLATFORM_CARD_ACCENT), opacity: PLATFORM_CARD_ACCENT_OVERLAY_OPACITY }}
                                  aria-hidden
                                />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ice)]/13 to-transparent" aria-hidden />
                                <div className="relative z-[1]">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]"
                                          style={platformIconTileStyle(PLATFORM_CARD_ACCENT)}
                                        >
                                          <PlatformIcon id={meta.id} className="h-[1.35rem] w-[1.35rem] text-[var(--fg)]/92" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="truncate text-[15px] font-semibold leading-snug tracking-tight text-[var(--fg)]">{meta.label}</div>
                                          <div className="mt-0.5 truncate text-[11px] leading-snug text-[var(--muted)]">
                                            {connected ? (account?.displayName ?? "—") : meta.subtitle}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <ConnectionToggle connected={connected} />
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {connected ? (
                                      <>
                                        <StudioGhostButton
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            syncNow(meta.id);
                                          }}
                                        >
                                          {P.sync}
                                        </StudioGhostButton>
                                        <StudioGhostButton
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            disconnect(meta.id);
                                          }}
                                        >
                                          {P.disconnect}
                                        </StudioGhostButton>
                                      </>
                                    ) : (
                                      <StudioCreateButton
                                        type="button"
                                        className="studio-create-btn--compact"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPermissions(meta.id);
                                        }}
                                      >
                                        {P.connect}
                                      </StudioCreateButton>
                                    )}
                                    {!connected ? (
                                      <span className="min-w-0 max-w-full truncate text-[11px] leading-snug text-[var(--muted)]">{meta.hint}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}
      </div>

    </div>
  );
}

