"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { addMonths, buildCalendarYearOptions, dateKeyLocal } from "@/components/calendar/dateUtils";
import type { CalendarEventsByDate, ScheduledPlanEventsByDate, ScheduledPostsByDate } from "@/components/calendar/types";
import { CalendarGrid, CALENDAR_DISPLAY_WEEK_ROWS } from "@/components/calendar/CalendarGrid";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ContentComposerModal } from "./ContentComposerModal";
import { CalendarDayPreviewPanel } from "./CalendarDayPreviewPanel";
import { CalendarMobileDeck } from "./CalendarMobileDeck";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";
import type { ContentApiItem } from "@/lib/contentApi";
import { CONTENT_LIST_CHANGED_EVENT, deleteContent, fetchContents, notifyContentListChanged, updateContent } from "@/lib/contentApi";
import {
  deleteEvent,
  EVENTS_LIST_CHANGED_EVENT,
  fetchEvents,
  notifyEventsListChanged,
  updateEvent,
  type EventApiItem,
} from "@/lib/eventsApi";
import { contentsToCalendarMaps, planEventsToCalendarMap } from "@/lib/contentMappers";
import {
  saveComposerEvent,
  saveComposerPost,
  saveComposerReel,
  updateComposerEvent,
  updateComposerPost,
  updateComposerReel,
} from "@/lib/saveComposerContent";
import { contentKindFromApiType } from "./ContentKindBadge";
import { formatStudioCreateCta, StudioCreateButton } from "./StudioCreateButton";
import { STUDIO_PHONE_MQ } from "../studioPhone";

export function CalendarView() {
  const { locale, messages } = useI18n();
  const C = messages.calendar;
  const S = messages.calendar.schedule;
  const CC = messages.studio.content;
  const CE = CC.errors;
  const CD = CC.dialogs;

  const [month, setMonth] = useState<Date>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [previewDayKey, setPreviewDayKey] = useState<string | null>(() => dateKeyLocal(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsByDate, setEventsByDate] = useState<CalendarEventsByDate>({});
  const [apiItems, setApiItems] = useState<ContentApiItem[]>([]);
  const [planEventItems, setPlanEventItems] = useState<EventApiItem[]>([]);
  const [editingItem, setEditingItem] = useState<ContentApiItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventApiItem | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(STUDIO_PHONE_MQ);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const selectedDayLabel = useMemo(() => {
    if (!previewDayKey) return S.dayPreviewPickDay;
    const d = new Date(`${previewDayKey}T12:00:00`);
    if (Number.isNaN(d.getTime())) return previewDayKey;
    return new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }, [previewDayKey, locale, S.dayPreviewPickDay]);

  const isSelectedToday = useMemo(() => {
    if (!previewDayKey) return false;
    return previewDayKey === dateKeyLocal(new Date(nowMs));
  }, [previewDayKey, nowMs]);

  const applyItems = useCallback((items: ContentApiItem[]) => {
    const { eventsByDate: ev } = contentsToCalendarMaps(items);
    setEventsByDate(ev);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [contentRes, eventsRes] = await Promise.all([fetchContents(), fetchEvents()]);
      if (contentRes.unauthorized || eventsRes.unauthorized) {
        setError(CE.signInToLoad);
        setEventsByDate({});
        setApiItems([]);
        setPlanEventItems([]);
        return;
      }
      setApiItems(contentRes.items);
      applyItems(contentRes.items);
      setPlanEventItems(eventsRes.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : CE.loadFailed);
    }
  }, [CE.loadFailed, CE.signInToLoad, applyItems]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = () => void load();
    window.addEventListener(CONTENT_LIST_CHANGED_EVENT, handler);
    window.addEventListener(EVENTS_LIST_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(CONTENT_LIST_CHANGED_EVENT, handler);
      window.removeEventListener(EVENTS_LIST_CHANGED_EVENT, handler);
    };
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!phone) return;
    const selected = previewDayKey ? new Date(`${previewDayKey}T12:00:00`) : null;
    const inMonth =
      selected &&
      !Number.isNaN(selected.getTime()) &&
      selected.getFullYear() === month.getFullYear() &&
      selected.getMonth() === month.getMonth();
    if (inMonth) return;
    const today = new Date(nowMs);
    if (today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth()) {
      setPreviewDayKey(dateKeyLocal(today));
      return;
    }
    setPreviewDayKey(dateKeyLocal(new Date(month.getFullYear(), month.getMonth(), 1)));
  }, [month, nowMs, phone, previewDayKey]);

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const label = fmt.format(new Date(2020, i, 1));
      const capital = label.charAt(0).toUpperCase() + label.slice(1);
      return { value: i, label: capital };
    });
  }, [locale]);

  const yearOptions = useMemo(() => buildCalendarYearOptions(), []);

  const postsByDate = useMemo(() => {
    const { scheduledPosts } = contentsToCalendarMaps(apiItems);
    const out: ScheduledPostsByDate = {};
    for (const p of scheduledPosts) {
      (out[p.dateKey] ??= []).push(p);
    }
    for (const key of Object.keys(out)) {
      out[key].sort((a, b) => (a.time === b.time ? a.createdAt - b.createdAt : a.time.localeCompare(b.time)));
    }
    return out;
  }, [apiItems]);

  const planEventsByDate = useMemo(() => {
    const planEvents = planEventsToCalendarMap(planEventItems);
    const out: ScheduledPlanEventsByDate = {};
    for (const e of planEvents) {
      (out[e.dateKey] ??= []).push(e);
    }
    for (const key of Object.keys(out)) {
      out[key].sort((a, b) => (a.time === b.time ? a.createdAt - b.createdAt : a.time.localeCompare(b.time)));
    }
    return out;
  }, [planEventItems]);

  const previewCanAdd = useMemo(() => {
    if (!previewDayKey) return false;
    const todayKey = dateKeyLocal(new Date(nowMs));
    return previewDayKey >= todayKey;
  }, [previewDayKey, nowMs]);

  const composerOpen = selectedDate !== null || editingItem !== null || editingEvent !== null;

  const closeComposer = useCallback(() => {
    setSelectedDate(null);
    setEditingItem(null);
    setEditingEvent(null);
  }, []);

  const openEditFromApi = useCallback(
    async (id: string) => {
      setError(null);

      const planEvent = planEventItems.find((x) => x.id === id) ?? null;
      if (planEvent) {
        setSelectedDate(null);
        setEditingItem(null);
        setEditingEvent(planEvent);
        return;
      }

      let item = apiItems.find((x) => x.id === id) ?? null;
      if (!item) {
        try {
          const [contentRes, eventsRes] = await Promise.all([fetchContents(), fetchEvents()]);
          if (contentRes.unauthorized || eventsRes.unauthorized) {
            setError(CE.signInToEdit);
            return;
          }
          setApiItems(contentRes.items);
          applyItems(contentRes.items);
          setPlanEventItems(eventsRes.items);

          const refreshedEvent = eventsRes.items.find((x) => x.id === id) ?? null;
          if (refreshedEvent) {
            setSelectedDate(null);
            setEditingItem(null);
            setEditingEvent(refreshedEvent);
            return;
          }

          item = contentRes.items.find((x) => x.id === id) ?? null;
          if (!item) {
            setError(CE.couldNotOpenForEditing);
            return;
          }
        } catch {
          setError(CE.couldNotLoadContent);
          return;
        }
      }
      setSelectedDate(null);
      setEditingEvent(null);
      setEditingItem(item);
    },
    [
      CE.couldNotLoadContent,
      CE.couldNotOpenForEditing,
      CE.signInToEdit,
      apiItems,
      planEventItems,
      applyItems,
    ],
  );

  const openAddForPreviewDay = useCallback(() => {
    if (!previewDayKey || !previewCanAdd) return;
    setError(null);
    setEditingItem(null);
    setEditingEvent(null);
    setSelectedDate(new Date(`${previewDayKey}T12:00:00`));
  }, [previewCanAdd, previewDayKey]);

  const isPlanEventId = useCallback(
    (id: string) => planEventItems.some((x) => x.id === id),
    [planEventItems],
  );

  return (
    <div className="studio-calendar">
      <div className="studio-calendar__shell">
        <header className="studio-calendar__toolbar">
          <div className="studio-calendar__head">
            <div className="studio-calendar__head-main">
              <p className="studio-calendar__eyebrow">{C.title}</p>
              <div className="studio-calendar__date-row">
                <h1 className="studio-calendar__selected-date">{selectedDayLabel}</h1>
                {isSelectedToday ? <span className="studio-calendar__today-pill">{C.today}</span> : null}
              </div>
            </div>
            {previewDayKey && previewCanAdd && !phone ? (
              <StudioCreateButton
                type="button"
                onClick={openAddForPreviewDay}
                className="studio-create-btn--toolbar shrink-0"
              >
                {formatStudioCreateCta(messages.studio.createCta, messages.studio.items.content.label)}
              </StudioCreateButton>
            ) : null}
          </div>

          {error ? <p className="studio-calendar__error">{error}</p> : null}

          {phone ? null : (
          <div className="studio-calendar__controls">
            <div className="studio-calendar__nav">
              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                className="studio-cal-btn studio-cal-btn--icon"
                aria-label={C.prevMonth}
              >
                <CaretLeftIcon className="h-5 w-5" weight="bold" aria-hidden />
              </button>

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2 sm:flex sm:flex-none sm:gap-2">
                <SelectMenu
                  variant="studio"
                  label={C.month}
                  value={month.getMonth()}
                  options={monthOptions}
                  widthClassName="w-full min-w-0 lg:min-w-[8.5rem] lg:max-w-[9.25rem]"
                  triggerClassName="studio-cal-select__trigger--month"
                  onChange={(mm) => setMonth((prev) => new Date(prev.getFullYear(), Number(mm), 1))}
                />
                <SelectMenu
                  variant="studio"
                  label={C.year}
                  value={month.getFullYear()}
                  options={yearOptions}
                  widthClassName="w-full min-w-0 lg:min-w-[7rem]"
                  triggerClassName="studio-cal-select__trigger--year"
                  onChange={(yy) => setMonth((prev) => new Date(Number(yy), prev.getMonth(), 1))}
                />
              </div>

              <button
                type="button"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="studio-cal-btn studio-cal-btn--icon"
                aria-label={C.nextMonth}
              >
                <CaretRightIcon className="h-5 w-5" weight="bold" aria-hidden />
              </button>
            </div>
          </div>
          )}
        </header>

        {phone ? (
          <CalendarMobileDeck
            month={month}
            onMonthChange={setMonth}
            previewDayKey={previewDayKey}
            onSelectDay={setPreviewDayKey}
            items={apiItems}
            events={planEventItems}
            postsByDate={postsByDate}
            planEventsByDate={planEventsByDate}
            nowMs={nowMs}
            canAdd={previewCanAdd}
            onAdd={openAddForPreviewDay}
            onSelectItem={(id) => void openEditFromApi(id)}
          />
        ) : (
        <div className="studio-calendar__body">
          <div className="studio-calendar__grid-pane">
            <div className="studio-calendar__grid-card">
              <CalendarGrid
                className="flex-1"
                embedded
                fixedWeekRows={CALENDAR_DISPLAY_WEEK_ROWS}
                month={month}
                eventsByDate={eventsByDate}
                postsByDate={postsByDate}
                planEventsByDate={planEventsByDate}
                nowMs={nowMs}
                selectedDayKey={previewDayKey}
                onSelectDate={(d) => setPreviewDayKey(dateKeyLocal(d))}
              />
            </div>
          </div>

          <CalendarDayPreviewPanel
            className="studio-calendar__preview-pane"
            variant="studio-sidebar"
            showCreateButton={false}
            dayKey={previewDayKey}
            items={apiItems}
            events={planEventItems}
            canAdd={previewCanAdd}
            createLabel={formatStudioCreateCta(messages.studio.createCta, messages.studio.items.content.label)}
            onSelectItem={(id) => void openEditFromApi(id)}
            onAdd={openAddForPreviewDay}
          />
        </div>
        )}
      </div>

      <ContentComposerModal
        open={composerOpen}
        allowedKinds={
          editingEvent
            ? ["event"]
            : editingItem
              ? [contentKindFromApiType(editingItem.type)]
              : ["post", "reel", "event"]
        }
        defaultKind={
          editingEvent ? "event" : editingItem ? contentKindFromApiType(editingItem.type) : "post"
        }
        initialData={editingItem}
        initialEvent={editingEvent}
        title={CC.composerTitle}
        subtitle={CC.composerSubtitle}
        date={editingItem || editingEvent ? null : selectedDate}
        requireTime
        onClose={closeComposer}
        onCreatePost={async (payload) => {
          if (!payload.dateKey || !payload.time) {
            const msg = CE.pickDateTime;
            setError(msg);
            throw new Error(msg);
          }
          try {
            if (payload.contentId) {
              await updateComposerPost(payload.contentId, {
                title: payload.title,
                text: payload.text,
                imageUrl: payload.imageUrl,
                imageMediaId: payload.imageMediaId,
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
                imageMediaId: payload.imageMediaId,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : CE.saveFailed;
            setError(msg);
            throw e instanceof Error ? e : new Error(msg);
          }
        }}
        onCreateReel={async (payload) => {
          if (!payload.videoUrl || !payload.dateKey) {
            const msg = !payload.videoUrl ? CE.videoRequired : CE.pickDate;
            setError(msg);
            throw new Error(msg);
          }
          try {
            if (payload.contentId) {
              await updateComposerReel(payload.contentId, {
                title: payload.title,
                description: payload.description,
                videoUrl: payload.videoUrl,
                videoMediaId: payload.videoMediaId,
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
                videoMediaId: payload.videoMediaId,
                hashtags: payload.hashtags,
                dateKey: payload.dateKey,
                time: payload.time,
                publish: payload.publish,
              });
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : CE.saveFailed;
            setError(msg);
            throw e instanceof Error ? e : new Error(msg);
          }
        }}
        onCreateEvent={async (payload) => {
          if (!payload.dateKey || !payload.time) {
            const msg = CE.pickDateTime;
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
            const msg = e instanceof Error ? e.message : CE.saveFailed;
            setError(msg);
            throw e instanceof Error ? e : new Error(msg);
          }
        }}
      />

      <ConfirmDialog
        open={confirmArchiveId !== null}
        title={CD.archiveTitle}
        message={CD.archiveMessage}
        confirmLabel={CD.archiveConfirm}
        variant="default"
        busy={actionBusy}
        onClose={() => !actionBusy && setConfirmArchiveId(null)}
        onConfirm={async () => {
          if (!confirmArchiveId) return;
          setActionBusy(true);
          setError(null);
          try {
            if (isPlanEventId(confirmArchiveId)) {
              await updateEvent(confirmArchiveId, { archived: true });
              notifyEventsListChanged();
            } else {
              await updateContent(confirmArchiveId, { status: "ARCHIVED" });
              notifyContentListChanged();
            }
            setConfirmArchiveId(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : CE.archiveFailed);
          } finally {
            setActionBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={CD.deleteTitle}
        message={CD.deleteMessage}
        confirmLabel={CD.deleteConfirm}
        variant="danger"
        busy={actionBusy}
        onClose={() => !actionBusy && setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          setActionBusy(true);
          setError(null);
          try {
            if (isPlanEventId(confirmDeleteId)) {
              await deleteEvent(confirmDeleteId);
              notifyEventsListChanged();
            } else {
              await deleteContent(confirmDeleteId);
              notifyContentListChanged();
            }
            setConfirmDeleteId(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : CE.deleteFailed);
          } finally {
            setActionBusy(false);
          }
        }}
      />
    </div>
  );
}
