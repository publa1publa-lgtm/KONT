"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useI18n } from "@/contexts/i18n-context";
import {
  deleteEvent,
  EVENTS_LIST_CHANGED_EVENT,
  fetchEvents,
  notifyEventsListChanged,
  updateEvent,
  type EventApiItem,
} from "@/lib/eventsApi";
import type { EventListItem } from "@/lib/contentMappers";
import { eventApiToListItem } from "@/lib/contentMappers";
import { saveComposerEvent, updateComposerEvent } from "@/lib/saveComposerContent";
import { ContentComposerModal } from "./ContentComposerModal";
import { ContentTableActions } from "./ContentTableActions";
import { EventPreviewCard } from "./EventPreviewCard";
import { formatStudioCreateCta, StudioCreateShell } from "./StudioCreateShell";
import { StudioHeader } from "./StudioHeader";
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow } from "./StudioWrapperList";

export function EventsView() {
  const { messages } = useI18n();
  const C = messages.studio.content;
  const E = C.errors;
  const D = C.dialogs;
  const itemsCopy = messages.studio.items.events;
  const detailCopy = messages.studio.itemDetails.events;

  const [items, setItems] = useState<EventListItem[]>([]);
  const [rawItems, setRawItems] = useState<EventApiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const editingItem = useMemo(
    () => (editingId ? rawItems.find((x) => x.id === editingId) ?? null : null),
    [editingId, rawItems],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const { items: raw, unauthorized } = await fetchEvents();
      if (unauthorized) {
        setError(E.signInToLoad);
        setItems([]);
        setRawItems([]);
        return;
      }
      setRawItems(raw);
      setItems(raw.map(eventApiToListItem));
    } catch (e) {
      setError(e instanceof Error ? e.message : E.loadFailed);
    }
  }, [E.loadFailed, E.signInToLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = () => void load();
    window.addEventListener(EVENTS_LIST_CHANGED_EVENT, handler);
    return () => window.removeEventListener(EVENTS_LIST_CHANGED_EVENT, handler);
  }, [load]);

  const sorted = useMemo(() => {
    return items.slice().sort((a, b) => {
      const ak = `${a.dateKey ?? ""}T${a.time ?? ""}`;
      const bk = `${b.dateKey ?? ""}T${b.time ?? ""}`;
      if (ak && bk && ak !== bk) return ak.localeCompare(bk);
      return b.createdAt - a.createdAt;
    });
  }, [items]);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setEditingId(null);
  }, []);

  const actionLabels = {
    edit: C.edit,
    duplicate: C.duplicate,
    archive: C.archive,
    delete: C.delete,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioCreateShell
        createLabel={formatStudioCreateCta(messages.studio.createCta, itemsCopy.label)}
        onCreate={() => {
          setError(null);
          setEditingId(null);
          setComposerOpen(true);
        }}
      >
        {error ? <div className="mb-3 text-sm font-semibold text-[var(--ember)]">{error}</div> : null}
        <StudioHeader label={itemsCopy.label} title={itemsCopy.label} />
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{detailCopy.body}</p>

        <StudioWrapperList className="mt-4">
          <StudioWrapperListBody as="ul">
            {sorted.length === 0 ? (
              <StudioWrapperListRow as="li" empty className="px-4 py-10 text-sm">
                {detailCopy.body}
              </StudioWrapperListRow>
            ) : (
              sorted.map((item) => (
                <StudioWrapperListRow as="li" key={item.id} className="overflow-hidden p-0">
                  <EventPreviewCard
                    title={item.title}
                    time={item.time}
                    dateKey={item.dateKey}
                    description={item.description}
                    showDescription={item.showDescription}
                    color={item.color}
                    eventLabel={C.typeEvent}
                    className="rounded-[0.85rem] border-0 shadow-none"
                    trailing={
                      <ContentTableActions
                        iconsOnly
                        labels={actionLabels}
                        duplicateBusy={false}
                        onEdit={() => {
                          setEditingId(item.id);
                          setComposerOpen(true);
                        }}
                        onDuplicate={() => undefined}
                        onArchive={() => setConfirmArchiveId(item.id)}
                        onDelete={() => setConfirmDeleteId(item.id)}
                      />
                    }
                  />
                </StudioWrapperListRow>
              ))
            )}
          </StudioWrapperListBody>
        </StudioWrapperList>
      </StudioCreateShell>

      <ContentComposerModal
        open={composerOpen}
        allowedKinds={["event"]}
        defaultKind="event"
        initialEvent={editingItem}
        title={itemsCopy.label}
        subtitle={itemsCopy.hint}
        requireTime
        onClose={closeComposer}
        onCreatePost={async () => undefined}
        onCreateReel={async () => undefined}
        onCreateEvent={async (payload) => {
          if (!payload.dateKey || !payload.time) {
            const msg = E.pickDateTime;
            setError(msg);
            throw new Error(msg);
          }
          try {
            if (payload.contentId) {
              await updateComposerEvent(payload.contentId, {
                title: payload.title,
                description: payload.description,
                showDescription: payload.showDescription,
                color: payload.color,
                dateKey: payload.dateKey,
                time: payload.time,
              });
            } else {
              await saveComposerEvent({
                title: payload.title,
                description: payload.description,
                showDescription: payload.showDescription,
                color: payload.color,
                dateKey: payload.dateKey,
                time: payload.time,
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
            await updateEvent(confirmArchiveId, { archived: true });
            notifyEventsListChanged();
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
            await deleteEvent(confirmDeleteId);
            notifyEventsListChanged();
            setConfirmDeleteId(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : E.deleteFailed);
          } finally {
            setActionBusy(false);
          }
        }}
      />
    </div>
  );
}
