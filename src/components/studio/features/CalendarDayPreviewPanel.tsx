"use client";

import { useMemo } from "react";
import { scheduledAtToDateKeyAndTime } from "@/lib/contentMappers";
import type { ContentApiItem } from "@/lib/contentApi";
import type { EventApiItem } from "@/lib/eventsApi";
import { ContentKindBadge, contentKindFromApiType } from "./ContentKindBadge";
import { EventPreviewCard } from "./EventPreviewCard";
import { StudioCreateButton } from "./StudioCreateButton";
import { useI18n } from "@/contexts/i18n-context";
import { intlLocale } from "@/i18n/config";

function excerpt(text: string | null | undefined, max = 56): string | null {
  const t = text?.trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type DayPreviewItem = ContentApiItem | EventApiItem;

function isPlanEventItem(item: DayPreviewItem): item is EventApiItem {
  return !("type" in item);
}

type CalendarDayPreviewPanelProps = {
  dayKey: string | null;
  items: ContentApiItem[];
  events?: EventApiItem[];
  canAdd: boolean;
  onSelectItem: (id: string) => void;
  onAdd: () => void;
  createLabel: string;
  className?: string;
  variant?: "banner" | "sidebar" | "studio-toolbar" | "studio-sidebar";
  /** studio-toolbar: hide horizontal card strip when list lives in sidebar */
  showItemList?: boolean;
  showCreateButton?: boolean;
  showMeta?: boolean;
};

export function CalendarDayPreviewPanel({
  dayKey,
  items,
  events = [],
  canAdd,
  onSelectItem,
  onAdd,
  createLabel,
  className = "",
  variant = "sidebar",
  showItemList = true,
  showCreateButton = true,
  showMeta = true,
}: CalendarDayPreviewPanelProps) {
  const { locale, messages } = useI18n();
  const S = messages.calendar.schedule;
  const CC = messages.studio.content;
  const isBanner = variant === "banner";
  const isStudioToolbar = variant === "studio-toolbar";
  const isStudioSidebar = variant === "studio-sidebar";

  const dayItems = useMemo(() => {
    if (!dayKey) return [] as DayPreviewItem[];
    const contentForDay = items.filter((c) => {
      if (c.status === "ARCHIVED" || !c.scheduledAt) return false;
      const slot = scheduledAtToDateKeyAndTime(c.scheduledAt);
      return slot?.dateKey === dayKey;
    });
    const eventsForDay = events.filter((e) => {
      if (e.archivedAt) return false;
      const slot = scheduledAtToDateKeyAndTime(e.scheduledAt);
      return slot?.dateKey === dayKey;
    });
    const merged: DayPreviewItem[] = [...contentForDay, ...eventsForDay];
    merged.sort((a, b) => {
      const sa = scheduledAtToDateKeyAndTime(a.scheduledAt!)!;
      const sb = scheduledAtToDateKeyAndTime(b.scheduledAt!)!;
      if (sa.time !== sb.time) return sa.time.localeCompare(sb.time);
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return merged;
  }, [dayKey, items, events]);

  const dayLabel = useMemo(() => {
    if (!dayKey) return null;
    const d = new Date(`${dayKey}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dayKey;
    return new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
  }, [dayKey, locale]);

  if (isStudioSidebar) {
    return (
      <aside className={["studio-cal-preview--studio-sidebar", className].filter(Boolean).join(" ")}>
        <div className="studio-cal-preview__sidebar-head">
          <div className="min-w-0">
            <p className="studio-cal-preview__studio-label">{S.dayPreviewEyebrow}</p>
            <h2 className="studio-cal-preview__sidebar-title">
              {dayKey ? dayLabel : S.dayPreviewPickDay}
            </h2>
            {dayKey ? (
              <p className="studio-cal-preview__studio-meta">
                {dayItems.length === 0 ? S.dayPreviewEmpty : S.dayPreviewCount.replace("{count}", String(dayItems.length))}
              </p>
            ) : (
              <p className="studio-cal-preview__studio-meta">{S.dayPreviewPickDayHint}</p>
            )}
          </div>
          {dayKey && canAdd && showCreateButton ? (
            <StudioCreateButton type="button" onClick={onAdd} className="studio-create-btn--toolbar shrink-0">
              {createLabel}
            </StudioCreateButton>
          ) : null}
        </div>

        <div className="studio-cal-preview__sidebar-list">
          {!dayKey ? (
            <p className="studio-cal-preview__sidebar-empty">{S.dayPreviewPickDayHint}</p>
          ) : dayItems.length === 0 ? (
            <p className="studio-cal-preview__sidebar-empty">{S.dayPreviewEmpty}</p>
          ) : (
            <ul className="studio-cal-preview__sidebar-items">
              {dayItems.map((item) => (
                <PreviewCard
                  key={item.id}
                  item={item}
                  reelLabel={CC.typeReel}
                  postLabel={CC.typePost}
                  eventLabel={CC.typeEvent}
                  layout="stack"
                  onSelect={() => onSelectItem(item.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    );
  }

  if (isStudioToolbar) {
    const meta = showMeta ? (
      <div className="studio-cal-preview__studio-top">
        <div className="min-w-0">
          <p className="studio-cal-preview__studio-label">{S.dayPreviewEyebrow}</p>
          <p className="studio-cal-preview__studio-meta">
            {!dayKey
              ? S.dayPreviewPickDayHint
              : dayItems.length === 0
                ? S.dayPreviewEmpty
                : S.dayPreviewCount.replace("{count}", String(dayItems.length))}
          </p>
        </div>
        {dayKey && canAdd && showCreateButton ? (
          <StudioCreateButton type="button" onClick={onAdd} className="studio-create-btn--toolbar">
            {createLabel}
          </StudioCreateButton>
        ) : null}
      </div>
    ) : null;

    const list =
      showItemList && dayKey && dayItems.length > 0 ? (
        <div className="studio-cal-preview__studio-list">
          <ul className="studio-cal-preview__items">
            {dayItems.map((item) => (
              <PreviewCard
                key={item.id}
                item={item}
                reelLabel={CC.typeReel}
                postLabel={CC.typePost}
                eventLabel={CC.typeEvent}
                layout="rail"
                onSelect={() => onSelectItem(item.id)}
              />
            ))}
          </ul>
        </div>
      ) : null;

    if (!meta && !list) return null;

    return (
      <aside className={["studio-cal-preview--studio-toolbar", className].filter(Boolean).join(" ")}>
        {meta}
        {list}
      </aside>
    );
  }

  return (
    <aside
      className={[
        "flex min-h-0 min-w-0 flex-col",
        isBanner ? "studio-cal-preview--banner" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="studio-cal-preview__header">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--st-muted)]">
            {S.dayPreviewEyebrow}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold capitalize leading-snug text-[var(--st-ink)]">
            {dayKey ? dayLabel : S.dayPreviewPickDay}
          </h2>
          {dayKey ? (
            <p className="mt-0.5 text-[11px] text-[var(--st-muted)]">
              {dayItems.length === 0 ? S.dayPreviewEmpty : S.dayPreviewCount.replace("{count}", String(dayItems.length))}
            </p>
          ) : isBanner ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--st-muted)]">{S.dayPreviewPickDayHint}</p>
          ) : null}
        </div>
        {dayKey && canAdd ? (
          <StudioCreateButton type="button" onClick={onAdd}>
            {createLabel}
          </StudioCreateButton>
        ) : null}
      </div>

      <div className="studio-cal-preview__list">
        {!dayKey ? (
          isBanner ? null : (
            <p className="py-6 text-center text-xs leading-relaxed text-[var(--st-muted)]">{S.dayPreviewPickDayHint}</p>
          )
        ) : dayItems.length === 0 ? (
          <p className={isBanner ? "studio-cal-preview__empty" : "py-6 text-center text-xs leading-relaxed text-[var(--st-muted)]"}>
            {S.dayPreviewEmpty}
          </p>
        ) : (
          <ul className={isBanner ? "studio-cal-preview__items" : "grid grid-cols-2 gap-2"}>
            {dayItems.map((item) => (
              <PreviewCard
                key={item.id}
                item={item}
                reelLabel={CC.typeReel}
                postLabel={CC.typePost}
                eventLabel={CC.typeEvent}
                layout={isBanner ? "rail" : "stack"}
                onSelect={() => onSelectItem(item.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function PreviewCard({
  item,
  reelLabel,
  postLabel,
  eventLabel,
  layout = "stack",
  onSelect,
}: {
  item: DayPreviewItem;
  reelLabel: string;
  postLabel: string;
  eventLabel: string;
  layout?: "stack" | "rail";
  onSelect: () => void;
}) {
  if (isPlanEventItem(item)) {
    const slot = scheduledAtToDateKeyAndTime(item.scheduledAt);
    return (
      <li className={["min-w-0", layout === "rail" ? "studio-cal-preview__item--event" : ""].filter(Boolean).join(" ")}>
        <EventPreviewCard
          compact={layout === "rail"}
          title={item.title}
          time={slot?.time}
          description={item.description}
          showDescription={item.showDescription}
          color={item.color}
          eventLabel={eventLabel}
          onClick={onSelect}
          className="h-full min-h-0"
        />
      </li>
    );
  }

  const kind = contentKindFromApiType(item.type);
  const isReel = kind === "reel";
  const slot = item.scheduledAt ? scheduledAtToDateKeyAndTime(item.scheduledAt) : null;
  const mediaUrl = isReel ? item.videoUrl : item.imageUrl;
  const desc = excerpt(isReel ? item.description : item.text, 56);

  return (
    <li className="min-w-0">
      <button type="button" onClick={onSelect} className="studio-cal-preview__card group">
        <div className="studio-cal-preview__media">
          {mediaUrl ? (
            isReel ? (
              <video
                src={mediaUrl}
                className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="h-full w-full object-cover opacity-92 transition group-hover:opacity-100" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--st-muted)]">—</div>
          )}
          <div className="absolute left-1 top-1 origin-top-left scale-[0.82]">
            <ContentKindBadge
              kind={kind}
              reelLabel={reelLabel}
              postLabel={postLabel}
              eventLabel={eventLabel}
            />
          </div>
          {slot?.time ? <span className="studio-cal-preview__time">{slot.time}</span> : null}
        </div>
        <div className="space-y-px px-1.5 py-1.5">
          <p className="line-clamp-1 text-[10px] font-medium leading-tight text-[var(--st-ink)]">{item.title}</p>
          {desc ? <p className="line-clamp-1 text-[9px] leading-snug text-[var(--st-muted)]">{desc}</p> : null}
        </div>
      </button>
    </li>
  );
}
