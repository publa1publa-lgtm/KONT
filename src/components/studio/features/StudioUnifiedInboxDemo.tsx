"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCheck, ChevronDown, Inbox, Lock, SendHorizontal, SlidersHorizontal, Sparkles } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { INBOX_CAPABLE_PLATFORM_IDS, readInboxEnabledPlatformIds, subscribeStudioPlatforms, type InboxCapablePlatformId } from "@/lib/studioInboxPermissions";
import { StudioDialog } from "./StudioDialog";
import { StudioHeader } from "./StudioHeader";
import { FacebookLogo, InstagramLogo, TelegramLogo, TikTokLogo, YouTubeLogo } from "./platformLogos";

export type InboxDemoPlatform = InboxCapablePlatformId;

type InboxDemoKind = "comment" | "dm" | "mention";

type InboxDemoMessage = {
  id: string;
  from: "them" | "me";
  author: string;
  body: string;
  time: string;
};

export type InboxDemoThread = {
  id: string;
  platform: InboxDemoPlatform;
  connected: boolean;
  kind: InboxDemoKind;
  title: string;
  author: string;
  handle: string;
  preview: string;
  /** sort key, ms */
  updatedAt: number;
  unread: boolean;
  channel: string;
  messages: InboxDemoMessage[];
};

const MOCK_THREADS: InboxDemoThread[] = [
  {
    id: "t-ig-1",
    platform: "instagram",
    connected: true,
    kind: "comment",
    title: "New comment on scheduled reel",
    author: "Maya Chen",
    handle: "@mayacreates",
    preview: "This hook is insane — what mic are you using?",
    updatedAt: Date.now() - 1000 * 60 * 12,
    unread: true,
    channel: "@studio.north",
    messages: [
      { id: "m1", from: "them", author: "Maya Chen", body: "This hook is insane — what mic are you using?", time: "12m ago" },
      { id: "m2", from: "them", author: "Maya Chen", body: "Also dropped this to our Slack, team loves it.", time: "11m ago" },
    ],
  },
  {
    id: "t-yt-1",
    platform: "youtube",
    connected: true,
    kind: "comment",
    title: "Community post reply",
    author: "Jordan Lee",
    handle: "@jordanlee",
    preview: "Can you pin the timestamps in the description?",
    updatedAt: Date.now() - 1000 * 60 * 55,
    unread: true,
    channel: "ContentFabric Channel",
    messages: [
      { id: "m1", from: "them", author: "Jordan Lee", body: "Can you pin the timestamps in the description?", time: "55m ago" },
    ],
  },
  {
    id: "t-tt-1",
    platform: "tiktok",
    connected: true,
    kind: "mention",
    title: "Mention in stitch",
    author: "Avery",
    handle: "@avery.film",
    preview: "Stitched your tip about batching B-roll — thank you!",
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    unread: false,
    channel: "@fabric.creator",
    messages: [
      { id: "m1", from: "them", author: "Avery", body: "Stitched your tip about batching B-roll — thank you!", time: "3h ago" },
      {
        id: "m2",
        from: "me",
        author: "You",
        body: "Love that — glad it helped. Send the link when it’s live!",
        time: "2h ago",
      },
    ],
  },
  {
    id: "t-fb-1",
    platform: "facebook",
    connected: false,
    kind: "dm",
    title: "Page inbox (sample)",
    author: "River Oak Cafe",
    handle: "River Oak Cafe",
    preview: "We’d love to collab on a reel for the launch weekend.",
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    unread: false,
    channel: "ContentFabric Page",
    messages: [
      { id: "m1", from: "them", author: "River Oak Cafe", body: "We’d love to collab on a reel for the launch weekend.", time: "1d ago" },
    ],
  },
  {
    id: "t-tg-1",
    platform: "telegram",
    connected: true,
    kind: "dm",
    title: "Creator group DM",
    author: "Noa",
    handle: "@noa",
    preview: "Uploaded the revised captions — ready for review.",
    updatedAt: Date.now() - 1000 * 60 * 60 * 30,
    unread: true,
    channel: "Fabric · Review",
    messages: [
      { id: "m1", from: "them", author: "Noa", body: "Uploaded the revised captions — ready for review.", time: "1d ago" },
      { id: "m2", from: "them", author: "Leo", body: "Second this — ship it tomorrow if green.", time: "1d ago" },
    ],
  },
  {
    id: "t-ig-2",
    platform: "instagram",
    connected: true,
    kind: "mention",
    title: "Story mention",
    author: "Studio North",
    handle: "@studio.north",
    preview: "Featured your carousel in our weekly picks.",
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    unread: false,
    channel: "@fabric.creator",
    messages: [
      { id: "m1", from: "them", author: "Studio North", body: "Featured your carousel in our weekly picks.", time: "2d ago" },
    ],
  },
];

type SortMode = "newest" | "oldest" | "unread";

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
  const s = name.replace(/@/g, "").trim();
  return s.slice(0, 2).toUpperCase() || "??";
}

function threadListNick(t: InboxDemoThread): string {
  const h = t.handle.trim();
  if (h) return h;
  const a = t.author.trim();
  return a || "—";
}

function platformLogo(platform: InboxDemoPlatform, className: string) {
  switch (platform) {
    case "instagram":
      return <InstagramLogo className={className} />;
    case "youtube":
      return <YouTubeLogo className={className} />;
    case "tiktok":
      return <TikTokLogo className={className} />;
    case "facebook":
      return <FacebookLogo className={className} />;
    case "telegram":
      return <TelegramLogo className={className} />;
    default:
      return null;
  }
}

/** Soft brand tint on icon — readable on light + dark studio */
function platformIconClass(platform: InboxDemoPlatform): string {
  switch (platform) {
    case "instagram":
      return "text-[#E1306C]";
    case "youtube":
      return "text-[#FF0033]";
    case "tiktok":
      return "text-[var(--fg)]";
    case "facebook":
      return "text-[#1877F2]";
    case "telegram":
      return "text-[#2AABEE]";
    default:
      return "text-[var(--muted)]";
  }
}

function platformAvatarShell(platform: InboxDemoPlatform, size: "xs" | "sm" | "md" | "lg"): string {
  const dim =
    size === "xs" ? "h-7 w-7" : size === "sm" ? "h-10 w-10" : size === "md" ? "h-11 w-11" : "h-14 w-14";
  const rounded = size === "xs" ? "rounded-lg" : "rounded-2xl";
  const ring =
    platform === "instagram"
      ? "ring-pink-500/25"
      : platform === "youtube"
        ? "ring-red-500/25"
        : platform === "tiktok"
          ? "ring-[var(--fg)]/15"
          : platform === "facebook"
            ? "ring-blue-500/25"
            : "ring-sky-400/30";
  return [
    dim,
    "relative flex shrink-0 items-center justify-center border border-[var(--line)] bg-[var(--studio-surface-3)] shadow-[var(--studio-inner-highlight)] ring-1 ring-inset",
    rounded,
    ring,
  ].join(" ");
}

/** Inbox layout — wrapper-color canvas + white rows (see studio.css). */

export function StudioUnifiedInboxDemo() {
  const { messages } = useI18n();
  const I = messages.studio.inbox;

  const [threads, setThreads] = useState<InboxDemoThread[]>(() => MOCK_THREADS.map((t) => ({ ...t, messages: t.messages.map((m) => ({ ...m })) })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("newest");
  const [platformFilter, setPlatformFilter] = useState<InboxDemoPlatform | "all">("all");
  const [reply, setReply] = useState("");
  const [replyToast, setReplyToast] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "detail">("list");
  const [inboxSourceIds, setInboxSourceIds] = useState<InboxDemoPlatform[]>([]);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  useEffect(() => {
    setInboxSourceIds(readInboxEnabledPlatformIds());
    return subscribeStudioPlatforms(() => setInboxSourceIds(readInboxEnabledPlatformIds()));
  }, []);

  useEffect(() => {
    if (platformFilter !== "all" && !inboxSourceIds.includes(platformFilter)) {
      setPlatformFilter("all");
    }
  }, [inboxSourceIds, platformFilter]);

  const chipPlatforms = useMemo(() => {
    const set = new Set(inboxSourceIds);
    return INBOX_CAPABLE_PLATFORM_IDS.filter((id) => set.has(id));
  }, [inboxSourceIds]);

  const inboxEligibleThreads = useMemo(
    () => threads.filter((t) => inboxSourceIds.includes(t.platform)),
    [threads, inboxSourceIds],
  );

  const unreadTotal = useMemo(() => inboxEligibleThreads.reduce((n, t) => n + (t.unread ? 1 : 0), 0), [inboxEligibleThreads]);

  const filtered = useMemo(() => {
    let list = inboxEligibleThreads.slice();
    if (platformFilter !== "all") list = list.filter((t) => t.platform === platformFilter);
    list.sort((a, b) => {
      if (sort === "unread") {
        if (a.unread !== b.unread) return a.unread ? -1 : 1;
      }
      const d = a.updatedAt - b.updatedAt;
      return sort === "oldest" ? d : -d;
    });
    return list;
  }, [inboxEligibleThreads, platformFilter, sort]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((t) => t.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(() => threads.find((t) => t.id === selectedId) ?? null, [threads, selectedId]);

  const selectThread = useCallback((id: string) => {
    setSelectedId(id);
    setReply("");
    setReplyToast(null);
    setMobilePane("detail");
  }, []);

  const markRead = useCallback(() => {
    if (!selectedId) return;
    setThreads((prev) => prev.map((t) => (t.id === selectedId ? { ...t, unread: false } : t)));
  }, [selectedId]);

  const sendDemoReply = useCallback(() => {
    const text = reply.trim();
    if (!text || !selectedId) return;
    const id = `demo-${Date.now()}`;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              unread: false,
              updatedAt: Date.now(),
              messages: [
                ...t.messages,
                { id, from: "me" as const, author: "You", body: text, time: I.justNow },
              ],
            }
          : t,
      ),
    );
    setReply("");
    setReplyToast(I.sentDemo);
    window.setTimeout(() => setReplyToast(null), 3200);
  }, [I.justNow, I.sentDemo, reply, selectedId]);

  const kindLabel = (k: InboxDemoKind) => {
    if (k === "comment") return I.kindComment;
    if (k === "dm") return I.kindDm;
    return I.kindMention;
  };

  const platformLabel = (p: InboxDemoPlatform) => I.platform[p];

  const unreadSummary = I.unreadSummary.replace("{count}", String(unreadTotal));

  const sortSummaryLabel = sort === "newest" ? I.sort.newest : sort === "oldest" ? I.sort.oldest : I.sort.unread;
  const channelSummaryLabel = platformFilter === "all" ? I.filter.all : platformLabel(platformFilter);

  const sortModes = [
    { mode: "newest" as const, label: I.sort.newest },
    { mode: "oldest" as const, label: I.sort.oldest },
    { mode: "unread" as const, label: I.sort.unread },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 space-y-2">
        <StudioHeader label={I.label} title={I.subtitle} accent="ice" size="compact" />

        <div className="studio-inbox__banner px-3 py-2 sm:px-3.5" role="status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--wrapper-color-rim)] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--ice)]" aria-hidden />
            </div>
            <p className="line-clamp-2 min-w-0 max-w-prose text-[11px] font-medium leading-snug text-[var(--fg)]">{I.demoBanner}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--wrapper-color-rim)] bg-white/75 px-2 py-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ice)]/50 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--ice)]" />
            </span>
            <span className="text-[10px] font-semibold text-[var(--muted)]">{unreadSummary}</span>
          </div>
        </div>
        </div>
      </div>

      <div className="studio-inbox__shell">
        <div className="relative shrink-0 border-b border-[var(--wrapper-color-rim)] px-3 py-3 sm:px-5">
          <div className="studio-inbox__toolbar-wrap">
            <div className="grid gap-0.5">
              <button
              type="button"
              onClick={() => setSortDialogOpen(true)}
              className={[
                "studio-inbox__toolbar-btn focus-visible:ring-2 focus-visible:ring-[var(--ice)]/30",
                sortDialogOpen ? "studio-inbox__toolbar-btn--open" : "",
              ].join(" ")}
              aria-haspopup="dialog"
              aria-expanded={sortDialogOpen}
              aria-label={I.dialog.openButtonAria}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)]/90 bg-[var(--studio-surface-3)] text-[var(--ice)] shadow-[var(--studio-inner-highlight)]">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{I.sort.label}</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-[var(--fg)]">
                  {sortSummaryLabel}
                  <span className="mx-1 font-normal text-[var(--studio-hairline)]" aria-hidden>
                    ·
                  </span>
                  {channelSummaryLabel}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden />
            </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div
            className={[
              "studio-inbox__threads-col",
              mobilePane === "detail" ? "hidden lg:flex" : "flex",
            ].join(" ")}
          >
            <div className="studio-inbox__col-head">
              <div className="flex min-w-0 items-center gap-1.5">
                <Inbox className="h-3.5 w-3.5 shrink-0 text-[var(--ice)]/90" aria-hidden />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{I.threads}</span>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--studio-surface-3)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--muted)]">
                {filtered.length}
              </span>
            </div>
            <ul className="studio-inbox__thread-scroll list-none">
              {filtered.length === 0 ? (
                <li className="studio-inbox__empty">
                  <div className="studio-inbox__empty-card h-12 w-12">
                    <Inbox className="h-6 w-6" aria-hidden />
                  </div>
                  {chipPlatforms.length === 0 ? (
                    <div className="max-w-[11rem]">
                      <div className="text-xs font-semibold text-[var(--fg)]">{I.noSourcesTitle}</div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">{I.noSourcesBody}</p>
                    </div>
                  ) : (
                    <p className="max-w-[11rem] text-[11px] leading-relaxed text-[var(--muted)]">{I.listEmpty}</p>
                  )}
                </li>
              ) : (
                filtered.map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <li key={t.id} className="list-none">
                      <button
                        type="button"
                        onClick={() => selectThread(t.id)}
                        className={[
                          "studio-inbox__thread group",
                          active ? "studio-inbox__thread--active" : "",
                          t.unread ? "studio-inbox__thread--unread" : "",
                        ].join(" ")}
                        aria-current={active ? "true" : undefined}
                        aria-label={`${t.title}. ${threadListNick(t)}, ${platformLabel(t.platform)}`}
                      >
                        <div className="relative flex shrink-0 flex-col items-center">
                          <div className={platformAvatarShell(t.platform, "xs")}>
                            <span className={platformIconClass(t.platform)}>{platformLogo(t.platform, "h-3.5 w-3.5")}</span>
                          </div>
                          {!t.connected ? (
                            <span
                              className="absolute -end-0.5 -bottom-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[var(--studio-surface)] bg-[var(--muted)]"
                              title={I.notConnected}
                            />
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-1 items-start gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-semibold leading-tight text-[var(--fg)] group-hover:text-[var(--studio-selected-text)]">
                              {threadListNick(t)}
                            </div>
                            <div className="truncate text-[9px] font-medium leading-tight text-[var(--muted)]">{platformLabel(t.platform)}</div>
                          </div>
                          <div className="flex shrink-0 self-center">
                            {t.unread ? (
                              <span className="rounded bg-[var(--ice)]/20 px-1 py-px text-[7px] font-bold uppercase tracking-wide text-[var(--ice)]">
                                {I.unreadBadge}
                              </span>
                            ) : (
                              <CheckCheck className="h-3 w-3 text-[var(--muted)]/35" aria-label={I.readState} />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div
            className={[
              "studio-inbox__detail-col",
              mobilePane === "list" ? "hidden lg:flex" : "flex",
            ].join(" ")}
          >
            <div className={`studio-inbox__col-head justify-start lg:hidden`}>
              <button
                type="button"
                onClick={() => setMobilePane("list")}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-xs font-semibold text-[var(--fg)] shadow-sm transition hover:border-[var(--ice)]/25 hover:bg-[var(--studio-hover)]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {I.back}
              </button>
            </div>

            {selected ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <header className="studio-inbox__detail-header">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-2.5">
                      <div className={platformAvatarShell(selected.platform, "md")}>
                        <span className={platformIconClass(selected.platform)}>{platformLogo(selected.platform, "h-5 w-5")}</span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <h2 className="min-w-0 max-w-[min(100%,36rem)] text-[15px] font-semibold leading-snug tracking-tight text-[var(--fg)] sm:text-base">
                            {selected.title}
                          </h2>
                          <span className="shrink-0 rounded-md border border-[var(--line)] bg-[var(--studio-surface-3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                            {kindLabel(selected.kind)}
                          </span>
                        </div>
                        <p className="flex flex-col gap-1 text-[11px] text-[var(--muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-0.5 sm:text-xs">
                          <span className="font-semibold text-[var(--fg)]/90">{threadListNick(selected)}</span>
                          <span className="text-[var(--studio-hairline)] sm:hidden" aria-hidden>
                            ·
                          </span>
                          <span className="hidden h-3 w-px shrink-0 self-center bg-[var(--studio-hairline)] sm:block" aria-hidden />
                          <span>{platformLabel(selected.platform)}</span>
                          <span className="text-[var(--studio-hairline)] sm:hidden" aria-hidden>
                            ·
                          </span>
                          <span className="hidden h-3 w-px shrink-0 self-center bg-[var(--studio-hairline)] sm:block" aria-hidden />
                          <span className="min-w-0 truncate text-[var(--muted)]" title={`${I.connectedAs} ${selected.channel}`}>
                            <span className="text-[var(--muted)]">{I.connectedAs} </span>
                            <span className="font-medium text-[var(--fg)]/85">{selected.channel}</span>
                          </span>
                        </p>
                        {!selected.connected ? (
                          <span className="inline-flex w-fit rounded-md border border-[var(--line)] bg-[var(--studio-surface-3)]/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                            {I.sampleDisconnected}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      {selected.unread ? (
                        <button
                          type="button"
                          onClick={markRead}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)]/80 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fg)] transition hover:border-[var(--ice)]/35 hover:bg-[var(--ice)]/10 hover:text-[var(--ice)]"
                        >
                          <CheckCheck className="h-3 w-3" aria-hidden />
                          {I.markRead}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1.5 text-[11px] font-medium text-[var(--muted)]">
                          <CheckCheck className="h-3 w-3 opacity-60" aria-hidden />
                          {I.readState}
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                <div className="studio-inbox__detail-body">
                  <div className="mx-auto flex max-w-2xl flex-col gap-3">
                    <p className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]/75">{I.conversation}</p>
                    {selected.messages.map((m) => (
                      <div
                        key={m.id}
                        className={["flex gap-2", m.from === "me" ? "flex-row-reverse" : "flex-row"].join(" ")}
                      >
                        {m.from === "them" ? (
                          <div
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--studio-surface-3)] text-[10px] font-bold text-[var(--fg)] ring-1 ring-[var(--line)]/80"
                            aria-hidden
                          >
                            {initials(m.author)}
                          </div>
                        ) : (
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ice)]/12 text-[9px] font-bold uppercase tracking-wide text-[var(--ice)] ring-1 ring-[var(--ice)]/20">
                            CF
                          </div>
                        )}
                        <div
                          className={[
                            "max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5",
                            m.from === "me"
                              ? "rounded-tr-md border border-[var(--ice)]/28 bg-[var(--ice)]/[0.08]"
                              : "rounded-tl-md border border-[var(--line)]/90 bg-[var(--studio-surface-3)]/55 shadow-sm",
                          ].join(" ")}
                        >
                          <div className="flex items-baseline justify-between gap-2 text-[11px] font-semibold">
                            <span className={m.from === "me" ? "text-[var(--ice)]" : "text-[var(--fg)]"}>{m.author}</span>
                            <time className="shrink-0 tabular-nums text-[10px] font-medium text-[var(--muted)]">{m.time}</time>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg)]/93">{m.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <footer className="studio-inbox__detail-footer">
                  {replyToast ? (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--ice)]/28 bg-[var(--ice)]/10 px-3 py-2 text-xs font-medium text-[var(--ice)]">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {replyToast}
                    </div>
                  ) : null}
                  <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[var(--wrapper-color-rim)] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <label className="block px-3 pt-2.5">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{I.replyLabel}</span>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        placeholder={I.replyPlaceholder}
                        className="max-h-[min(28vh,180px)] min-h-[72px] w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-[var(--fg)] outline-none transition placeholder:text-[var(--muted)]/40 focus:ring-0"
                      />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--wrapper-color-rim)] bg-white/55 px-3 py-2">
                      <p className="min-w-0 flex-1 text-[10px] leading-snug text-[var(--muted)] sm:max-w-[70%]">{I.replyHint}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        {reply.length > 0 ? (
                          <span className="text-[10px] tabular-nums text-[var(--muted)]/70">{reply.length}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={sendDemoReply}
                          disabled={!reply.trim()}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition",
                            reply.trim()
                              ? "bg-gradient-to-r from-[var(--electric)] to-[var(--ice)] text-black shadow-[0_0_20px_rgba(0,234,255,0.15)] hover:brightness-110"
                              : "cursor-not-allowed border border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--muted)]/45",
                          ].join(" ")}
                        >
                          <SendHorizontal className="h-3.5 w-3.5" aria-hidden />
                          {I.send}
                        </button>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            ) : (
              <div className="studio-inbox__empty">
                <div className="studio-inbox__empty-card h-16 w-16">
                  <Inbox className="h-8 w-8 opacity-85" aria-hidden />
                </div>
                <p className="max-w-[11rem] text-xs leading-snug text-[var(--muted)]">{I.pickThread}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <StudioDialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        title={I.dialog.title}
        description={I.dialog.subtitle}
        cancelLabel={I.dialog.cancel}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setSortDialogOpen(false)}
              className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-4 py-2 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]"
            >
              {I.dialog.cancel}
            </button>
            <button
              type="button"
              onClick={() => setSortDialogOpen(false)}
              className="rounded-xl border border-[var(--ice)]/35 bg-[var(--ice)]/14 px-4 py-2 text-sm font-semibold text-[var(--ice)] transition hover:bg-[var(--ice)]/22"
            >
              {I.dialog.done}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{I.dialog.sortSection}</legend>
            <div className="grid gap-2">
              {sortModes.map(({ mode, label }) => {
                const checked = sort === mode;
                return (
                  <label
                    key={mode}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition",
                      checked
                        ? "border-[var(--ice)]/40 bg-[var(--ice)]/[0.09] text-[var(--fg)] shadow-[0_0_0_1px_rgba(0,234,255,0.06)]"
                        : "border-[var(--line)] bg-[var(--studio-surface)]/35 text-[var(--fg)] hover:border-[var(--ice)]/22 hover:bg-[var(--studio-hover)]/45",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="cf-inbox-sort"
                      className="h-4 w-4 shrink-0 accent-[var(--ice)]"
                      checked={checked}
                      onChange={() => setSort(mode)}
                    />
                    <span className="min-w-0 flex-1">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{I.dialog.channelsSection}</legend>
            <div className="grid gap-2">
              <label
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition",
                  platformFilter === "all"
                    ? "border-[var(--ice)]/40 bg-[var(--ice)]/[0.09] text-[var(--fg)] shadow-[0_0_0_1px_rgba(0,234,255,0.06)]"
                    : "border-[var(--line)] bg-[var(--studio-surface)]/35 text-[var(--fg)] hover:border-[var(--ice)]/22 hover:bg-[var(--studio-hover)]/45",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="cf-inbox-channel"
                  className="h-4 w-4 shrink-0 accent-[var(--ice)]"
                  checked={platformFilter === "all"}
                  onChange={() => setPlatformFilter("all")}
                />
                <span className="min-w-0 flex-1 font-medium">{I.filter.all}</span>
              </label>

              {INBOX_CAPABLE_PLATFORM_IDS.map((pid) => {
                const available = inboxSourceIds.includes(pid);
                const checked = platformFilter === pid;
                return (
                  <label
                    key={pid}
                    title={!available ? I.dialog.channelUnavailable : undefined}
                    className={[
                      "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition",
                      !available
                        ? "cursor-not-allowed border-[var(--line)]/50 bg-[var(--studio-surface-2)]/25 text-[var(--muted)]"
                        : checked
                          ? "cursor-pointer border-[var(--ice)]/40 bg-[var(--ice)]/[0.09] text-[var(--fg)] shadow-[0_0_0_1px_rgba(0,234,255,0.06)]"
                          : "cursor-pointer border-[var(--line)] bg-[var(--studio-surface)]/35 text-[var(--fg)] hover:border-[var(--ice)]/22 hover:bg-[var(--studio-hover)]/45",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="cf-inbox-channel"
                      className="h-4 w-4 shrink-0 accent-[var(--ice)] disabled:cursor-not-allowed"
                      checked={checked}
                      disabled={!available}
                      onChange={() => {
                        if (available) setPlatformFilter(pid);
                      }}
                    />
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)]",
                        platformIconClass(pid),
                      ].join(" ")}
                    >
                      {platformLogo(pid, "h-4 w-4")}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{platformLabel(pid)}</span>
                    {!available ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                        <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                        <span className="hidden max-w-[10rem] truncate sm:inline">{I.dialog.channelUnavailable}</span>
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </StudioDialog>
    </div>
  );
}
