"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Link2, Search } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import {
  STUDIO_PLATFORMS_STORAGE_KEY,
  readStudioPlatformStates,
  syncReelPlatformConnectionToServer,
} from "@/lib/studioPlatformsStorage";
import { isReelPlatformId } from "@/lib/reelPlatformIds";
import { INBOX_UNIFIED_PERMISSION_ID } from "@/lib/studioInboxPermissions";
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
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow } from "./StudioWrapperList";
import {
  PLATFORM_CARD_ACCENT,
  PLATFORM_CARD_ACCENT_OVERLAY_OPACITY,
  PLATFORM_CARD_SURFACE_CLASS,
  PLATFORM_PANEL_SURFACE_CLASS,
  platformAccentOverlay,
  platformBrandAccent,
  platformGroupAccent,
  platformIconTileStyle,
} from "./platformCardStyles";

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
}> = [
  {
    id: "youtube",
    group: "social",
    label: "YouTube",
    subtitle: "Upload & schedule videos",
    hint: "OAuth (Google) — scopes, channel access",
  },
  {
    id: "tiktok",
    group: "social",
    label: "TikTok",
    subtitle: "Short-form distribution",
    hint: "OAuth — account + posting permissions",
  },
  {
    id: "instagram",
    group: "social",
    label: "Instagram",
    subtitle: "Reels & cross-post",
    hint: "Meta — IG account + page linkage",
  },
  {
    id: "facebook",
    group: "social",
    label: "Facebook",
    subtitle: "Pages & video publishing",
    hint: "Meta — pages_manage_posts, publish_video",
  },
  {
    id: "pinterest",
    group: "social",
    label: "Pinterest",
    subtitle: "Pins & boards",
    hint: "OAuth — create pins, read boards",
  },
  {
    id: "linkedin",
    group: "social",
    label: "LinkedIn",
    subtitle: "Posts & articles",
    hint: "OAuth — organization & member publishing",
  },
  {
    id: "telegram",
    group: "messengers",
    label: "Telegram",
    subtitle: "Bots & notifications",
    hint: "Bot API — token-based, no heavy review",
  },
  {
    id: "discord",
    group: "notifications",
    label: "Discord",
    subtitle: "Team notifications",
    hint: "Webhook — paste URL, send messages",
  },
  {
    id: "email",
    group: "notifications",
    label: "Email",
    subtitle: "Universal alerts",
    hint: "SMTP / provider API key",
  },
  {
    id: "notion",
    group: "productivity",
    label: "Notion",
    subtitle: "Content planning database",
    hint: "Integration token + shared pages/databases",
  },
  {
    id: "googleDrive",
    group: "storage",
    label: "Google Drive",
    subtitle: "Import/export assets",
    hint: "OAuth — Drive scopes",
  },
  {
    id: "dropbox",
    group: "storage",
    label: "Dropbox",
    subtitle: "Import/export assets",
    hint: "OAuth — Dropbox scopes",
  },
];

const GROUP_ORDER: PlatformGroupId[] = ["social", "messengers", "productivity", "storage", "notifications"];

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
        typeof (accountRaw as { displayName?: unknown }).displayName === "string" &&
        typeof (accountRaw as { connectedAt?: unknown }).connectedAt === "number" &&
        (typeof (accountRaw as { lastSyncAt?: unknown }).lastSyncAt === "number" ||
          (accountRaw as { lastSyncAt?: unknown }).lastSyncAt === null)
          ? ({
              displayName: (accountRaw as ConnectedAccount).displayName,
              connectedAt: (accountRaw as ConnectedAccount).connectedAt,
              lastSyncAt: (accountRaw as ConnectedAccount).lastSyncAt,
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
  const [groupFilter, setGroupFilter] = useState<PlatformGroupId | "all">("all");
  const [qcOpen, setQcOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [permPlatformId, setPermPlatformId] = useState<PlatformId | null>(null);
  const catalogRef = useRef<HTMLDivElement | null>(null);

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
  const connectedPlatforms = useMemo(() => platforms.filter((p) => p.connected), [platforms]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const merged = PLATFORM_META.map((meta) => {
      const state = platforms.find((p) => p.id === meta.id) ?? {
        id: meta.id,
        connected: false,
        account: null,
        grantedPermissionIds: [],
      };
      return { meta, state };
    });
    return merged.filter(({ meta, state }) => {
      if (connectedOnly && !state.connected) return false;
      if (groupFilter !== "all" && meta.group !== groupFilter) return false;
      if (!q) return true;
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.subtitle.toLowerCase().includes(q) ||
        meta.hint.toLowerCase().includes(q) ||
        (state.account?.displayName ?? "").toLowerCase().includes(q)
      );
    });
  }, [connectedOnly, groupFilter, platforms, query]);

  const groupLabels: Record<PlatformGroupId, string> = useMemo(
    () => ({
      social: P.groupSocial,
      messengers: P.groupMessengers,
      productivity: P.groupProductivity,
      storage: P.groupStorage,
      notifications: P.groupNotifications,
    }),
    [P.groupMessengers, P.groupNotifications, P.groupProductivity, P.groupSocial, P.groupStorage],
  );

  const activePlatform = useMemo(() => {
    if (!activeId) return null;
    const s = platforms.find((p) => p.id === activeId) ?? null;
    const meta = PLATFORM_META.find((p) => p.id === activeId) ?? null;
    return s && meta ? { ...s, meta } : null;
  }, [activeId, platforms]);

  useEffect(() => {
    if (!activeId) return;
    const stillVisible = list.some((x) => x.meta.id === activeId) || connectedPlatforms.some((p) => p.id === activeId);
    if (!stillVisible && list[0]) setActiveId(list[0].meta.id);
  }, [activeId, connectedPlatforms, list]);

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
    setQcOpen(true);
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

  function openManage(platformId: PlatformId) {
    setActiveId(platformId);
    setQcOpen(true);
  }

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-5">
      <PlatformPermissionsModal
        open={permOpen}
        platformId={permPlatformId}
        platformLabel={permPlatformId ? (PLATFORM_META.find((x) => x.id === permPlatformId)?.label ?? permPlatformId) : ""}
        onClose={() => setPermOpen(false)}
        onConfirm={(picked) => {
          setPermOpen(false);
          if (!permPlatformId) return;
          void connect(permPlatformId, picked);
        }}
      />

      <div className="cal-surface relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--ice)_22%,transparent),transparent_70%)] opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -start-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--electric)_14%,transparent),transparent_72%)] opacity-70"
          aria-hidden
        />

        <div className="relative z-[1]">
          <StudioHeader
            label={P.connectedLabel}
            title={P.connectedLabel}
            subtitle={P.connectedSubtitle}
            right={
              <div className="flex items-end gap-3">
                <div className="text-end">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {P.connectedCount}
                  </div>
                  <div className="mt-0.5 font-semibold tabular-nums tracking-tight text-[var(--fg)]">
                    <span className="text-2xl leading-none text-[var(--ice)]">{connectedCount}</span>
                    <span className="ms-1 text-sm text-[var(--muted)]">/ {PLATFORM_META.length}</span>
                  </div>
                </div>
              </div>
            }
          />

          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
            {connectedCount === 0 ? P.connectedHintNone : P.connectedHintSome}
          </p>

          <div className="mt-5">
            {connectedPlatforms.length === 0 ? (
              <div
                className={`relative overflow-hidden rounded-2xl border px-5 py-8 text-center sm:px-8 ${PLATFORM_PANEL_SURFACE_CLASS}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={platformAccentOverlay("var(--ice)")}
                  aria-hidden
                />
                <div className="relative z-[1] mx-auto flex max-w-md flex-col items-center">
                  <span
                    className="grid size-14 place-items-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    style={platformIconTileStyle("var(--ice)")}
                  >
                    <Link2 className="size-6" strokeWidth={2.25} aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-[var(--fg)]">
                    {P.emptyConnectedTitle}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{P.emptyConnectedBody}</p>
                  <StudioCreateButton type="button" className="studio-create-btn--sm mt-5" onClick={scrollToCatalog}>
                    {P.connect}
                  </StudioCreateButton>
                </div>
              </div>
            ) : (
              <StudioWrapperList>
                <StudioWrapperListBody as="ul" className="gap-2">
                  {connectedPlatforms.map((p) => {
                    const meta = PLATFORM_META.find((m) => m.id === p.id)!;
                    const accent = platformBrandAccent(p.id);
                    const selected = activeId === p.id && qcOpen;
                    return (
                      <StudioWrapperListRow as="li" key={p.id} className="p-0 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => openManage(p.id)}
                          className={[
                            "group flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-start transition-colors duration-200 sm:gap-4 sm:px-4",
                            selected
                              ? "bg-[color-mix(in_srgb,var(--ice)_8%,transparent)]"
                              : "hover:bg-[color-mix(in_srgb,var(--wrapper-color-soft)_55%,transparent)]",
                          ].join(" ")}
                        >
                          <span
                            className="grid size-11 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                            style={platformIconTileStyle(accent)}
                          >
                            <PlatformIcon id={p.id} className="size-[1.15rem]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[15px] font-semibold tracking-tight text-[var(--fg)]">
                                {meta.label}
                              </span>
                              <ConnectionToggle connected className="!rounded-md" />
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                              {p.account?.displayName ?? meta.subtitle}
                              {p.account?.lastSyncAt
                                ? ` · ${P.lastSync} ${formatRelative(p.account.lastSyncAt)}`
                                : ` · ${P.noSync}`}
                            </span>
                          </span>
                          <span className="hidden items-center gap-1 text-xs font-semibold text-[var(--muted)] transition-colors group-hover:text-[var(--fg)] sm:inline-flex">
                            {P.manage}
                            <ChevronRight className="size-3.5 opacity-70 rtl:rotate-180" aria-hidden />
                          </span>
                          <ChevronRight
                            className="size-4 shrink-0 text-[var(--muted)] opacity-70 sm:hidden rtl:rotate-180"
                            aria-hidden
                          />
                        </button>
                      </StudioWrapperListRow>
                    );
                  })}
                </StudioWrapperListBody>
              </StudioWrapperList>
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
                        accent: platformBrandAccent(activePlatform.meta.id),
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
      </div>

      <div ref={catalogRef} className="cal-surface rounded-3xl p-5 sm:p-6">
        <StudioHeader
          label={P.yourPlatforms}
          title={P.yourPlatforms}
          subtitle={P.catalogSubtitle}
          right={
            <StudioGhostButton
              type="button"
              className="studio-btn-ghost--sm"
              onClick={() => {
                setPlatforms(defaultState());
                setActiveId("youtube");
                setQuery("");
                setConnectedOnly(false);
                setGroupFilter("all");
                setQcOpen(false);
              }}
            >
              {P.resetDemo}
            </StudioGhostButton>
          }
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">{P.searchPlaceholder}</span>
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={P.searchPlaceholder}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] py-2.5 pe-3 ps-9 text-sm text-[var(--fg)] outline-none ring-[var(--ice)]/35 placeholder:text-[var(--muted)]/60 focus:ring-2"
            />
          </label>
          <button
            type="button"
            onClick={() => setConnectedOnly((v) => !v)}
            className={connectedOnly ? "studio-create-btn studio-create-btn--sm" : "studio-btn-ghost studio-btn-ghost--sm"}
            aria-pressed={connectedOnly}
          >
            {P.connectedOnly}
          </button>
        </div>

        <div className="platform-group-tags mt-4">
          {(
            [
              ["all", P.allGroups] as const,
              ...GROUP_ORDER.map((g) => [g, groupLabels[g]] as const),
            ] as const
          ).map(([id, label]) => {
            const active = groupFilter === id;
            const groupColor = id === "all" ? "var(--ice)" : platformGroupAccent(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setGroupFilter(id)}
                className={[
                  "platform-group-tag",
                  id === "all" ? "is-all" : "",
                  active ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ ["--platform-group" as string]: groupColor }}
                aria-pressed={active}
              >
                <span className="platform-group-tag__dot" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className={`mt-5 rounded-2xl border p-5 text-sm text-[var(--muted)] ${PLATFORM_PANEL_SURFACE_CLASS}`}>
            {P.noMatch}
          </div>
        ) : (
          <div className="platform-grid-wrap mt-5">
          <div className="platform-grid">
            {list.map(({ meta, state }) => {
              const connected = state.connected;
              const account = state.account;
              const accent = platformBrandAccent(meta.id);
              const selected = meta.id === activeId && qcOpen;
              return (
                <article
                  key={meta.id}
                  className={[
                    "platform-catalog-card",
                    PLATFORM_CARD_SURFACE_CLASS,
                    connected ? "is-connected" : "",
                    selected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    ["--platform-accent" as string]: accent,
                    ["--platform-group" as string]: platformGroupAccent(meta.group),
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ ...platformAccentOverlay(PLATFORM_CARD_ACCENT), opacity: PLATFORM_CARD_ACCENT_OVERLAY_OPACITY }}
                    aria-hidden
                  />
                  <div className="platform-catalog-card__ring" aria-hidden />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--ice)]/16 to-transparent"
                    aria-hidden
                  />

                  <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="platform-catalog-card__icon">
                        <PlatformIcon id={meta.id} />
                      </div>
                      <span className="platform-catalog-card__status">
                        <span className="platform-catalog-card__status-dot" aria-hidden />
                        {connected ? (
                          <span className="platform-catalog-card__status-label">{P.onlineLabel}</span>
                        ) : null}
                      </span>
                    </div>

                    <h3 className="platform-catalog-card__name mt-3">{meta.label}</h3>
                    <p className="platform-catalog-card__meta">
                      {connected ? (account?.displayName ?? meta.subtitle) : meta.subtitle}
                    </p>
                    <span className="platform-catalog-card__chip">{groupLabels[meta.group]}</span>
                    <p className="platform-catalog-card__hint">
                      {connected
                        ? account?.lastSyncAt
                          ? `${P.lastSync}: ${formatRelative(account.lastSyncAt)}`
                          : P.noSync
                        : meta.hint}
                    </p>
                  </div>

                  <div className="platform-catalog-card__footer">
                    {connected ? (
                      <StudioGhostButton
                        type="button"
                        className="studio-btn-ghost--md"
                        onClick={() => openManage(meta.id)}
                      >
                        {P.manage}
                      </StudioGhostButton>
                    ) : (
                      <StudioCreateButton
                        type="button"
                        className="studio-create-btn--sm"
                        onClick={() => openPermissions(meta.id)}
                      >
                        {P.connect}
                      </StudioCreateButton>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
