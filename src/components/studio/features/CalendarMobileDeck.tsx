"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { addMonths, buildCalendarYearOptions, dateKeyLocal, endOfMonth, startOfMonth } from "@/components/calendar/dateUtils";
import type { ScheduledPlanEventsByDate, ScheduledPostsByDate } from "@/components/calendar/types";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";
import { SelectMenu } from "@/components/ui/SelectMenu";
import type { ContentApiItem } from "@/lib/contentApi";
import type { EventApiItem } from "@/lib/eventsApi";
import { scheduledAtToDateKeyAndTime } from "@/lib/contentMappers";
import { ContentKindBadge, contentKindFromApiType } from "./ContentKindBadge";
import { EventPreviewCard } from "./EventPreviewCard";
import { getCalendarDayItems } from "./CalendarDayPreviewPanel";
import { formatStudioCreateCta, StudioCreateButton } from "./StudioCreateButton";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "studio-status--draft" },
  READY: { label: "Ready", cls: "studio-status--ready" },
  SCHEDULED: { label: "Scheduled", cls: "studio-status--scheduled" },
  PUBLISHING: { label: "Publishing", cls: "studio-status--publishing" },
  PUBLISHED: { label: "Published", cls: "studio-status--published" },
  ARCHIVED: { label: "Archived", cls: "studio-status--archived" },
};

function ContentStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status];
  if (!s) return null;
  return <span className={`studio-status ${s.cls}`}>{s.label}</span>;
}

type CalendarMobileDeckProps = {
  month: Date;
  onMonthChange: (next: Date) => void;
  previewDayKey: string | null;
  onSelectDay: (key: string) => void;
  items: ContentApiItem[];
  events: EventApiItem[];
  postsByDate: ScheduledPostsByDate;
  planEventsByDate: ScheduledPlanEventsByDate;
  nowMs: number;
  canAdd: boolean;
  onAdd: () => void;
  onSelectItem: (id: string) => void;
};

function daysInMonth(month: Date): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days: Date[] = [];
  for (let day = 1; day <= end.getDate(); day++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), day));
  }
  return days;
}

export function CalendarMobileDeck({
  month,
  onMonthChange,
  previewDayKey,
  onSelectDay,
  items,
  events,
  postsByDate,
  planEventsByDate,
  nowMs,
  canAdd,
  onAdd,
  onSelectItem,
}: CalendarMobileDeckProps) {
  const { locale, messages } = useI18n();
  const C = messages.calendar;
  const S = messages.calendar.schedule;
  const CC = messages.studio.content;
  const datesRef = useRef<HTMLDivElement>(null);
  const todayKey = dateKeyLocal(new Date(nowMs));

  const days = useMemo(() => daysInMonth(month), [month]);

  const monthLabel = useMemo(() => {
    const raw = new Intl.DateTimeFormat(intlLocale(locale), { month: "long", year: "numeric" }).format(month);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [locale, month]);

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const label = fmt.format(new Date(2020, i, 1));
      return { value: i, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });
  }, [locale]);

  const yearOptions = useMemo(() => buildCalendarYearOptions(), []);

  const [pickerOpen, setPickerOpen] = useState(false);

  const weekdayFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short" }),
    [locale],
  );

  const dayItems = useMemo(
    () => getCalendarDayItems(previewDayKey, items, events),
    [previewDayKey, items, events],
  );

  useEffect(() => {
    if (!previewDayKey || !datesRef.current) return;
    const rail = datesRef.current;
    const node = rail.querySelector<HTMLElement>(`[data-day-key="${previewDayKey}"]`);
    if (!node) return;
    const left = node.offsetLeft - rail.clientWidth / 2 + node.offsetWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [previewDayKey, month]);

  function countForDay(key: string) {
    return (postsByDate[key]?.length ?? 0) + (planEventsByDate[key]?.length ?? 0);
  }

  return (
    <div className="studio-cal-deck">
      <div className="studio-cal-deck__month">
        <button
          type="button"
          className="studio-cal-btn studio-cal-btn--icon"
          aria-label={C.prevMonth}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <CaretLeftIcon className="h-5 w-5" weight="bold" aria-hidden />
        </button>

        <button
          type="button"
          className="studio-cal-deck__month-label"
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
        >
          {monthLabel}
          <span className={`ml-1.5 inline-block text-[0.65rem] opacity-50 transition ${pickerOpen ? "rotate-180" : ""}`} aria-hidden>▾</span>
        </button>

        <button
          type="button"
          className="studio-cal-btn studio-cal-btn--icon"
          aria-label={C.nextMonth}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <CaretRightIcon className="h-5 w-5" weight="bold" aria-hidden />
        </button>
      </div>

      {pickerOpen && (
        <div className="studio-cal-deck__picker">
          <SelectMenu
            variant="studio"
            label={C.month}
            value={month.getMonth()}
            options={monthOptions}
            widthClassName="flex-1 min-w-0"
            onChange={(mm) => {
              onMonthChange(new Date(month.getFullYear(), Number(mm), 1));
              setPickerOpen(false);
            }}
          />
          <SelectMenu
            variant="studio"
            label={C.year}
            value={month.getFullYear()}
            options={yearOptions}
            widthClassName="w-[6.5rem]"
            onChange={(yy) => {
              onMonthChange(new Date(Number(yy), month.getMonth(), 1));
              setPickerOpen(false);
            }}
          />
        </div>
      )}

      <div ref={datesRef} className="studio-cal-deck__dates" role="listbox" aria-label={C.title}>
        {days.map((day) => {
          const key = dateKeyLocal(day);
          const selected = key === previewDayKey;
          const isToday = key === todayKey;
          const count = countForDay(key);
          const weekday = weekdayFmt.format(day).replace(".", "");
          return (
            <button
              key={key}
              type="button"
              role="option"
              data-day-key={key}
              aria-selected={selected}
              aria-label={key}
              className={[
                "studio-cal-deck__day",
                selected ? "is-selected" : "",
                isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(key)}
            >
              <span className="studio-cal-deck__day-week">{weekday.slice(0, 2)}</span>
              <span className="studio-cal-deck__day-num">{day.getDate()}</span>
              <span className="studio-cal-deck__day-dots" aria-hidden>
                {count > 0 ? <span className="studio-cal-deck__dot" /> : <span className="studio-cal-deck__dot is-empty" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="studio-cal-deck__content-head">
        <p className="studio-cal-deck__content-meta">
          {!previewDayKey
            ? S.dayPreviewPickDayHint
            : dayItems.length === 0
              ? S.dayPreviewEmpty
              : S.dayPreviewCount.replace("{count}", String(dayItems.length))}
        </p>
        {previewDayKey && canAdd ? (
          <StudioCreateButton type="button" onClick={onAdd} className="studio-create-btn--toolbar">
            {formatStudioCreateCta(messages.studio.createCta, messages.studio.items.content.label)}
          </StudioCreateButton>
        ) : null}
      </div>

      <div key={previewDayKey ?? "none"} className="studio-cal-deck__content">
        {!previewDayKey || dayItems.length === 0 ? (
          <div className="studio-cal-deck__empty">
            <p>{previewDayKey ? S.dayPreviewEmpty : S.dayPreviewPickDayHint}</p>
          </div>
        ) : (
          dayItems.map((item) => (
            <DeckCard
              key={item.id}
              item={item}
              reelLabel={CC.typeReel}
              postLabel={CC.typePost}
              eventLabel={CC.typeEvent}
              onSelect={() => onSelectItem(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DeckCard({
  item,
  reelLabel,
  postLabel,
  eventLabel,
  onSelect,
}: {
  item: ContentApiItem | EventApiItem;
  reelLabel: string;
  postLabel: string;
  eventLabel: string;
  onSelect: () => void;
}) {
  if (!("type" in item)) {
    const slot = scheduledAtToDateKeyAndTime(item.scheduledAt);
    return (
      <div className="studio-cal-deck__slide">
        <EventPreviewCard
          title={item.title}
          time={slot?.time}
          description={item.description}
          showDescription={item.showDescription}
          color={item.color}
          eventLabel={eventLabel}
          onClick={onSelect}
          className="h-full min-h-0"
        />
      </div>
    );
  }

  const kind = contentKindFromApiType(item.type);
  const isReel = kind === "reel";
  const slot = item.scheduledAt ? scheduledAtToDateKeyAndTime(item.scheduledAt) : null;
  const mediaUrl = isReel ? item.videoUrl : item.imageUrl;
  const text = (isReel ? item.description : item.text)?.trim() ?? "";

  return (
    <button type="button" onClick={onSelect} className="studio-cal-deck__slide studio-cal-deck__slide--media">
      <div className="studio-cal-deck__media">
        {mediaUrl ? (
          isReel ? (
            <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="studio-cal-deck__media-empty">—</div>
        )}
        <div className="studio-cal-deck__media-top">
          <ContentKindBadge kind={kind} reelLabel={reelLabel} postLabel={postLabel} eventLabel={eventLabel} />
          {slot?.time ? <span className="studio-cal-preview__time">{slot.time}</span> : null}
        </div>
      </div>
      <div className="studio-cal-deck__slide-copy">
        <p className="studio-cal-deck__slide-title">{item.title}</p>
        {text ? <p className="studio-cal-deck__slide-text">{text}</p> : null}
        <ContentStatusBadge status={item.status} />
      </div>
    </button>
  );
}
