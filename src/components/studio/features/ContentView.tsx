"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { useI18n } from "@/contexts/i18n-context";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ContentComposerModal } from "./ContentComposerModal";
import { ContentTableActions } from "./ContentTableActions";
import { ContentHashtagChips } from "./ContentHashtagChips";
import { ContentKindBadge } from "./ContentKindBadge";
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

type TableDateParts = { date: string; time: string; iso: string; title: string };

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

function tableScheduledParts(p: ContentListItem, locale: AppLocale): TableDateParts | null {
  if (!p.dateKey || !p.time) return null;
  const [y, mo, d] = p.dateKey.split("-").map(Number);
  const [hh, mm] = p.time.split(":").map(Number);
  if (![y, mo, d, hh, mm].every(Number.isFinite)) return null;
  return tableDatePartsFromMs(new Date(y, mo - 1, d, hh, mm, 0, 0).getTime(), locale);
}

const tableTh = `${studioWrapperList.th} px-2 py-2.5 text-center align-middle font-display font-semibold tracking-[0.14em]`;
const tableDataCell = `${studioWrapperList.td} min-w-0 overflow-hidden px-2 py-2.5 text-center align-middle`;
const tableDateTd = `${studioWrapperList.td} min-w-0 overflow-hidden px-1.5 py-2.5 text-center align-middle`;
const tableTypeCell = `${studioWrapperList.td} whitespace-nowrap px-2 py-2.5 align-middle`;
const tableTitleCell = `${studioWrapperList.td} min-w-0 overflow-hidden px-3 py-2.5 text-start align-middle`;
const tablePlatformsCell = `${studioWrapperList.td} min-w-0 overflow-hidden px-2 py-2.5 text-center align-middle`;
const tableHashtagsCell = `${studioWrapperList.td} relative z-[1] min-w-0 overflow-hidden px-2.5 py-2.5 text-center align-middle`;
/** Fits icons-only toolbar (4×32px + divider + padding). */
const tableActionsColWidth = "9.5rem";
const tableActionsTh = `${studioWrapperList.th} whitespace-nowrap px-1.5 py-2.5 text-center align-middle font-display font-semibold tracking-[0.14em]`;
const tableActionsCell = `${studioWrapperList.td} relative z-[1] overflow-visible whitespace-nowrap px-1.5 py-2.5 text-end align-middle`;
function contentExcerpt(p: ContentListItem): string | null {
  const text = p.kind === "post" ? p.text : p.description;
  const trimmed = text?.trim();
  return trimmed || null;
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TableDateTime({
  scheduled,
  createdAt,
  align = "center",
}: {
  scheduled?: ContentListItem;
  createdAt?: number;
  align?: "center" | "start";
}) {
  const { locale } = useI18n();
  const parts = scheduled ? tableScheduledParts(scheduled, locale) : createdAt != null ? tableDatePartsFromMs(createdAt, locale) : null;
  const variant = scheduled ? "scheduled" : "created";

  const alignClass = align === "center" ? "items-center text-center" : "items-start text-start";

  if (!parts) {
    return (
      <span className={["block text-[11px] text-[var(--muted)]/50", align === "center" ? "text-center" : "text-start"].join(" ")}>
        —
      </span>
    );
  }

  const timeClass =
    variant === "scheduled"
      ? "font-mono text-[10px] font-medium tabular-nums leading-none text-[var(--ice)]"
      : "font-mono text-[10px] tabular-nums leading-none text-[var(--muted)]";

  return (
    <time
      dateTime={parts.iso}
      title={parts.title}
      className={["flex flex-col gap-0.5 leading-none", alignClass].join(" ")}
    >
      <span className="text-[11px] font-medium tabular-nums text-[var(--fg)]">{parts.date}</span>
      <span className={timeClass}>{parts.time}</span>
    </time>
  );
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  const base =
    "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide";
  if (s === "SCHEDULED") {
    return `${base} border-[var(--ice)]/35 bg-[var(--ice)]/12 text-[var(--ice)]`;
  }
  if (s === "READY" || s === "PUBLISHED") {
    return `${base} border-[var(--ice)]/22 bg-[var(--ice)]/6 text-[var(--ice)]`;
  }
  if (s === "ARCHIVED") {
    return `${base} border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--muted)]`;
  }
  if (s === "DRAFT") {
    return `${base} border-[var(--ember)]/25 bg-[var(--ember)]/10 text-[var(--ember)]`;
  }
  return `${base} border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)]/80`;
}

export function ContentView() {
  const { messages } = useI18n();
  const C = messages.studio.content;
  const E = C.errors;
  const D = C.dialogs;

  const [items, setItems] = useState<ContentListItem[]>([]);
  const [rawItems, setRawItems] = useState<ContentApiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      setItems(mapApiItemsToListItems(raw));
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

  const sorted = useMemo(() => items.slice().sort((a, b) => b.createdAt - a.createdAt), [items]);

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
          setItems(mapApiItemsToListItems(raw));
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
        <StudioHeader label={C.library} title={C.allContent} />

          {/* Mobile / tablet: stacked cards */}
          <StudioWrapperList className="mt-4 lg:hidden">
            <StudioWrapperListBody as="ul">
              {sorted.length === 0 ? (
                <StudioWrapperListRow as="li" empty className="px-4 py-10 text-sm">
                  {C.noItems}
                </StudioWrapperListRow>
              ) : (
                sorted.map((p) => (
                  <StudioWrapperListRow as="li" key={p.id} className="p-4">
                  <div className="flex min-w-0 items-start gap-2">
                    <ContentKindBadge kind={p.kind} reelLabel={C.typeReel} postLabel={C.typePost} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold leading-snug text-[var(--fg)]">{p.title}</h3>
                      {contentExcerpt(p) ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{contentExcerpt(p)}</p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{C.tablePlatforms}</dt>
                      <dd className="mt-1.5">
                        <ContentPlatformIcons platforms={p.platforms} labels={platformLabels} />
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{C.tableStatus}</dt>
                      <dd className="mt-1">
                        <span className={statusBadgeClass(p.status)} title={formatStatusLabel(p.status)}>
                          {formatStatusLabel(p.status)}
                        </span>
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{C.tableScheduled}</dt>
                      <dd className="mt-1">
                        <TableDateTime scheduled={p} align="start" />
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{C.tableCreated}</dt>
                      <dd className="mt-1">
                        <TableDateTime createdAt={p.createdAt} align="start" />
                      </dd>
                    </div>
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-center font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{C.tableHashtags}</dt>
                      <dd className="mt-1.5">
                        <ContentHashtagChips tags={p.hashtags} size="md" center />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex justify-end border-t border-[var(--line)]/60 pt-3">
                    <ContentTableActions
                      labels={actionLabels}
                      duplicateBusy={duplicatingId === p.id}
                      onEdit={() => void openEdit(p.id)}
                      onDuplicate={() => void handleDuplicate(p.id)}
                      onArchive={() => setConfirmArchiveId(p.id)}
                      onDelete={() => setConfirmDeleteId(p.id)}
                    />
                  </div>
                  </StudioWrapperListRow>
                ))
              )}
            </StudioWrapperListBody>
          </StudioWrapperList>

          {/* Desktop: table fills remaining studio height; body scrolls inside */}
          <StudioWrapperList className={`${studioWrapperList.surfaceGrow} mt-4 hidden lg:flex`}>
            <div className={studioWrapperList.tableScroll}>
              <table className={studioWrapperList.table}>
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "29%" }} />
                  <col style={{ width: tableActionsColWidth }} />
                </colgroup>
                <thead className={studioWrapperList.thead}>
                  <tr>
                    <th className={tableTh}>{C.tableType}</th>
                    <th className={tableTh}>{C.tableTitle}</th>
                    <th className={tableTh}>{C.tablePlatforms}</th>
                    <th className={tableTh}>{C.tableStatus}</th>
                    <th className={tableTh}>{C.tableScheduled}</th>
                    <th className={tableTh}>{C.tableCreated}</th>
                    <th className={tableTh}>{C.tableHashtags}</th>
                    <th className={tableActionsTh} scope="col">
                      {C.tableActions}
                    </th>
                  </tr>
                </thead>
                <tbody className={studioWrapperList.tbody}>
                  {sorted.length === 0 ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-[var(--st-muted)]" colSpan={8}>
                        {C.noItems}
                      </td>
                    </tr>
                  ) : (
                    sorted.map((p) => (
                      <tr key={p.id} className={studioWrapperList.tr}>
                          <td className={tableTypeCell}>
                            <div className="flex w-full justify-center">
                              <ContentKindBadge
                                kind={p.kind}
                                reelLabel={C.typeReel}
                                postLabel={C.typePost}
                                align="center"
                              />
                            </div>
                          </td>
                          <td className={tableTitleCell}>
                            <div
                              className="min-w-0 max-w-full truncate text-[13px] font-medium leading-snug text-[var(--fg)]"
                              title={p.title}
                            >
                              {p.title}
                            </div>
                          </td>
                          <td className={tablePlatformsCell}>
                            <ContentPlatformIcons platforms={p.platforms} labels={platformLabels} />
                          </td>
                          <td className={tableDataCell}>
                            <span className={statusBadgeClass(p.status)} title={formatStatusLabel(p.status)}>
                              {formatStatusLabel(p.status)}
                            </span>
                          </td>
                          <td className={tableDateTd}>
                            <TableDateTime scheduled={p} />
                          </td>
                          <td className={tableDateTd}>
                            <TableDateTime createdAt={p.createdAt} />
                          </td>
                          <td className={tableHashtagsCell}>
                            <ContentHashtagChips tags={p.hashtags} maxLines={1} center />
                          </td>
                          <td className={tableActionsCell}>
                            <ContentTableActions
                              iconsOnly
                              labels={actionLabels}
                              duplicateBusy={duplicatingId === p.id}
                              onEdit={() => void openEdit(p.id)}
                              onDuplicate={() => void handleDuplicate(p.id)}
                              onArchive={() => setConfirmArchiveId(p.id)}
                              onDelete={() => setConfirmDeleteId(p.id)}
                            />
                          </td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </StudioWrapperList>
      </StudioCreateShell>

      <ContentComposerModal
        open={composerOpen}
        allowedKinds={
          editingItem ? [String(editingItem.type).toUpperCase() === "REEL" ? "reel" : "post"] : ["post", "reel"]
        }
        defaultKind={editingItem ? (String(editingItem.type).toUpperCase() === "REEL" ? "reel" : "post") : "post"}
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
