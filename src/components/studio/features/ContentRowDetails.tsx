"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { useI18n } from "@/contexts/i18n-context";
import { formatTemplate } from "@/lib/formatTemplate";
import { intlLocale } from "@/i18n/config";
import { fetchContentTargets, type ContentTargetApi } from "@/lib/contentApi";
import { platformKindToReelPlatformId, REEL_PLATFORM_IDS, type ReelPlatformId } from "@/lib/reelPlatformIds";
import { PlatformKind } from "@prisma/client";
import { platformBrandAccent, platformIconTileStyle } from "./platformCardStyles";
import {
  FacebookLogo,
  InstagramLogo,
  LinkedInLogo,
  PinterestLogo,
  TikTokLogo,
  YouTubeLogo,
} from "./platformLogos";

type TargetStatus = "pending" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";

function formatViewCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatPublishedAt(
  value: string | null,
  locale: string,
): { iso: string; label: string; title: string } | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const label = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  const title = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  return { iso: d.toISOString(), label, title };
}

function statusKey(status: string): TargetStatus {
  const s = status.toLowerCase();
  if (s === "scheduled" || s === "publishing" || s === "published" || s === "failed" || s === "cancelled") return s;
  return "pending";
}

function softStatusClass(status: TargetStatus): string {
  const base = "studio-library-row__detail-tag";
  switch (status) {
    case "scheduled":
      return `${base} studio-library-row__detail-tag--scheduled`;
    case "publishing":
      return `${base} studio-library-row__detail-tag--publishing`;
    case "cancelled":
      return `${base} studio-library-row__detail-tag--muted`;
    default:
      return `${base} studio-library-row__detail-tag--muted`;
  }
}

function platformKindFromApi(platform: string): PlatformKind | null {
  if ((Object.values(PlatformKind) as string[]).includes(platform)) {
    return platform as PlatformKind;
  }
  return null;
}

function sortTargets(targets: ContentTargetApi[]): ContentTargetApi[] {
  const order = new Map(REEL_PLATFORM_IDS.map((id, index) => [id, index]));
  return [...targets].sort((a, b) => {
    const ra = platformKindFromApi(a.platform);
    const rb = platformKindFromApi(b.platform);
    const ia = ra ? platformKindToReelPlatformId(ra) : null;
    const ib = rb ? platformKindToReelPlatformId(rb) : null;
    return (ia ? (order.get(ia) ?? 99) : 99) - (ib ? (order.get(ib) ?? 99) : 99);
  });
}

function PlatformGlyph({ id, className }: { id: ReelPlatformId; className?: string }) {
  switch (id) {
    case "youtube":
      return <YouTubeLogo className={className} />;
    case "tiktok":
      return <TikTokLogo className={className} />;
    case "instagram":
      return <InstagramLogo className={className} />;
    case "facebook":
      return <FacebookLogo className={className} />;
    case "pinterest":
      return <PinterestLogo className={className} />;
    case "linkedin":
      return <LinkedInLogo className={className} />;
  }
}

type DateSlot =
  | { kind: "error"; label: string; title: string }
  | { kind: "date"; iso: string; label: string; title: string }
  | { kind: "status"; status: TargetStatus; label: string }
  | { kind: "empty"; label: string };

function resolveDateSlot(
  target: ContentTargetApi,
  labels: {
    missingOnPlatform: string;
    failed: string;
    status: Record<TargetStatus, string>;
    empty: string;
  },
  locale: string,
): DateSlot {
  const st = statusKey(target.status);

  if (st === "failed") {
    const label = target.errorMessage?.trim() || labels.failed;
    return { kind: "error", label, title: target.errorMessage?.trim() || labels.failed };
  }

  if (target.live === false) {
    return {
      kind: "error",
      label: labels.missingOnPlatform,
      title: target.errorMessage?.trim() || labels.missingOnPlatform,
    };
  }

  if (st === "published" && !target.remoteId) {
    return { kind: "error", label: labels.missingOnPlatform, title: labels.missingOnPlatform };
  }

  const published = formatPublishedAt(target.publishedAt, locale);
  if (published) {
    return { kind: "date", iso: published.iso, label: published.label, title: published.title };
  }

  if (st === "scheduled" || st === "publishing" || st === "pending" || st === "cancelled") {
    return { kind: "status", status: st, label: labels.status[st] };
  }

  return { kind: "empty", label: labels.empty };
}

function TargetRow({
  target,
  platformLabel,
  viewsLabel,
  viewsUnknown,
  dateSlot,
  openLabel,
  locale,
}: {
  target: ContentTargetApi;
  platformLabel: string;
  viewsLabel: string;
  viewsUnknown: string;
  dateSlot: DateSlot;
  openLabel: string;
  locale: string;
}) {
  const kind = platformKindFromApi(target.platform);
  const reelId = kind ? platformKindToReelPlatformId(kind) : null;
  const accent = reelId ? platformBrandAccent(reelId) : "var(--ice)";
  const handle = target.handle?.replace(/^@/, "") ?? null;

  const viewsText =
    target.views == null ? viewsUnknown : formatViewCount(target.views, locale);
  const viewsTitle =
    target.views == null
      ? viewsUnknown
      : formatTemplate(viewsLabel, { count: formatViewCount(target.views, locale) });

  return (
    <li className="studio-library-row__detail-row">
      <div className="studio-library-row__detail-platform">
        <span
          className="studio-library-row__detail-tile"
          style={platformIconTileStyle(accent)}
          aria-hidden
        >
          {reelId ? <PlatformGlyph id={reelId} className="h-3 w-3" /> : null}
        </span>
        <div className="min-w-0">
          <p className="studio-library-row__detail-platform-name">{platformLabel}</p>
          {handle ? <p className="studio-library-row__detail-platform-handle">@{handle}</p> : null}
        </div>
      </div>

      {dateSlot.kind === "error" ? (
        <span className="studio-library-row__detail-tag studio-library-row__detail-tag--danger" title={dateSlot.title}>
          {dateSlot.label}
        </span>
      ) : dateSlot.kind === "date" ? (
        <time className="studio-library-row__detail-date" dateTime={dateSlot.iso} title={dateSlot.title}>
          {dateSlot.label}
        </time>
      ) : dateSlot.kind === "status" ? (
        <span className={softStatusClass(dateSlot.status)}>{dateSlot.label}</span>
      ) : (
        <span className="studio-library-row__detail-date studio-library-row__detail-date--empty">{dateSlot.label}</span>
      )}

      <span className="studio-library-row__detail-metric" title={viewsTitle}>
        {viewsText}
      </span>

      {target.permalink ? (
        <a
          href={target.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="studio-library-row__detail-link"
          aria-label={openLabel}
          title={openLabel}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : (
        <span className="studio-library-row__detail-link studio-library-row__detail-link--empty" aria-hidden />
      )}
    </li>
  );
}

export function ContentRowDetails({ contentId }: { contentId: string }) {
  const { locale, messages } = useI18n();
  const D = messages.studio.content.details;
  const platformNames = messages.studio.inbox.platform;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<ContentTargetApi[]>([]);

  const labels = useMemo(
    (): Record<ReelPlatformId, string> => ({
      youtube: platformNames.youtube,
      tiktok: platformNames.tiktok,
      instagram: platformNames.instagram,
      facebook: platformNames.facebook,
      pinterest: platformNames.pinterest,
      linkedin: platformNames.linkedin,
    }),
    [platformNames],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchContentTargets(contentId)
      .then((rows) => {
        if (cancelled) return;
        setTargets(sortTargets(rows));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : D.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contentId, D.loadFailed]);

  if (loading) {
    return <p className="studio-library-row__detail-copy">{D.loading}</p>;
  }
  if (error) {
    return <p className="studio-library-row__detail-copy studio-library-row__detail-copy--error">{error}</p>;
  }
  if (targets.length === 0) {
    return <p className="studio-library-row__detail-copy">{D.empty}</p>;
  }

  const intl = intlLocale(locale);
  const slotLabels = {
    missingOnPlatform: D.missingOnPlatform,
    failed: D.status.failed,
    status: D.status,
    empty: D.viewsUnknown,
  };

  return (
    <div className="studio-library-row__detail-panel">
      <div className="studio-library-row__detail-head" aria-hidden>
        <span className="studio-library-row__detail-head-platform">{D.title}</span>
        <span className="studio-library-row__detail-head-date">{D.dateCol}</span>
        <span className="studio-library-row__detail-head-views">{D.viewsCol}</span>
        <span className="studio-library-row__detail-head-spacer" aria-hidden />
      </div>
      <ul className="studio-library-row__detail-list">
        {targets.map((target) => {
          const kind = platformKindFromApi(target.platform);
          const reelId = kind ? platformKindToReelPlatformId(kind) : null;
          const platformLabel = reelId ? labels[reelId] : target.platform;
          return (
            <TargetRow
              key={target.id}
              target={target}
              platformLabel={platformLabel}
              viewsLabel={D.views}
              viewsUnknown={D.viewsUnknown}
              dateSlot={resolveDateSlot(target, slotLabels, intl)}
              openLabel={D.openPost}
              locale={intl}
            />
          );
        })}
      </ul>
    </div>
  );
}
