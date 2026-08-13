"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, Heart, ImageIcon, MessageCircle, MoreHorizontal, Send, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export const composerFieldLabel =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

export const composerFieldInput =
  "w-full rounded-xl border border-[var(--wrapper-color-rim)] bg-white/95 px-3 py-2 text-sm text-[var(--fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[var(--muted)]/55 focus:border-[var(--ice)]/35 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/20";

export function composerInputClass(invalid?: boolean) {
  return cn(
    composerFieldInput,
    invalid &&
      "border-[var(--ember)]/55 focus:border-[var(--ember)]/70 focus:ring-[var(--ember)]/20",
  );
}

export function ComposerFieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="text-[12px] leading-snug text-[var(--ember)]" role="alert">
      {message}
    </p>
  );
}

/** Mini Instagram phone width. Same scale for feed post and reel. */
const IG_PHONE_WIDTH_CLASS = "w-[min(100%,196px)]";

/** Instagram feed allows 4:5 (portrait) through 1.91:1 (landscape). */
const IG_FEED_MIN_RATIO = 4 / 5;
const IG_FEED_MAX_RATIO = 1.91;
const IG_FEED_DEFAULT_RATIO = IG_FEED_MIN_RATIO;

function clampInstagramFeedRatio(width: number, height: number): number {
  if (!width || !height) return IG_FEED_DEFAULT_RATIO;
  const ratio = width / height;
  return Math.min(IG_FEED_MAX_RATIO, Math.max(IG_FEED_MIN_RATIO, ratio));
}

function useInstagramFeedRatio(imageUrl: string | null): number {
  const [ratio, setRatio] = useState(IG_FEED_DEFAULT_RATIO);

  useEffect(() => {
    if (!imageUrl) {
      setRatio(IG_FEED_DEFAULT_RATIO);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setRatio(clampInstagramFeedRatio(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => setRatio(IG_FEED_DEFAULT_RATIO);
    img.src = imageUrl;
  }, [imageUrl]);

  return ratio;
}

type PreviewLabels = {
  noVideo: string;
  brand: string;
  reels: string;
  captionEmpty?: string;
};

type PostPreviewLabels = {
  noImage: string;
  brand?: string;
  captionPreviewEmpty?: string;
};

function ReelMedia({ src }: { src: string }) {
  return (
    <video
      src={src}
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
      className="absolute inset-0 size-full object-cover object-center"
    />
  );
}

function formatHashtags(tags: string[]): string[] {
  return tags.map((t) => t.replace(/^#+/, "").trim()).filter(Boolean);
}

function PreviewLabel({ children }: { children: ReactNode }) {
  return (
    <p className="w-full text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
      {children}
    </p>
  );
}

export function ComposerReelPreview({
  videoUrl,
  title,
  description,
  hashtags = [],
  labels,
  footerSlot,
}: {
  videoUrl: string | null;
  title: string;
  description: string;
  hashtags?: string[];
  labels: PreviewLabels;
  footerSlot?: ReactNode;
}) {
  const captionEmpty = labels.captionEmpty ?? "Title or description will appear here";
  const tags = formatHashtags(hashtags);
  const body = description.trim();
  const heading = title.trim();
  const hasCaption = Boolean(heading || body || tags.length);

  return (
    <div className="grid justify-items-center gap-2">
      <PreviewLabel>Preview</PreviewLabel>

      <div
        className={`relative ${IG_PHONE_WIDTH_CLASS} overflow-hidden rounded-[1.15rem] bg-black shadow-[0_18px_40px_-24px_rgba(15,23,42,0.55)] ring-1 ring-black/20`}
      >
        <div className="relative aspect-[9/16] w-full">
          {videoUrl ? (
            <ReelMedia src={videoUrl} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#111113] px-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <Video className="h-4 w-4 text-white/70" strokeWidth={1.25} aria-hidden />
              </span>
              <p className="max-w-[9rem] text-center text-[10px] font-medium leading-snug text-white/50">
                {labels.noVideo}
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent px-3 pb-8 pt-3">
            <p className="text-center text-[11px] font-semibold text-white">{labels.reels}</p>
          </div>

          <div
            className="pointer-events-none absolute bottom-3 right-1.5 z-10 flex flex-col items-center gap-3.5"
            aria-hidden
          >
            <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]">
              <span className="block h-full w-full rounded-full bg-zinc-300 ring-2 ring-black" />
            </span>
            <Heart className="h-[18px] w-[18px] text-white" strokeWidth={1.7} />
            <MessageCircle className="h-[18px] w-[18px] text-white" strokeWidth={1.7} />
            <Send className="h-[18px] w-[18px] text-white" strokeWidth={1.7} />
            <MoreHorizontal className="h-[18px] w-[18px] text-white" strokeWidth={1.7} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-10 pr-9">
            {hasCaption ? (
              <div className="space-y-0.5">
                <p className="truncate text-[11px] font-semibold text-white">
                  {heading || labels.brand}
                </p>
                {body ? (
                  <p className="text-[10px] leading-snug text-white/90 line-clamp-2 whitespace-pre-wrap">
                    {body}
                  </p>
                ) : null}
                {tags.length ? (
                  <p className="text-[10px] leading-snug text-white/90 line-clamp-2">
                    {tags.map((t) => `#${t}`).join(" ")}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[10px] italic text-white/45">{captionEmpty}</p>
            )}
          </div>
        </div>
      </div>

      {footerSlot ? <div className={IG_PHONE_WIDTH_CLASS}>{footerSlot}</div> : null}
    </div>
  );
}

function IgHashtagLine({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <>
      {tags.map((t, i) => (
        <span key={t}>
          {i > 0 ? " " : ""}
          <span className="text-[#00376b]">#{t}</span>
        </span>
      ))}
    </>
  );
}

export function ComposerPostPreview({
  imageUrl,
  title,
  text,
  hashtags = [],
  labels,
  footerSlot,
}: {
  imageUrl: string | null;
  title: string;
  text: string;
  hashtags?: string[];
  labels: PostPreviewLabels;
  footerSlot?: ReactNode;
}) {
  const brand = labels.brand ?? "instagram";
  const captionEmpty = labels.captionPreviewEmpty ?? "Caption will appear here";
  const caption = [title.trim(), text.trim()].filter(Boolean).join("\n");
  const tags = formatHashtags(hashtags);
  const hasCaption = Boolean(caption || tags.length);
  const feedRatio = useInstagramFeedRatio(imageUrl);

  return (
    <div className="grid justify-items-center gap-2">
      <PreviewLabel>Preview</PreviewLabel>

      <div
        className={`${IG_PHONE_WIDTH_CLASS} overflow-hidden bg-white font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-[#262626] shadow-[0_12px_32px_-18px_rgba(15,23,42,0.35)] ring-1 ring-black/12`}
      >
        <div className="flex h-9 items-center gap-2 px-2">
          <span className="size-[18px] shrink-0 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]">
            <span className="block size-full rounded-full bg-white p-px">
              <span className="block size-full rounded-full bg-zinc-300" />
            </span>
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-none">{brand}</span>
          <MoreHorizontal className="size-3.5 shrink-0 text-[#262626]" strokeWidth={2} aria-hidden />
        </div>

        <div className="relative w-full bg-black" style={{ aspectRatio: String(feedRatio) }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#fafafa]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white">
                <ImageIcon className="h-3.5 w-3.5 text-[#8e8e8e]" strokeWidth={1.25} aria-hidden />
              </span>
              <p className="max-w-[9rem] text-center text-[10px] font-medium leading-snug text-[#8e8e8e]">
                {labels.noImage}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center px-2 pt-1.5" aria-hidden>
          <div className="flex items-center gap-2.5">
            <Heart className="size-[18px]" strokeWidth={1.7} />
            <MessageCircle className="size-[18px]" strokeWidth={1.7} />
            <Send className="size-[18px]" strokeWidth={1.7} />
          </div>
          <Bookmark className="ml-auto size-[18px]" strokeWidth={1.7} />
        </div>

        <div className="px-2 pb-2.5 pt-1 text-[11px] leading-[1.35]">
          {hasCaption ? (
            <p className="line-clamp-4 whitespace-pre-wrap">
              <span className="font-semibold">{brand}</span>
              {caption ? ` ${caption}` : null}
              {tags.length ? (
                <>
                  {" "}
                  <IgHashtagLine tags={tags} />
                </>
              ) : null}
            </p>
          ) : (
            <p className="italic text-[#8e8e8e]">{captionEmpty}</p>
          )}
        </div>
      </div>

      {footerSlot ? <div className={IG_PHONE_WIDTH_CLASS}>{footerSlot}</div> : null}
    </div>
  );
}
