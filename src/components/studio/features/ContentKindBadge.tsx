/** Fixed slot width for POST/REEL/EVENT badge in the type column. */
export const CONTENT_KIND_BADGE_SLOT_CLASS = "flex w-[3.75rem] shrink-0";

type ContentKind = "post" | "reel" | "event";
type ContentKindBadgeAlign = "start" | "center";

const kindClass: Record<ContentKind, string> = {
  reel: "border-[var(--ice)]/30 bg-[var(--ice)]/12 text-[var(--ice)]",
  post: "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)]/75",
  event: "border-amber-400/35 bg-amber-400/12 text-amber-100",
};

export function ContentKindBadge({
  kind,
  reelLabel,
  postLabel,
  eventLabel = "Event",
  align = "start",
}: {
  kind: ContentKind;
  reelLabel: string;
  postLabel: string;
  eventLabel?: string;
  align?: ContentKindBadgeAlign;
}) {
  const label = kind === "reel" ? reelLabel : kind === "event" ? eventLabel : postLabel;
  const pill = (
    <span
      className={[
        "font-display inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        kindClass[kind],
      ].join(" ")}
    >
      {label}
    </span>
  );

  if (align === "center") {
    return pill;
  }

  return <span className={[CONTENT_KIND_BADGE_SLOT_CLASS, "justify-start"].join(" ")}>{pill}</span>;
}

/** Maps Content API type strings (`POST` | `REEL`) to composer/badge kinds. Pass `"event"` explicitly for PlanEvents. */
export function contentKindFromApiType(type: string): Exclude<ContentKind, "event"> {
  const t = String(type).toUpperCase();
  if (t === "REEL") return "reel";
  return "post";
}
