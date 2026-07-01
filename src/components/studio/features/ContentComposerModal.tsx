"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { dateKeyLocal } from "@/components/calendar/dateUtils";
import { TagInput } from "@/components/calendar/TagInput";
import { StudioModalPortal } from "@/components/studio/StudioModalPortal";
import { useI18n } from "@/contexts/i18n-context";
import { subscribeStudioPlatforms } from "@/lib/studioInboxPermissions";
import { readConnectedReelPlatformAccounts } from "@/lib/studioPlatformsStorage";
import { uploadMedia, type ContentApiItem } from "@/lib/contentApi";
import { apiItemToPublishSelection, scheduledAtToDateKeyAndTime } from "@/lib/contentMappers";
import type { ConnectedPlatformAccount, ComposerPublishSelection } from "@/lib/composerPublish";
import { defaultPublishSelection, isPublishSelectionReady } from "@/lib/composerPublish";
import { probeImage, probeVideo } from "@/lib/media/probeClient";
import { ComposerKindToggle, type ComposerKind } from "./ComposerKindToggle";
import {
  ComposerPostPreview,
  ComposerReelPreview,
  composerFieldInput,
  composerFieldLabel,
} from "./ComposerContentPreview";
import { ComposerMediaUpload } from "./ComposerMediaUpload";
import { ComposerPublishTargets } from "./ComposerPublishTargets";
import { ComposerKindMetaChip } from "./ComposerKindMetaChip";
import { ComposerSchedulePanel } from "./ComposerSchedulePanel";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";

type ReelDraft = {
  kind: "reel";
  videoUrl: string | null;
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
  time: string;
  hashtags: string[];
};

type Props = {
  open: boolean;
  allowedKinds: ComposerKind[];
  defaultKind: ComposerKind;
  title: string;
  subtitle?: string;
  /** When set, form is prefilled and submit sends `contentId` on the payload. */
  initialData?: ContentApiItem | null;
  date?: Date | null;
  requireTime?: boolean;
  onClose: () => void;
  onCreateReel: (payload: ReelDraft & { dateKey?: string; publish: ComposerPublishSelection; contentId?: string }) => void | Promise<void>;
  onCreatePost: (payload: PostDraft & { dateKey?: string; publish: ComposerPublishSelection; contentId?: string }) => void | Promise<void>;
};

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

const MAX_VIDEO_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ContentComposerModal({
  open,
  allowedKinds,
  defaultKind,
  title,
  subtitle,
  initialData = null,
  date,
  requireTime,
  onClose,
  onCreateReel,
  onCreatePost,
}: Props) {
  const { messages } = useI18n();
  const CC = messages.studio.content;
  const C = CC.composer;

  const [kind, setKind] = useState<ComposerKind>(defaultKind);
  const [error, setError] = useState<string | null>(null);

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
    time: defaultTime(),
    hashtags: [],
  });

  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  /** Avoid re-hydrating from props while the same item is open (e.g. list refresh changes `updatedAt` / object reference). */
  const hydratedEditIdRef = useRef<string | null>(null);
  const publishDefaultsSetRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hydratedEditIdRef.current = null;
      publishDefaultsSetRef.current = false;
      return;
    }
    setError(null);

    if (initialData) {
      if (hydratedEditIdRef.current === initialData.id) return;
      hydratedEditIdRef.current = initialData.id;

      const k: ComposerKind = String(initialData.type).toUpperCase() === "REEL" ? "reel" : "post";
      setKind(k);
      const pub = apiItemToPublishSelection(initialData);
      setPostPublish(pub);
      setReelPublish(pub);
      const slot = initialData.scheduledAt ? scheduledAtToDateKeyAndTime(initialData.scheduledAt) : null;
      const baseDate = date ?? (slot ? parseDateKeyToDate(slot.dateKey) : null);
      setPickedDateKey(slot?.dateKey ?? (baseDate ? dateKeyLocal(baseDate) : dateKeyLocal(new Date())));
      const t = slot?.time ?? (baseDate ? defaultTimeForDate(baseDate) : defaultTime());

      if (String(initialData.type).toUpperCase() === "POST") {
        setPost({
          kind: "post",
          title: initialData.title,
          text: initialData.text ?? "",
          imageUrl: initialData.imageUrl,
          time: t,
          hashtags: initialData.hashtags,
        });
        setReel({
          kind: "reel",
          videoUrl: null,
          title: "",
          description: "",
          time: t,
          hashtags: [],
        });
      } else {
        setReel({
          kind: "reel",
          videoUrl: initialData.videoUrl,
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
          time: t,
          hashtags: [],
        });
      }
      return;
    }

    hydratedEditIdRef.current = null;
    setKind(defaultKind);
    setPostPublish(defaultPublishSelection());
    setReelPublish(defaultPublishSelection());
    setPickedDateKey(date ? dateKeyLocal(date) : dateKeyLocal(new Date()));
    setReel({
      kind: "reel",
      videoUrl: null,
      title: "",
      description: "",
      time: date ? defaultTimeForDate(date) : defaultTime(),
      hashtags: [],
    });
    setPost({
      kind: "post",
      title: "",
      text: "",
      imageUrl: null,
      time: date ? defaultTimeForDate(date) : defaultTime(),
      hashtags: [],
    });
    // Intentionally omit `initialData` from deps: same `id` must not re-hydrate (list refresh); we read latest fields when id/open/date/defaultKind changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKind, open, date, initialData?.id]);

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
    const unsub = subscribeStudioPlatforms(() => {
      if (!cancelled) loadAccounts();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !accountsLoaded || initialData || publishDefaultsSetRef.current) return;
    if (connectedAccounts.length === 0) return;
    publishDefaultsSetRef.current = true;
    const ids = connectedAccounts.map((a) => a.platformId);
    setPostPublish({ kind: "platforms", platformIds: ids });
    setReelPublish({ kind: "platforms", platformIds: ids });
  }, [open, accountsLoaded, connectedAccounts, initialData]);

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

  const scheduleError = useMemo(() => {
    if (!effectiveDate) return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const selectedStart = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate()).getTime();
    if (!initialData && selectedStart < todayStart) return C.errors.pastDay;

    const t = kind === "reel" ? reel.time : post.time;
    if (!initialData && requireTimeNow && /^\d{2}:\d{2}$/.test(t)) {
      const [hh, mm] = t.split(":").map((x) => Number(x));
      if (Number.isFinite(hh) && Number.isFinite(mm)) {
        const scheduledAt = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate(), hh, mm, 0, 0).getTime();
        if (selectedStart === todayStart && scheduledAt <= now.getTime()) return C.errors.pastTime;
      }
    }

    return null;
  }, [C.errors.pastDay, C.errors.pastTime, effectiveDate, initialData, kind, post.time, reel.time, requireTimeNow]);

  const reelDetailsValid =
    Boolean(reel.videoUrl) &&
    reel.title.trim().length > 0 &&
    (!requireTimeNow || /^\d{2}:\d{2}$/.test(reel.time)) &&
    !scheduleError;

  const postDetailsValid =
    post.title.trim().length > 0 &&
    post.text.trim().length > 0 &&
    (!requireTimeNow || /^\d{2}:\d{2}$/.test(post.time)) &&
    !scheduleError;

  const isEdit = Boolean(initialData);
  const postPublishReady = isPublishSelectionReady(accountsLoaded, connectedAccounts, postPublish, { isEdit });
  const reelPublishReady = isPublishSelectionReady(accountsLoaded, connectedAccounts, reelPublish, { isEdit });

  const postCreateReady = postDetailsValid && postPublishReady;
  const reelCreateReady = reelDetailsValid && reelPublishReady;

  const createReady = kind === "reel" ? reelCreateReady : postCreateReady;

  if (!open) return null;

  return (
    <StudioModalPortal>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6">
        <div className="absolute inset-0 bg-[var(--studio-overlay)] backdrop-blur-sm" aria-hidden />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-modal-title"
          className="relative z-10 mb-8 flex max-h-[min(92dvh,940px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-[0_40px_120px_-60px_rgba(15,23,42,0.22)]"
        >
        <div className="shrink-0 border-b border-[var(--line)] px-5 py-4">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-3">
            <div className="min-w-0 justify-self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
              <h2 id="composer-modal-title" className="mt-1 text-lg font-semibold leading-tight text-[var(--fg)]">
                {initialData ? C.editContent : subtitle ?? C.createContent}
              </h2>
            </div>

            <div className="flex justify-center justify-self-center">
              {allowedKinds.length > 1 ? (
                <ComposerKindToggle
                  kind={kind}
                  allowed={allowedKinds}
                  onChange={setKind}
                  labels={{ post: CC.typePost, reel: CC.typeReel }}
                  ariaLabel={C.kindToggleAria}
                />
              ) : (
                <ComposerKindMetaChip
                  kind={kind}
                  label={kind === "reel" ? CC.typeReel : CC.typePost}
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
                minDateKey={initialData ? undefined : dateKeyLocal(new Date())}
                onDateChange={setPickedDateKey}
                showTime={showTimeInput}
                timeValue={kind === "reel" ? reel.time : post.time}
                onTimeChange={(v) => {
                  if (kind === "reel") setReel((d) => ({ ...d, time: v }));
                  else setPost((d) => ({ ...d, time: v }));
                }}
                stepMinutes={5}
              />
              {scheduleError ? (
                <p className="rounded-xl border border-[var(--ember)]/25 bg-[var(--ember)]/10 px-3 py-2 text-xs font-semibold text-[var(--ember)]">
                  {scheduleError}
                </p>
              ) : null}
              {kind === "reel" ? (
                <ComposerReelPreview
                  videoUrl={reel.videoUrl}
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
              ) : (
                <ComposerPostPreview
                  imageUrl={post.imageUrl}
                  title={post.title}
                  text={post.text}
                  labels={{ noImage: C.noImageSelected }}
                />
              )}
            </div>

            <div className="grid min-w-0 gap-4">
              {kind === "reel" ? (
                <>
                  <ComposerMediaUpload
                    label={C.video}
                    accept="video/*"
                    hint="MP4, MOV · up to 8 MB"
                    hasMedia={Boolean(reel.videoUrl)}
                    busy={uploadingMedia}
                    disabled={saving}
                    onChange={async (e) => {
                      setError(null);
                      const input = e.target;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("video/")) {
                        setError(C.errors.selectVideoFile);
                        return;
                      }
                      if (file.size > MAX_VIDEO_BYTES) {
                        setError(C.errors.videoTooLarge.replace("{mb}", String(Math.round(file.size / (1024 * 1024)))));
                        return;
                      }
                      try {
                        setUploadingMedia(true);
                        const probe = await probeVideo(file);
                        const { media } = await uploadMedia(file, probe ?? undefined);
                        setReel((d) => ({ ...d, videoUrl: media.url }));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : C.errors.failedReadVideo);
                      } finally {
                        setUploadingMedia(false);
                      }
                    }}
                  />
                  <label className="grid gap-2">
                    <span className={composerFieldLabel}>{C.title}</span>
                    <input
                      value={reel.title}
                      onChange={(e) => setReel((d) => ({ ...d, title: e.target.value }))}
                      placeholder={C.titlePlaceholder}
                      className={composerFieldInput}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className={composerFieldLabel}>{C.description}</span>
                    <textarea
                      value={reel.description}
                      onChange={(e) => setReel((d) => ({ ...d, description: e.target.value }))}
                      placeholder={C.descriptionPlaceholder}
                      rows={5}
                      className={`${composerFieldInput} min-h-[7.5rem] resize-y`}
                    />
                  </label>
                  <TagInput
                    variant="studio"
                    label={C.hashtags}
                    value={reel.hashtags}
                    onChange={(hashtags) => setReel((d) => ({ ...d, hashtags }))}
                    placeholder={C.hashtagsPlaceholder}
                  />
                </>
              ) : (
                <>
                  <ComposerMediaUpload
                    label={C.image}
                    accept="image/*"
                    hint="PNG, JPG · up to 4 MB"
                    hasMedia={Boolean(post.imageUrl)}
                    busy={uploadingMedia}
                    disabled={saving}
                    onChange={async (e) => {
                      setError(null);
                      const input = e.target;
                      const file = input.files?.[0];
                      input.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setError(C.errors.selectImageFile);
                        return;
                      }
                      if (file.size > MAX_IMAGE_BYTES) {
                        setError(C.errors.imageTooLarge.replace("{mb}", String(Math.round(file.size / (1024 * 1024)))));
                        return;
                      }
                      try {
                        setUploadingMedia(true);
                        const probe = await probeImage(file);
                        const { media } = await uploadMedia(file, probe ?? undefined);
                        setPost((d) => ({ ...d, imageUrl: media.url }));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : C.errors.failedReadImage);
                      } finally {
                        setUploadingMedia(false);
                      }
                    }}
                  />
                  <label className="grid gap-2">
                    <span className={composerFieldLabel}>{C.title}</span>
                    <input
                      value={post.title}
                      onChange={(e) => setPost((d) => ({ ...d, title: e.target.value }))}
                      placeholder={C.titlePlaceholder}
                      className={composerFieldInput}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className={composerFieldLabel}>{C.text}</span>
                    <textarea
                      value={post.text}
                      onChange={(e) => setPost((d) => ({ ...d, text: e.target.value }))}
                      placeholder={C.textPlaceholder}
                      rows={5}
                      className={`${composerFieldInput} min-h-[7.5rem] resize-y`}
                    />
                  </label>
                  <TagInput
                    variant="studio"
                    label={C.hashtags}
                    value={post.hashtags}
                    onChange={(hashtags) => setPost((d) => ({ ...d, hashtags }))}
                    placeholder={C.hashtagsPlaceholder}
                  />
                </>
              )}

              {error ? <p className="text-xs font-semibold text-[var(--ember)]">{error}</p> : null}

              <ComposerPublishTargets
                accounts={connectedAccounts}
                loaded={accountsLoaded}
                value={kind === "reel" ? reelPublish : postPublish}
                onChange={kind === "reel" ? setReelPublish : setPostPublish}
              />
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
            disabled={saving || uploadingMedia || !createReady || !accountsLoaded}
            onClick={async () => {
              const contentId = initialData?.id;
              setError(null);
              if (kind === "reel") {
                if (!reelCreateReady || !reel.videoUrl) return;
                if (reelPublish.kind === "platforms") {
                  if (connectedAccounts.length === 0) {
                    setError(C.errors.noPlatformsConnected);
                    return;
                  }
                  if (reelPublish.platformIds.length === 0) {
                    setError(C.errors.pickPublishTargets);
                    return;
                  }
                }
                const title = reel.title.trim();
                const dateKey = effectiveDate ? dateKeyLocal(effectiveDate) : undefined;
                try {
                  setSaving(true);
                  await Promise.resolve(onCreateReel({ ...reel, title, dateKey, publish: reelPublish, contentId }));
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : messages.studio.content.errors.saveFailed);
                } finally {
                  setSaving(false);
                }
                return;
              }
              if (!postCreateReady) return;
              if (postPublish.kind === "platforms") {
                if (connectedAccounts.length === 0) {
                  setError(C.errors.noPlatformsConnected);
                  return;
                }
                if (postPublish.platformIds.length === 0) {
                  setError(C.errors.pickPublishTargets);
                  return;
                }
              }
              const dk = effectiveDate ? dateKeyLocal(effectiveDate) : undefined;
              try {
                setSaving(true);
                await Promise.resolve(
                  onCreatePost({
                    ...post,
                    title: post.title.trim(),
                    text: post.text.trim(),
                    time: post.time,
                    dateKey: dk,
                    publish: postPublish,
                    contentId,
                  }),
                );
                onClose();
              } catch (e) {
                setError(e instanceof Error ? e.message : messages.studio.content.errors.saveFailed);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving || uploadingMedia ? C.saving : initialData ? C.save : C.create}
          </StudioCreateButton>
        </div>
        </div>
      </div>
      </div>
    </StudioModalPortal>
  );
}
