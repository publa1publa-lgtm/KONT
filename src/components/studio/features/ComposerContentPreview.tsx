"use client";

import type { ReactNode } from "react";
import { Heart, ImageIcon, MessageCircle, Send, Video } from "lucide-react";
import { VideoPreview } from "@/components/calendar/VideoPreview";

export const composerFieldLabel =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

export const composerFieldInput =
  "w-full rounded-xl border border-[var(--wrapper-color-rim)] bg-white/95 px-3 py-2 text-sm text-[var(--fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[var(--muted)]/55 focus:border-[var(--ice)]/35 focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/20";

const previewShell =
  "composer-preview overflow-hidden rounded-2xl border border-[var(--wrapper-color-rim)] bg-[var(--wrapper-color-bg)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";

type PreviewLabels = {
  noVideo: string;
  brand: string;
  reels: string;
  captionEmpty?: string;
};

type PostPreviewLabels = {
  noImage: string;
  captionPreviewEmpty?: string;
};

function formatHashtags(tags: string[]): string {
  if (tags.length === 0) return "";
  return tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
}

function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className={previewShell}>
      <div className="relative flex flex-col items-center gap-2">{children}</div>
    </div>
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
  const hashtagLine = formatHashtags(hashtags);
  const body = [description.trim(), hashtagLine].filter(Boolean).join("\n");
  const hasCaption = Boolean(title.trim() || body);

  return (
    <PreviewShell>
      <p className="w-full px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        Preview
      </p>

      <div className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.15rem] border border-[var(--wrapper-color-rim)] bg-zinc-950 shadow-[0_18px_44px_-26px_rgba(15,23,42,0.5)]">
        <div className="relative aspect-[9/16] w-full">
          {videoUrl ? (
            <VideoPreview videoUrl={videoUrl} fill muted controls={false} autoPlay loop />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.06),transparent_58%),#111113] px-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <Video className="h-4 w-4 text-white/70" strokeWidth={1.25} aria-hidden />
              </span>
              <p className="max-w-[10rem] text-center text-[10px] font-medium leading-snug text-white/50">
                {labels.noVideo}
              </p>
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/55 via-black/15 to-transparent px-3 pb-8 pt-3"
            aria-hidden
          >
            <p className="text-center text-[10px] font-semibold tracking-[0.04em] text-white/90">{labels.reels}</p>
          </div>

          <div
            className="pointer-events-none absolute bottom-0 right-2 top-1/4 z-10 flex flex-col items-center justify-end gap-3 pb-16"
            aria-hidden
          >
            <span className="h-7 w-7 rounded-full border border-white/35 bg-white/10 ring-2 ring-black/20" />
            <Heart className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={1.6} />
            <MessageCircle className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={1.6} />
            <Send className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" strokeWidth={1.6} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-14 pr-10">
            {hasCaption ? (
              <div className="space-y-0.5">
                <p className="truncate text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {title.trim() || labels.brand}
                </p>
                {body ? (
                  <p className="text-[9px] leading-snug text-white/88 line-clamp-3 whitespace-pre-wrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                    {body}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-[9px] italic text-white/45">{captionEmpty}</p>
            )}
          </div>
        </div>
      </div>

      {footerSlot ? <div className="w-full max-w-[220px]">{footerSlot}</div> : null}
    </PreviewShell>
  );
}

export function ComposerPostPreview({
  imageUrl,
  title,
  text,
  labels,
  footerSlot,
}: {
  imageUrl: string | null;
  title: string;
  text: string;
  labels: PostPreviewLabels;
  footerSlot?: ReactNode;
}) {
  const captionEmpty = labels.captionPreviewEmpty ?? "Caption will appear here";
  const hasCaption = Boolean(title.trim() || text.trim());

  return (
    <PreviewShell>
      <p className="w-full px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        Preview
      </p>

      <div className="w-full max-w-[248px] overflow-hidden rounded-xl border border-[var(--wrapper-color-rim)] bg-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-18px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-2 border-b border-[var(--line)]/45 px-2.5 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ice)]/30 to-[var(--studio-surface-2)] ring-1 ring-[var(--ice)]/18" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-[var(--fg)]">Content Fabric</span>
            <span className="block text-[9px] text-[var(--muted)]">Feed</span>
          </span>
        </div>

        <div className="relative aspect-[4/5] w-full bg-[var(--studio-preview)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,rgba(0,234,255,0.05),transparent_50%)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white/70">
                <ImageIcon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.25} aria-hidden />
              </span>
              <p className="max-w-[10rem] text-center text-[10px] font-medium leading-snug text-[var(--muted)]">
                {labels.noImage}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-0.5 border-t border-[var(--line)]/45 px-2.5 py-2">
          {hasCaption ? (
            <>
              {title.trim() ? (
                <p className="text-[11px] font-semibold leading-snug text-[var(--fg)] line-clamp-2">{title}</p>
              ) : null}
              {text.trim() ? (
                <p className="text-[10px] leading-relaxed text-[var(--muted)] line-clamp-3 whitespace-pre-wrap">{text}</p>
              ) : null}
            </>
          ) : (
            <p className="text-[10px] italic text-[var(--muted)]/70">{captionEmpty}</p>
          )}
        </div>

        <div
          className="flex items-center gap-3.5 border-t border-[var(--line)]/35 px-2.5 py-1.5 text-[var(--muted)]"
          aria-hidden
        >
          <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
      </div>

      {footerSlot ? <div className="w-full max-w-[248px]">{footerSlot}</div> : null}
    </PreviewShell>
  );
}
