"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clapperboard, ImageIcon, LayoutGrid, List } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { useI18n } from "@/contexts/i18n-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ContentComposerModal } from "./ContentComposerModal";
import { ContentTableActions } from "./ContentTableActions";
import { ContentHashtagChips } from "./ContentHashtagChips";
import { ContentKindBadge, contentKindFromApiType } from "./ContentKindBadge";
import { ContentPlatformIcons, type ContentPlatformLabels } from "./ContentPlatformIcons";
import { formatStudioCreateCta, StudioCreateShell } from "./StudioCreateShell";
import { StudioHeader } from "./StudioHeader";
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow, studioWrapperList } from "./StudioWrapperList";
import {
  CONTENT_LIST_CHANGED_EVENT,
  deleteContent,
  duplicateContentAsDraft,
  fetchContents,
  notifyContentListChanged,
  updateContent,
  type ContentApiItem,
} from "@/lib/contentApi";
import type { ContentListItem } from "@/lib/contentMappers";
import { mapApiItemsToListItems } from "@/lib/contentMappers";
import { saveComposerPost, saveComposerReel, updateComposerPost, updateComposerReel } from "@/lib/saveComposerContent";

type PublishableListItem = ContentListItem;

type ContentKindFilter = "all" | "post" | "reel";
type ContentLayoutMode = "list" | "grid";

const CONTENT_LAYOUT_STORAGE_KEY = "kont.studio.content.layout";

function readStoredLayout(): ContentLayoutMode {
  if (typeof window === "undefined") return "list";
  try {
    const raw = window.localStorage.getItem(CONTENT_LAYOUT_STORAGE_KEY);
    return raw === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

type TableDateParts = { date: string; time: string; iso: string; title: string };

function ContentKindFilterBar({
  value,
  onChange,
  labels,
}: {
  value: ContentKindFilter;
  onChange: (next: ContentKindFilter) => void;
  labels: { all: string; posts: string; reels: string; aria: string };
}) {
  const options: Array<{ id: ContentKindFilter; label: string }> = [
    { id: "all", label: labels.all },
    { id: "post", label: labels.posts },
    { id: "reel", label: labels.reels },
  ];

  return (
    <div
      className="inline-flex rounded-xl border border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 p-1"
      role="tablist"
      aria-label={labels.aria}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={[
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ice)]/40",
              active
                ? "bg-[var(--glass)] text-[var(--fg)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] ring-1 ring-[var(--line)]/70"
                : "text-[var(--muted)] hover:text-[var(--fg)]/85",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ContentLayoutToggle({
  value,
  onChange,
  labels,
}: {
  value: ContentLayoutMode;
  onChange: (next: ContentLayoutMode) => void;
  labels: { list: string; grid: string; aria: string };
}) {
  const options: Array<{ id: ContentLayoutMode; label: string; Icon: typeof List }> = [
    { id: "list", label: labels.list, Icon: List },
    { id: "grid", label: labels.grid, Icon: LayoutGrid },
  ];

  return (
    <div
      className="inline-flex rounded-xl border border-[var(--line)]/80 bg-[var(--studio-surface-2)]/90 p-1"
      role="tablist"
      aria-label={labels.aria}
    >
      {options.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(id)}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ice)]/40",
              active
                ? "bg-[var(--glass)] text-[var(--fg)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)] ring-1 ring-[var(--line)]/70"
                : "text-[var(--muted)] hover:text-[var(--fg)]/85",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function tableDatePartsFromMs(ms: number, locale: AppLocale): TableDateParts {
  const d = new Date(ms);
  const now = new Date();
  const showYear = d.getFullYear() !== now.getFullYear();
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(showYear ? { year: "numeric" } : {}),
  }).format(d);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  const title = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
  return { date, time, iso: d.toISOString(), title };
}

function tableScheduledParts(p: PublishableListItem, locale: AppLocale): TableDateParts | null {
  if (!p.dateKey || !p.time) return null;
  const [y, mo, d] = p.dateKey.split("-").map(Number);
  const [hh, mm] = p.time.split(":").map(Number);
  if (![y, mo, d, hh, mm].every(Number.isFinite)) return null;
  return tableDatePartsFromMs(new Date(y, mo - 1, d, hh, mm, 0, 0).getTime(), locale);
}

function contentExcerpt(p: PublishableListItem): string | null {
  const text = p.kind === "post" ? p.text : p.description;
  const trimmed = text?.trim();
  return trimmed || null;
}

function contentThumbUrl(p: PublishableListItem): string | null {
  if (p.kind === "reel") return p.videoUrl || null;
  if (p.kind === "post") return p.imageUrl || null;
  return null;
}

type DisplayStatus = "draft" | "scheduled" | "posted" | "archived";

function scheduledMs(p: PublishableListItem): number | null {
  if (!p.dateKey || !p.time) return null;
  const [y, mo, d] = p.dateKey.split("-").map(Number);
  const [hh, mm] = p.time.split(":").map(Number);
  if (![y, mo, d, hh, mm].every(Number.isFinite)) return null;
  return new Date(y, mo - 1, d, hh, mm, 0, 0).getTime();
}

/** Map DB status + schedule time → what the library should show. */
function displayStatusFor(item: PublishableListItem, nowMs = Date.now()): DisplayStatus {
  const raw = String(item.status).toUpperCase();
  if (raw === "ARCHIVED") return "archived";
  if (raw === "DRAFT") return "draft";
  if (raw === "READY" || raw === "PUBLISHED") return "posted";
  if (raw === "SCHEDULED") {
    const at = scheduledMs(item);
    if (at != null && at <= nowMs) return "posted";
    return "scheduled";
  }
  return "draft";
}

function statusBadgeClass(status: DisplayStatus): string {
  const base =
    "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide";
  if (status === "scheduled") {
    return `${base} border-[var(--ice)]/35 bg-[var(--ice)]/12 text-[var(--ice)]`;
  }
  if (status === "posted") {
    return `${base} border-[var(--ice)]/22 bg-[var(--ice)]/6 text-[var(--ice)]`;
  }
  if (status === "archived") {
    return `${base} border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--muted)]`;
  }
  return `${base} border-[var(--ember)]/25 bg-[var(--ember)]/10 text-[var(--ember)]`;
}

function MetaDate({
  scheduled,
  createdAt,
  tone = "muted",
}: {
  scheduled?: PublishableListItem;
  createdAt?: number;
  tone?: "scheduled" | "muted";
}) {
  const { locale } = useI18n();
  const parts = scheduled
    ? tableScheduledParts(scheduled, locale)
    : createdAt != null
      ? tableDatePartsFromMs(createdAt, locale)
      : null;

  if (!parts) {
    return <span className="text-[var(--muted)]/45">—</span>;
  }

  return (
    <time
      dateTime={parts.iso}
      title={parts.title}
      className={[
        "tabular-nums",
        tone === "scheduled" ? "font-medium text-[var(--ice)]" : "text-[var(--muted)]",
      ].join(" ")}
    >
      {parts.date}
      <span className="mx-1 opacity-40">·</span>
      {parts.time}
    </time>
  );
}

function ContentKindThumbIcon({ kind }: { kind: PublishableListItem["kind"] }) {
  const Icon = kind === "reel" ? Clapperboard : ImageIcon;
  return (
    <span
      className={[
        "absolute left-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border shadow-[0_6px_16px_-10px_rgba(0,0,0,0.55)] backdrop-blur-md",
        kind === "reel"
          ? "border-[var(--ice)]/35 bg-[var(--ice)]/18 text-[var(--ice)]"
          : "border-white/25 bg-black/35 text-white/90",
      ].join(" ")}
      aria-hidden
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </span>
  );
}

function ContentLibraryRow({
  item,
  labels,
  platformLabels,
  actionLabels,
  duplicateBusy,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  item: PublishableListItem;
  labels: {
    typeReel: string;
    typePost: string;
    typeEvent: string;
    statusDraft: string;
    statusScheduled: string;
    statusPosted: string;
    statusArchived: string;
    tablePlatforms: string;
    tableScheduled: string;
    tableCreated: string;
  };
  platformLabels: ContentPlatformLabels;
  actionLabels: { edit: string; duplicate: string; archive: string; delete: string };
  duplicateBusy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const thumb = contentThumbUrl(item);
  const excerpt = contentExcerpt(item);
  const isReel = item.kind === "reel";
  const displayStatus = displayStatusFor(item);
  const statusLabel =
    displayStatus === "scheduled"
      ? labels.statusScheduled
      : displayStatus === "posted"
        ? labels.statusPosted
        : displayStatus === "archived"
          ? labels.statusArchived
          : labels.statusDraft;

  return (
    <StudioWrapperListRow as="li" className="p-3.5 sm:p-4">
      <div className="flex gap-3.5 sm:gap-4">
        <div
          className={[
            "relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl border border-[var(--line)]/70 sm:h-[5.25rem] sm:w-[5.25rem]",
            isReel ? "bg-[var(--ice)]/8" : "bg-[var(--studio-surface-3)]",
          ].join(" ")}
        >
          {thumb ? (
            isReel ? (
              <video
                src={thumb}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--muted)]/60">—</div>
          )}
          <ContentKindThumbIcon kind={item.kind} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--fg)] sm:text-base">
                  {item.title}
                </h3>
                <ContentKindBadge
                  kind={item.kind}
                  reelLabel={labels.typeReel}
                  postLabel={labels.typePost}
                  eventLabel={labels.typeEvent}
                  align="center"
                />
                <span className={statusBadgeClass(displayStatus)} title={statusLabel}>
                  {statusLabel}
                </span>
              </div>
              {excerpt ? (
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)]">{excerpt}</p>
              ) : null}
            </div>
            <div className="shrink-0">
              <ContentTableActions
                iconsOnly
                labels={actionLabels}
                duplicateBusy={duplicateBusy}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] leading-none text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]/70">
                {labels.tablePlatforms}
              </span>
              <ContentPlatformIcons platforms={item.platforms} labels={platformLabels} />
            </span>
            <span className="hidden h-3 w-px bg-[var(--line)] sm:block" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]/70">
                {labels.tableScheduled}
              </span>
              <MetaDate scheduled={item} tone="scheduled" />
            </span>
            <span className="hidden h-3 w-px bg-[var(--line)] sm:block" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]/70">
                {labels.tableCreated}
              </span>
              <MetaDate createdAt={item.createdAt} />
            </span>
          </div>

          {item.hashtags && item.hashtags.length > 0 ? (
            <div className="mt-2.5">
              <ContentHashtagChips tags={item.hashtags} size="md" />
            </div>
          ) : null}
        </div>
      </div>
    </StudioWrapperListRow>
  );
}

function ContentLibraryGridCell({
  item,
  labels,
  actionLabels,
  duplicateBusy,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  item: PublishableListItem;
  labels: {
    statusDraft: string;
    statusScheduled: string;
    statusPosted: string;
    statusArchived: string;
  };
  actionLabels: { edit: string; duplicate: string; archive: string; delete: string };
  duplicateBusy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const thumb = contentThumbUrl(item);
  const isReel = item.kind === "reel";
  const displayStatus = displayStatusFor(item);
  const statusLabel =
    displayStatus === "scheduled"
      ? labels.statusScheduled
      : displayStatus === "posted"
        ? labels.statusPosted
        : displayStatus === "archived"
          ? labels.statusArchived
          : labels.statusDraft;

  return (
    <li className="group relative aspect-square list-none overflow-hidden bg-[var(--studio-surface-3)]">
      <button
        type="button"
        onClick={onEdit}
        className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ice)]/55"
        aria-label={item.title}
      >
        {thumb ? (
          isReel ? (
            <video
              src={thumb}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--muted)]/55">—</div>
        )}
      </button>

      <span
        className={[
          "pointer-events-none absolute right-1.5 top-1.5 z-[1] inline-flex h-6 w-6 items-center justify-center rounded-md border shadow-[0_6px_16px_-10px_rgba(0,0,0,0.55)] backdrop-blur-md",
          isReel
            ? "border-[var(--ice)]/40 bg-[var(--ice)]/20 text-[var(--ice)]"
            : "border-white/25 bg-black/40 text-white/90",
        ].join(" ")}
        aria-hidden
      >
        {isReel ? (
          <Clapperboard className="h-3 w-3" strokeWidth={2.25} />
        ) : (
          <ImageIcon className="h-3 w-3" strokeWidth={2.25} />
        )}
      </span>

      <span
        className={[
          statusBadgeClass(displayStatus),
          "pointer-events-none absolute left-1.5 top-1.5 z-[1] max-w-[calc(100%-2.75rem)] truncate shadow-[0_6px_16px_-10px_rgba(0,0,0,0.45)] backdrop-blur-md",
        ].join(" ")}
        title={statusLabel}
      >
        {statusLabel}
      </span>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-2 p-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-white drop-shadow-sm sm:text-xs">
          {item.title}
        </p>
        <div className="hidden min-w-0 sm:block">
          <ContentTableActions
            iconsOnly
            labels={actionLabels}
            duplicateBusy={duplicateBusy}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </div>
      </div>
    </li>
  );
}

export function ContentView() {
  const { messages } = useI18n();
  const C = messages.studio.content;
  const E = C.errors;
  const D = C.dialogs;

  const [items, setItems] = useState<PublishableListItem[]>([]);
  const [rawItems, setRawItems] = useState<ContentApiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<ContentKindFilter>("all");
  const [layout, setLayout] = useState<ContentLayoutMode>("list");
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const editingItem = useMemo(
    () => (editingId ? rawItems.find((i) => i.id === editingId) ?? null : null),
    [editingId, rawItems],
  );

  useEffect(() => {
    setLayout(readStoredLayout());
  }, []);

  const handleLayoutChange = useCallback((next: ContentLayoutMode) => {
    setLayout(next);
    try {
      window.localStorage.setItem(CONTENT_LAYOUT_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { items: raw, unauthorized } = await fetchContents();
      if (unauthorized) {
        setError(E.signInToLoad);
        setItems([]);
        setRawItems([]);
        return;
      }
      setRawItems(raw);
      setItems(mapApiItemsToListItems(raw).filter((x) => x.kind === "post" || x.kind === "reel"));
    } catch (e) {
      setError(e instanceof Error ? e.message : E.loadFailed);
    }
  }, [E.loadFailed, E.signInToLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = () => void load();
    window.addEventListener(CONTENT_LIST_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONTENT_LIST_CHANGED_EVENT, handler);
  }, [load]);

  const sorted = useMemo(() => {
    const list =
      kindFilter === "all" ? items : items.filter((item) => item.kind === kindFilter);
    return list.slice().sort((a, b) => b.createdAt - a.createdAt);
  }, [items, kindFilter]);

  const emptyLabel =
    kindFilter === "post" ? C.noPosts : kindFilter === "reel" ? C.noReels : C.noItems;

  const filterLabels = useMemo(
    () => ({
      all: C.filterAll,
      posts: C.typePost,
      reels: C.typeReel,
      aria: C.filterAria,
    }),
    [C.filterAll, C.filterAria, C.typePost, C.typeReel],
  );

  const layoutLabels = useMemo(
    () => ({
      list: C.viewList,
      grid: C.viewGrid,
      aria: C.viewAria,
    }),
    [C.viewAria, C.viewGrid, C.viewList],
  );

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    setError(null);
    setEditingId(null);
    setComposerOpen(true);
  }, []);

  const openEdit = useCallback(
    async (id: string) => {
      setError(null);
      const found = rawItems.some((i) => i.id === id);
      if (!found) {
        try {
          const { items: raw, unauthorized } = await fetchContents();
          if (unauthorized) {
            setError(E.signInToEdit);
            return;
          }
          const item = raw.find((i) => i.id === id) ?? null;
          if (!item) {
            setError(E.couldNotOpenForEditing);
            return;
          }
          setRawItems(raw);
          setItems(mapApiItemsToListItems(raw).filter((x) => x.kind === "post" || x.kind === "reel"));
        } catch {
          setError(E.couldNotLoadContent);
          return;
        }
      }
      setEditingId(id);
      setComposerOpen(true);
    },
    [E.couldNotLoadContent, E.couldNotOpenForEditing, E.signInToEdit, rawItems],
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      const source = rawItems.find((i) => i.id === id);
      if (!source) {
        setError(E.couldNotLoadContent);
        return;
      }
      setDuplicatingId(id);
      setError(null);
      try {
        await duplicateContentAsDraft(source, `${source.title}${C.duplicateTitleSuffix}`);
        notifyContentListChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : E.duplicateFailed);
      } finally {
        setDuplicatingId(null);
      }
    },
    [C.duplicateTitleSuffix, E.couldNotLoadContent, E.duplicateFailed, rawItems],
  );

  const actionLabels = useMemo(
    () => ({
      edit: C.edit,
      duplicate: C.duplicate,
      archive: C.archive,
      delete: C.delete,
    }),
    [C.archive, C.delete, C.duplicate, C.edit],
  );

  const rowCopy = useMemo(
    () => ({
      typeReel: C.typeReel,
      typePost: C.typePost,
      typeEvent: C.typeEvent,
      statusDraft: C.statusDraft,
      statusScheduled: C.statusScheduled,
      statusPosted: C.statusPosted,
      statusArchived: C.statusArchived,
      tablePlatforms: C.tablePlatforms,
      tableScheduled: C.tableScheduled,
      tableCreated: C.tableCreated,
    }),
    [
      C.statusArchived,
      C.statusDraft,
      C.statusPosted,
      C.statusScheduled,
      C.tableCreated,
      C.tablePlatforms,
      C.tableScheduled,
      C.typeEvent,
      C.typePost,
      C.typeReel,
    ],
  );

  const platformLabels = useMemo((): ContentPlatformLabels => {
    const p = messages.studio.inbox.platform;
    return {
      youtube: p.youtube,
      tiktok: p.tiktok,
      instagram: p.instagram,
      facebook: p.facebook,
      pinterest: p.pinterest,
      linkedin: p.linkedin,
    };
  }, [messages]);

  return (
    <>
      <StudioCreateShell
        createLabel={formatStudioCreateCta(C.createCta, C.label)}
        onCreate={openCreate}
      >
        {error ? <div className="mb-3 text-sm font-semibold text-[var(--ember)]">{error}</div> : null}
        <StudioHeader
          label={C.library}
          title={C.allContent}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <ContentKindFilterBar value={kindFilter} onChange={setKindFilter} labels={filterLabels} />
              <ContentLayoutToggle value={layout} onChange={handleLayoutChange} labels={layoutLabels} />
            </div>
          }
        />

        <StudioWrapperList className={`${studioWrapperList.surfaceGrow} mt-4`}>
          <div className={`${studioWrapperList.tableScroll} p-0.5`}>
            {layout === "grid" ? (
              sorted.length === 0 ? (
                <StudioWrapperListBody as="ul" className="gap-2.5 sm:gap-3">
                  <StudioWrapperListRow as="li" empty className="px-4 py-12 text-sm">
                    {emptyLabel}
                  </StudioWrapperListRow>
                </StudioWrapperListBody>
              ) : (
                <ul className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl sm:gap-1">
                  {sorted.map((p) => (
                    <ContentLibraryGridCell
                      key={p.id}
                      item={p}
                      labels={rowCopy}
                      actionLabels={actionLabels}
                      duplicateBusy={duplicatingId === p.id}
                      onEdit={() => void openEdit(p.id)}
                      onDuplicate={() => void handleDuplicate(p.id)}
                      onArchive={() => setConfirmArchiveId(p.id)}
                      onDelete={() => setConfirmDeleteId(p.id)}
                    />
                  ))}
                </ul>
              )
            ) : (
              <StudioWrapperListBody as="ul" className="gap-2.5 sm:gap-3">
                {sorted.length === 0 ? (
                  <StudioWrapperListRow as="li" empty className="px-4 py-12 text-sm">
                    {emptyLabel}
                  </StudioWrapperListRow>
                ) : (
                  sorted.map((p) => (
                    <ContentLibraryRow
                      key={p.id}
                      item={p}
                      labels={rowCopy}
                      platformLabels={platformLabels}
                      actionLabels={actionLabels}
                      duplicateBusy={duplicatingId === p.id}
                      onEdit={() => void openEdit(p.id)}
                      onDuplicate={() => void handleDuplicate(p.id)}
                      onArchive={() => setConfirmArchiveId(p.id)}
                      onDelete={() => setConfirmDeleteId(p.id)}
                    />
                  ))
                )}
              </StudioWrapperListBody>
            )}
          </div>
        </StudioWrapperList>
      </StudioCreateShell>

      <ContentComposerModal
        open={composerOpen}
        allowedKinds={
          editingItem ? [contentKindFromApiType(editingItem.type)] : ["post", "reel"]
        }
        defaultKind={editingItem ? contentKindFromApiType(editingItem.type) : "post"}
        initialData={editingItem}
        title={C.composerTitle}
        subtitle={C.composerSubtitle}
        requireTime
        onClose={closeComposer}
        onCreatePost={async (payload) => {
          if (!payload.dateKey || !payload.time) {
            const msg = E.pickDateTime;
            setError(msg);
            throw new Error(msg);
          }
          try {
            if (payload.contentId) {
              await updateComposerPost(payload.contentId, {
                title: payload.title,
                text: payload.text,
                imageUrl: payload.imageUrl,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            } else {
              await saveComposerPost({
                title: payload.title,
                text: payload.text,
                imageUrl: payload.imageUrl,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : E.saveFailed;
            setError(msg);
            throw e instanceof Error ? e : new Error(msg);
          }
        }}
        onCreateReel={async (payload) => {
          if (!payload.videoUrl || !payload.dateKey) {
            const msg = !payload.videoUrl ? E.videoRequired : E.pickDate;
            setError(msg);
            throw new Error(msg);
          }
          try {
            if (payload.contentId) {
              await updateComposerReel(payload.contentId, {
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            } else {
              await saveComposerReel({
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : E.saveFailed;
            setError(msg);
            throw e instanceof Error ? e : new Error(msg);
          }
        }}
        onCreateEvent={async () => undefined}
      />

      <ConfirmDialog
        open={confirmArchiveId !== null}
        title={D.archiveTitle}
        message={D.archiveMessage}
        confirmLabel={D.archiveConfirm}
        variant="default"
        busy={actionBusy}
        onClose={() => !actionBusy && setConfirmArchiveId(null)}
        onConfirm={async () => {
          if (!confirmArchiveId) return;
          setActionBusy(true);
          setError(null);
          try {
            await updateContent(confirmArchiveId, { status: "ARCHIVED" });
            notifyContentListChanged();
            setConfirmArchiveId(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : E.archiveFailed);
          } finally {
            setActionBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={D.deleteTitle}
        message={D.deleteMessage}
        confirmLabel={D.deleteConfirm}
        variant="danger"
        busy={actionBusy}
        onClose={() => !actionBusy && setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          setActionBusy(true);
          setError(null);
          try {
            await deleteContent(confirmDeleteId);
            notifyContentListChanged();
            setConfirmDeleteId(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : E.deleteFailed);
          } finally {
            setActionBusy(false);
          }
        }}
      />
    </>
  );
}
