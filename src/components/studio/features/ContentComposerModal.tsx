"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dateKeyLocal } from "@/components/calendar/dateUtils";
import { TagInput } from "@/components/calendar/TagInput";
import { StudioModalPortal } from "@/components/studio/StudioModalPortal";
import { useI18n } from "@/contexts/i18n-context";
import { subscribeStudioPlatforms } from "@/lib/studioInboxPermissions";
import { readConnectedReelPlatformAccounts } from "@/lib/studioPlatformsStorage";
import { uploadMedia, type ContentApiItem } from "@/lib/contentApi";
import type { CloudMediaOrigin } from "@/lib/cloud/types";
import type { EventApiItem } from "@/lib/eventsApi";
import { apiItemToPublishSelection, scheduledAtToDateKeyAndTime } from "@/lib/contentMappers";
import type { ConnectedPlatformAccount, ComposerPublishSelection } from "@/lib/composerPublish";
import { defaultPublishSelection } from "@/lib/composerPublish";
import { probeImage, probeVideo } from "@/lib/media/probeClient";
import { ComposerKindToggle, type ComposerKind } from "./ComposerKindToggle";
import {
  ComposerPostPreview,
  ComposerReelPreview,
  EventColorPicker,
  ComposerFieldError,
  composerInputClass,
  composerFieldLabel,
} from "./ComposerContentPreview";
import { EventPreviewCard } from "./EventPreviewCard";
import { ComposerMediaUpload, ComposerCloudActionButton } from "./ComposerMediaUpload";
import { ComposerCloudPicker } from "./ComposerCloudPicker";
import { ComposerPublishTargets } from "./ComposerPublishTargets";
import { ComposerKindMetaChip } from "./ComposerKindMetaChip";
import { ComposerSchedulePanel } from "./ComposerSchedulePanel";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { DEFAULT_EVENT_COLOR, normalizeEventColor } from "@/lib/eventColors";

type ReelDraft = {
  kind: "reel";
  videoUrl: string | null;
  videoMediaId: string | null;
  origin: CloudMediaOrigin | null;
  title: string;
  description: string;
  time: string;
  hashtags: string[];
};

type PostDraft = {
  kind: "post";
  title: string;
  text: string;
  imageUrl: string | null;
  imageMediaId: string | null;
  origin: CloudMediaOrigin | null;
  time: string;
  hashtags: string[];
};

type EventDraft = {
  kind: "event";
  title: string;
  description: string;
  showDescription: boolean;
  color: string;
  time: string;
};

type Props = {
  open: boolean;
  allowedKinds: ComposerKind[];
  defaultKind: ComposerKind;
  title: string;
  subtitle?: string;
  /** When set, form is prefilled for POST/REEL and submit sends `contentId` on the payload. */
  initialData?: ContentApiItem | null;
  /** When set, form is prefilled for PlanEvent and submit sends `contentId` from the event id. */
  initialEvent?: EventApiItem | null;
  date?: Date | null;
  requireTime?: boolean;
  onClose: () => void;
  onCreateReel: (payload: ReelDraft & { dateKey?: string; publish: ComposerPublishSelection; contentId?: string }) => void | Promise<void>;
  onCreatePost: (payload: PostDraft & { dateKey?: string; publish: ComposerPublishSelection; contentId?: string }) => void | Promise<void>;
  onCreateEvent: (payload: EventDraft & { dateKey?: string; contentId?: string }) => void | Promise<void>;
};

function defaultPostNow(isEditing: boolean, selectedDate: Date | null | undefined): boolean {
  if (isEditing) return false;
  if (!selectedDate) return true;
  const now = new Date();
  return (
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate()
  );
}

function mainVideoMediaId(item?: ContentApiItem | null): string | null {
  const row = item?.media?.find((entry) => entry.media.kind === "VIDEO") ?? item?.media?.[0];
  return row?.media.id ?? null;
}

function mainImageMediaId(item?: ContentApiItem | null): string | null {
  const row = item?.media?.find((entry) => entry.media.kind === "IMAGE") ?? item?.media?.[0];
  return row?.media.id ?? null;
}

function mediaOriginFromContent(item?: ContentApiItem | null): CloudMediaOrigin | null {
  const row = item?.media?.find((entry) => entry.role === "MAIN") ?? item?.media?.[0];
  return row?.media.origin ?? null;
}

function defaultTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function defaultTimeForDate(date: Date): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const selectedStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (selectedStart === todayStart) {
    const next = new Date(now.getTime() + 15 * 60 * 1000);
    const rounded = new Date(next);
    rounded.setSeconds(0, 0);
    rounded.setMinutes(Math.ceil(rounded.getMinutes() / 15) * 15);
    const hh = String(rounded.getHours()).padStart(2, "0");
    const mm = String(rounded.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return "10:00";
}

function parseDateKeyToDate(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const d = new Date(dateKey + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

type ComposerFieldErrors = {
  media?: string;
  title?: string;
  body?: string;
  publish?: string;
  form?: string;
};

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ContentComposerModal({
  open,
  allowedKinds,
  defaultKind,
  title,
  subtitle,
  initialData = null,
  initialEvent = null,
  date,
  requireTime,
  onClose,
  onCreateReel,
  onCreatePost,
  onCreateEvent,
}: Props) {
  const isEditing = Boolean(initialData || initialEvent);
  const { messages } = useI18n();
  const CC = messages.studio.content;
  const C = CC.composer;

  const [kind, setKind] = useState<ComposerKind>(defaultKind);
  const [fieldErrors, setFieldErrors] = useState<ComposerFieldErrors>({});

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedPlatformAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [postPublish, setPostPublish] = useState<ComposerPublishSelection>(defaultPublishSelection);
  const [reelPublish, setReelPublish] = useState<ComposerPublishSelection>(defaultPublishSelection);

  const [pickedDateKey, setPickedDateKey] = useState<string>(() => dateKeyLocal(new Date()));
  const effectiveDate = useMemo(() => parseDateKeyToDate(pickedDateKey), [pickedDateKey]);

  const requireTimeNow = Boolean(requireTime && effectiveDate);
  const showTimeInput = Boolean(requireTimeNow);

  const [reel, setReel] = useState<ReelDraft>({
    kind: "reel",
    videoUrl: null,
    videoMediaId: null,
    origin: null,
    title: "",
    description: "",
    time: defaultTime(),
    hashtags: [],
  });

  const [post, setPost] = useState<PostDraft>({
    kind: "post",
    title: "",
    text: "",
    imageUrl: null,
    imageMediaId: null,
    origin: null,
    time: defaultTime(),
    hashtags: [],
  });

  const [event, setEvent] = useState<EventDraft>({
    kind: "event",
    title: "",
    description: "",
    showDescription: false,
    color: DEFAULT_EVENT_COLOR,
    time: defaultTime(),
  });

  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [cloudPickerKind, setCloudPickerKind] = useState<"video" | "image" | null>(null);
  const [driveConnected, setDriveConnected] = useState(false);
  const [postNow, setPostNow] = useState(true);

  /** Avoid re-hydrating from props while the same item is open (e.g. list refresh changes `updatedAt` / object reference). */
  const hydratedEditIdRef = useRef<string | null>(null);
  const publishDefaultsSetRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hydratedEditIdRef.current = null;
      publishDefaultsSetRef.current = false;
      return;
    }
    setFieldErrors({});

    if (initialEvent) {
      if (hydratedEditIdRef.current === initialEvent.id) return;
      hydratedEditIdRef.current = initialEvent.id;

      setKind("event");
      setPostNow(false);
      setPostPublish(defaultPublishSelection());
      setReelPublish(defaultPublishSelection());
      const slot = scheduledAtToDateKeyAndTime(initialEvent.scheduledAt);
      const baseDate = date ?? (slot ? parseDateKeyToDate(slot.dateKey) : null);
      setPickedDateKey(slot?.dateKey ?? (baseDate ? dateKeyLocal(baseDate) : dateKeyLocal(new Date())));
      const t = slot?.time ?? (baseDate ? defaultTimeForDate(baseDate) : defaultTime());
      setEvent({
        kind: "event",
        title: initialEvent.title,
        description: initialEvent.description ?? "",
        showDescription: initialEvent.showDescription === true,
        color: normalizeEventColor(initialEvent.color),
        time: t,
      });
      setPost({
        kind: "post",
        title: "",
        text: "",
        imageUrl: null,
        imageMediaId: null,
        origin: null,
        time: t,
        hashtags: [],
      });
      setReel({
        kind: "reel",
        videoUrl: null,
        videoMediaId: null,
        origin: null,
        title: "",
        description: "",
        time: t,
        hashtags: [],
      });
      return;
    }

    if (initialData) {
      if (hydratedEditIdRef.current === initialData.id) return;
      hydratedEditIdRef.current = initialData.id;

      const typeUpper = String(initialData.type).toUpperCase();
      const k: ComposerKind = typeUpper === "REEL" ? "reel" : "post";
      setKind(k);
      setPostNow(false);
      const pub = apiItemToPublishSelection(initialData);
      setPostPublish(pub);
      setReelPublish(pub);
      const slot = initialData.scheduledAt ? scheduledAtToDateKeyAndTime(initialData.scheduledAt) : null;
      const baseDate = date ?? (slot ? parseDateKeyToDate(slot.dateKey) : null);
      setPickedDateKey(slot?.dateKey ?? (baseDate ? dateKeyLocal(baseDate) : dateKeyLocal(new Date())));
      const t = slot?.time ?? (baseDate ? defaultTimeForDate(baseDate) : defaultTime());

      if (typeUpper === "POST") {
        setPost({
          kind: "post",
          title: initialData.title,
          text: initialData.text ?? "",
          imageUrl: initialData.imageUrl,
          imageMediaId: mainImageMediaId(initialData),
          origin: mediaOriginFromContent(initialData),
          time: t,
          hashtags: initialData.hashtags,
        });
        setReel({
          kind: "reel",
          videoUrl: null,
          videoMediaId: null,
          origin: null,
          title: "",
          description: "",
          time: t,
          hashtags: [],
        });
        setEvent({
          kind: "event",
          title: "",
          description: "",
          showDescription: false,
          color: DEFAULT_EVENT_COLOR,
          time: t,
        });
      } else {
        setReel({
          kind: "reel",
          videoUrl: initialData.videoUrl,
          videoMediaId: mainVideoMediaId(initialData),
          origin: mediaOriginFromContent(initialData),
          title: initialData.title,
          description: initialData.description ?? "",
          time: t,
          hashtags: initialData.hashtags,
        });
        setPost({
          kind: "post",
          title: "",
          text: "",
          imageUrl: null,
          imageMediaId: null,
          origin: null,
          time: t,
          hashtags: [],
        });
        setEvent({
          kind: "event",
          title: "",
          description: "",
          showDescription: false,
          color: DEFAULT_EVENT_COLOR,
          time: t,
        });
      }
      return;
    }

    hydratedEditIdRef.current = null;
    setKind(defaultKind);
    setPostNow(defaultPostNow(false, date));
    setPostPublish(defaultPublishSelection());
    setReelPublish(defaultPublishSelection());
    setPickedDateKey(date ? dateKeyLocal(date) : dateKeyLocal(new Date()));
    const resetTime = date ? defaultTimeForDate(date) : defaultTime();
    setReel({
      kind: "reel",
      videoUrl: null,
      videoMediaId: null,
      origin: null,
      title: "",
      description: "",
      time: resetTime,
      hashtags: [],
    });
    setPost({
      kind: "post",
      title: "",
      text: "",
      imageUrl: null,
      imageMediaId: null,
      origin: null,
      time: resetTime,
      hashtags: [],
    });
    setEvent({
      kind: "event",
      title: "",
      description: "",
      showDescription: false,
      color: DEFAULT_EVENT_COLOR,
      time: resetTime,
    });
    // Intentionally omit full initial* objects from deps: same `id` must not re-hydrate (list refresh).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKind, open, date, initialData?.id, initialEvent?.id]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadAccounts = () => {
      setAccountsLoaded(false);
      fetch("/api/platform-accounts")
        .then((r) => (r.ok ? r.json() : { accounts: [] }))
        .then((d: { accounts?: ConnectedPlatformAccount[] }) => {
          if (cancelled) return;
          const fromApi = Array.isArray(d.accounts) ? d.accounts : [];
          const fromStorage = readConnectedReelPlatformAccounts();
          const byPlatform = new Map<string, ConnectedPlatformAccount>();
          for (const a of fromApi) byPlatform.set(a.platformId, a);
          for (const a of fromStorage) {
            if (!byPlatform.has(a.platformId)) byPlatform.set(a.platformId, a);
          }
          setConnectedAccounts(Array.from(byPlatform.values()));
        })
        .catch(() => {
          if (!cancelled) setConnectedAccounts(readConnectedReelPlatformAccounts());
        })
        .finally(() => {
          if (!cancelled) setAccountsLoaded(true);
        });
    };

    loadAccounts();
    fetch("/api/google-drive")
      .then((r) => (r.ok ? r.json() : { connected: false }))
      .then((d: { connected?: boolean }) => {
        if (!cancelled) setDriveConnected(Boolean(d.connected));
      })
      .catch(() => {
        if (!cancelled) setDriveConnected(false);
      });
    const unsub = subscribeStudioPlatforms(() => {
      if (!cancelled) loadAccounts();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !accountsLoaded || isEditing || publishDefaultsSetRef.current) return;
    if (connectedAccounts.length === 0) return;
    publishDefaultsSetRef.current = true;
    const ids = connectedAccounts.map((a) => a.platformId);
    setPostPublish({ kind: "platforms", platformIds: ids });
    setReelPublish({ kind: "platforms", platformIds: ids });
  }, [open, accountsLoaded, connectedAccounts, isEditing]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  const postingNow = kind !== "event" && postNow;

  const dateError = useMemo(() => {
    if (postingNow || !effectiveDate || isEditing) return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const selectedStart = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate()).getTime();
    if (selectedStart < todayStart) return C.errors.pastDay;
    return null;
  }, [C.errors.pastDay, effectiveDate, isEditing, postingNow]);

  const timeError = useMemo(() => {
    if (postingNow || !effectiveDate || isEditing || dateError) return null;
    const t = kind === "reel" ? reel.time : kind === "event" ? event.time : post.time;
    if (!requireTimeNow || !/^\d{2}:\d{2}$/.test(t)) return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const selectedStart = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate()).getTime();
    const [hh, mm] = t.split(":").map((x) => Number(x));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    const scheduledAt = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate(), hh, mm, 0, 0).getTime();
    if (selectedStart === todayStart && scheduledAt <= now.getTime()) return C.errors.pastTime;
    return null;
  }, [C.errors.pastTime, dateError, effectiveDate, event.time, isEditing, kind, post.time, postingNow, reel.time, requireTimeNow]);

  const scheduleError = postingNow ? null : dateError || timeError;

  if (!open) return null;

  return (
    <StudioModalPortal>
      <div className="studio-composer-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6">
        <div className="absolute inset-0 bg-[var(--studio-overlay)] backdrop-blur-sm" aria-hidden />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-modal-title"
          className="studio-composer-dialog relative z-10 mb-8 flex max-h-[min(92dvh,940px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-[0_40px_120px_-60px_rgba(15,23,42,0.22)]"
        >
        <div className="shrink-0 border-b border-[var(--line)] px-5 py-4">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-3">
            <div className="min-w-0 justify-self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
              <h2 id="composer-modal-title" className="mt-1 text-lg font-semibold leading-tight text-[var(--fg)]">
                {isEditing ? C.editContent : subtitle ?? C.createContent}
              </h2>
            </div>

            <div className="flex justify-center justify-self-center">
              {allowedKinds.length > 1 ? (
                <ComposerKindToggle
                  kind={kind}
                  allowed={allowedKinds}
                  onChange={(next) => {
                    setKind(next);
                    setFieldErrors({});
                  }}
                  labels={{ post: CC.typePost, reel: CC.typeReel, event: CC.typeEvent }}
                  ariaLabel={C.kindToggleAria}
                />
              ) : (
                <ComposerKindMetaChip
                  kind={kind}
                  label={kind === "reel" ? CC.typeReel : kind === "event" ? CC.typeEvent : CC.typePost}
                />
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <div className="grid gap-2.5 lg:sticky lg:top-0 lg:self-start">
              <ComposerSchedulePanel
                scheduleLabel={C.schedule}
                dateLabel={C.date}
                timeLabel={C.time}
                pickedDateKey={pickedDateKey}
                minDateKey={isEditing ? undefined : dateKeyLocal(new Date())}
                onDateChange={setPickedDateKey}
                showTime={showTimeInput}
                timeValue={kind === "reel" ? reel.time : kind === "event" ? event.time : post.time}
                onTimeChange={(v) => {
                  if (kind === "reel") setReel((d) => ({ ...d, time: v }));
                  else if (kind === "event") setEvent((d) => ({ ...d, time: v }));
                  else setPost((d) => ({ ...d, time: v }));
                }}
                stepMinutes={5}
                dateError={dateError ?? undefined}
                timeError={timeError ?? undefined}
                showPostNow={kind !== "event"}
                postNow={postNow}
                onPostNowChange={(next) => {
                  setPostNow(next);
                  setFieldErrors((prev) => ({ ...prev, form: undefined }));
                }}
                postNowLabel={C.postNow}
                postNowSummary={C.postNowSummary}
              />
              {kind === "reel" ? (
                <ComposerReelPreview
                  videoUrl={reel.videoUrl}
                  origin={reel.origin}
                  title={reel.title}
                  description={reel.description}
                  hashtags={reel.hashtags}
                  labels={{
                    noVideo: C.video,
                    brand: C.preview.brand,
                    reels: C.preview.reels,
                    captionEmpty: C.preview.captionEmpty,
                  }}
                />
              ) : kind === "event" ? (
                <EventPreviewCard
                  className="studio-event-composer-preview"
                  title={event.title}
                  time={event.time}
                  dateKey={pickedDateKey}
                  description={event.description}
                  showDescription={event.showDescription}
                  color={event.color}
                  eventLabel={CC.typeEvent}
                  untitledLabel={C.titlePlaceholder}
                />
              ) : (
                <ComposerPostPreview
                  imageUrl={post.imageUrl}
                  origin={post.origin}
                  title={post.title}
                  text={post.text}
                  hashtags={post.hashtags}
                  labels={{
                    noImage: C.noImageSelected,
                    brand: C.preview.brand,
                  }}
                />
              )}
            </div>

            <div className="grid min-w-0 gap-4">
              {kind === "reel" ? (
                <>
                  <ComposerMediaUpload
                    label={C.video}
                    accept="video/*"
                    hint="MP4, MOV · up to 200 MB"
                    hasMedia={Boolean(reel.videoUrl)}
                    origin={reel.origin}
                    busy={uploadingMedia}
                    disabled={saving}
                    error={fieldErrors.media}
                    cloudAction={
                      driveConnected ? (
                        <ComposerCloudActionButton
                          label={C.cloud.fromDrive}
                          disabled={saving || uploadingMedia}
                          onClick={() => setCloudPickerKind("video")}
                        />
                      ) : null
                    }
                    onChange={async (e) => {
                      setFieldErrors((prev) => ({ ...prev, media: undefined }));
                      const input = e.target;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("video/")) {
                        setFieldErrors((prev) => ({ ...prev, media: C.errors.selectVideoFile }));
                        return;
                      }
                      if (file.size > MAX_VIDEO_BYTES) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          media: C.errors.videoTooLarge.replace("{mb}", String(Math.round(file.size / (1024 * 1024)))),
                        }));
                        return;
                      }
                      try {
                        setUploadingMedia(true);
                        const probe = await probeVideo(file);
                        const { media } = await uploadMedia(file, probe ?? undefined);
                        setReel((d) => ({ ...d, videoUrl: media.url, videoMediaId: media.id, origin: media.origin ?? null }));
                      } catch (err) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          media: err instanceof Error ? err.message : C.errors.failedReadVideo,
                        }));
                      } finally {
                        setUploadingMedia(false);
                      }
                    }}
                  />
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.title}</span>
                    <input
                      value={reel.title}
                      onChange={(e) => {
                        setReel((d) => ({ ...d, title: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder={C.titlePlaceholder}
                      className={composerInputClass(Boolean(fieldErrors.title))}
                      aria-invalid={Boolean(fieldErrors.title)}
                    />
                    <ComposerFieldError message={fieldErrors.title} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.description}</span>
                    <textarea
                      value={reel.description}
                      onChange={(e) => setReel((d) => ({ ...d, description: e.target.value }))}
                      placeholder={C.descriptionPlaceholder}
                      rows={5}
                      className={`${composerInputClass()} min-h-[7.5rem] resize-y`}
                    />
                  </label>
                  <TagInput
                    variant="studio"
                    label={C.hashtags}
                    value={reel.hashtags}
                    onChange={(hashtags) => setReel((d) => ({ ...d, hashtags }))}
                    placeholder={C.hashtagsPlaceholder}
                    hint={C.hashtagsHint}
                  />
                </>
              ) : kind === "event" ? (
                <>
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.title}</span>
                    <input
                      value={event.title}
                      onChange={(e) => {
                        setEvent((d) => ({ ...d, title: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder={C.titlePlaceholder}
                      className={composerInputClass(Boolean(fieldErrors.title))}
                      aria-invalid={Boolean(fieldErrors.title)}
                    />
                    <ComposerFieldError message={fieldErrors.title} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.description}</span>
                    <textarea
                      value={event.description}
                      onChange={(e) => setEvent((d) => ({ ...d, description: e.target.value }))}
                      placeholder={C.descriptionPlaceholder}
                      rows={4}
                      className={`${composerInputClass()} min-h-[6rem] resize-y`}
                    />
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)]/80 px-3 py-2.5 transition hover:bg-[var(--studio-surface-2)]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={event.showDescription}
                      onChange={(e) => setEvent((d) => ({ ...d, showDescription: e.target.checked }))}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--fg)]">{C.showDescriptionInPreview}</span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">{C.showDescriptionInPreviewHint}</span>
                    </span>
                  </label>
                  <EventColorPicker
                    value={event.color}
                    onChange={(color) => setEvent((d) => ({ ...d, color: normalizeEventColor(color) }))}
                    label={C.eventColor}
                    ariaLabel={C.eventColorAria}
                    customLabel={C.eventColorCustom}
                  />
                </>
              ) : (
                <>
                  <ComposerMediaUpload
                    label={C.image}
                    accept="image/*"
                    hint="PNG, JPG · up to 4 MB"
                    hasMedia={Boolean(post.imageUrl)}
                    origin={post.origin}
                    busy={uploadingMedia}
                    disabled={saving}
                    error={fieldErrors.media}
                    cloudAction={
                      driveConnected ? (
                        <ComposerCloudActionButton
                          label={C.cloud.fromDrive}
                          disabled={saving || uploadingMedia}
                          onClick={() => setCloudPickerKind("image")}
                        />
                      ) : null
                    }
                    onChange={async (e) => {
                      setFieldErrors((prev) => ({ ...prev, media: undefined }));
                      const input = e.target;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setFieldErrors((prev) => ({ ...prev, media: C.errors.selectImageFile }));
                        return;
                      }
                      if (file.size > MAX_IMAGE_BYTES) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          media: C.errors.imageTooLarge.replace("{mb}", String(Math.round(file.size / (1024 * 1024)))),
                        }));
                        return;
                      }
                      try {
                        setUploadingMedia(true);
                        const probe = await probeImage(file);
                        const { media } = await uploadMedia(file, probe ?? undefined);
                        setPost((d) => ({
                          ...d,
                          imageUrl: media.url,
                          imageMediaId: media.id,
                          origin: media.origin ?? null,
                        }));
                      } catch (err) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          media: err instanceof Error ? err.message : C.errors.failedReadImage,
                        }));
                      } finally {
                        setUploadingMedia(false);
                      }
                    }}
                  />
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.title}</span>
                    <input
                      value={post.title}
                      onChange={(e) => {
                        setPost((d) => ({ ...d, title: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder={C.titlePlaceholder}
                      className={composerInputClass(Boolean(fieldErrors.title))}
                      aria-invalid={Boolean(fieldErrors.title)}
                    />
                    <ComposerFieldError message={fieldErrors.title} />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={composerFieldLabel}>{C.text}</span>
                    <textarea
                      value={post.text}
                      onChange={(e) => {
                        setPost((d) => ({ ...d, text: e.target.value }));
                        setFieldErrors((prev) => ({ ...prev, body: undefined }));
                      }}
                      placeholder={C.textPlaceholder}
                      rows={5}
                      className={`${composerInputClass(Boolean(fieldErrors.body))} min-h-[7.5rem] resize-y`}
                      aria-invalid={Boolean(fieldErrors.body)}
                    />
                    <ComposerFieldError message={fieldErrors.body} />
                  </label>
                  <TagInput
                    variant="studio"
                    label={C.hashtags}
                    value={post.hashtags}
                    onChange={(hashtags) => setPost((d) => ({ ...d, hashtags }))}
                    placeholder={C.hashtagsPlaceholder}
                    hint={C.hashtagsHint}
                  />
                </>
              )}

              {kind !== "event" ? (
                <ComposerPublishTargets
                  accounts={connectedAccounts}
                  loaded={accountsLoaded}
                  value={kind === "reel" ? reelPublish : postPublish}
                  onChange={(next) => {
                    setFieldErrors((prev) => ({ ...prev, publish: undefined }));
                    if (kind === "reel") setReelPublish(next);
                    else setPostPublish(next);
                  }}
                  error={fieldErrors.publish}
                />
              ) : null}
              <ComposerFieldError message={fieldErrors.form} />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--line)] px-5 py-4">
        <div className="flex items-center justify-end gap-3">
          <StudioGhostButton
            type="button"
            className="studio-btn-ghost--md"
            onClick={saving ? undefined : onClose}
            disabled={saving}
          >
            {C.cancel}
          </StudioGhostButton>

          <StudioCreateButton
            type="button"
            className="studio-create-btn--sm"
            disabled={saving || uploadingMedia || !(accountsLoaded || kind === "event")}
            onClick={async () => {
              const contentId = initialEvent?.id ?? initialData?.id;
              const nextErrors: ComposerFieldErrors = {};

              if (kind === "reel") {
                if (!reel.videoUrl) nextErrors.media = C.errors.videoRequired;
                if (!reel.title.trim()) nextErrors.title = C.errors.titleRequired;
                if (reelPublish.kind === "platforms") {
                  if (connectedAccounts.length === 0) nextErrors.publish = C.errors.noPlatformsConnected;
                  else if (reelPublish.platformIds.length === 0) nextErrors.publish = C.errors.pickPublishTargets;
                }
                if (scheduleError || Object.keys(nextErrors).length) {
                  setFieldErrors(nextErrors);
                  return;
                }
                const title = reel.title.trim();
                const now = postingNow ? new Date() : null;
                const dateKey = now ? dateKeyLocal(now) : effectiveDate ? dateKeyLocal(effectiveDate) : undefined;
                const time = now ? defaultTime() : reel.time;
                try {
                  setSaving(true);
                  setFieldErrors({});
                  await Promise.resolve(onCreateReel({ ...reel, title, time, dateKey, publish: reelPublish, contentId }));
                  onClose();
                } catch (e) {
                  setFieldErrors({
                    form: e instanceof Error ? e.message : messages.studio.content.errors.saveFailed,
                  });
                } finally {
                  setSaving(false);
                }
                return;
              }

              if (kind === "event") {
                if (!event.title.trim()) nextErrors.title = C.errors.titleRequired;
                if (scheduleError || Object.keys(nextErrors).length) {
                  setFieldErrors(nextErrors);
                  return;
                }
                const dateKey = effectiveDate ? dateKeyLocal(effectiveDate) : undefined;
                try {
                  setSaving(true);
                  setFieldErrors({});
                  await Promise.resolve(
                    onCreateEvent({
                      ...event,
                      title: event.title.trim(),
                      description: event.description.trim(),
                      showDescription: event.showDescription,
                      color: normalizeEventColor(event.color),
                      dateKey,
                      contentId,
                    }),
                  );
                  onClose();
                } catch (e) {
                  setFieldErrors({
                    form: e instanceof Error ? e.message : messages.studio.content.errors.saveFailed,
                  });
                } finally {
                  setSaving(false);
                }
                return;
              }

              if (!post.title.trim()) nextErrors.title = C.errors.titleRequired;
              if (!post.text.trim()) nextErrors.body = C.errors.textRequired;
              if (postPublish.kind === "platforms") {
                if (connectedAccounts.length === 0) nextErrors.publish = C.errors.noPlatformsConnected;
                else if (postPublish.platformIds.length === 0) nextErrors.publish = C.errors.pickPublishTargets;
              }
              if (scheduleError || Object.keys(nextErrors).length) {
                setFieldErrors(nextErrors);
                return;
              }
              const now = postingNow ? new Date() : null;
              const dk = now ? dateKeyLocal(now) : effectiveDate ? dateKeyLocal(effectiveDate) : undefined;
              const time = now ? defaultTime() : post.time;
              try {
                setSaving(true);
                setFieldErrors({});
                await Promise.resolve(
                  onCreatePost({
                    ...post,
                    title: post.title.trim(),
                    text: post.text.trim(),
                    time,
                    dateKey: dk,
                    publish: postPublish,
                    contentId,
                  }),
                );
                onClose();
              } catch (e) {
                setFieldErrors({
                  form: e instanceof Error ? e.message : messages.studio.content.errors.saveFailed,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving || uploadingMedia ? C.saving : isEditing ? C.save : C.create}
          </StudioCreateButton>
        </div>
        </div>
      </div>
      </div>
      <ComposerCloudPicker
        open={cloudPickerKind !== null}
        kind={cloudPickerKind === "image" ? "image" : "video"}
        busy={uploadingMedia}
        onClose={() => setCloudPickerKind(null)}
        onPicked={(origin, mediaUrl, mediaId) => {
          if (cloudPickerKind === "image") {
            setPost((d) => ({ ...d, imageUrl: mediaUrl, imageMediaId: mediaId, origin }));
          } else {
            setReel((d) => ({ ...d, videoUrl: mediaUrl, videoMediaId: mediaId, origin }));
          }
          setFieldErrors((prev) => ({ ...prev, media: undefined }));
        }}
      />
    </StudioModalPortal>
  );
}
