/** Fixed slot width for POST/REEL badge in the type column. */
export const CONTENT_KIND_BADGE_SLOT_CLASS = "flex w-[3.35rem] shrink-0";

type ContentKind = "post" | "reel";
type ContentKindBadgeAlign = "start" | "center";

const kindClass: Record<ContentKind, string> = {
  reel: "border-[var(--ice)]/30 bg-[var(--ice)]/12 text-[var(--ice)]",
  post: "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)]/75",
};

export function ContentKindBadge({
  kind,
  reelLabel,
  postLabel,
  align = "start",
}: {
  kind: ContentKind;
  reelLabel: string;
  postLabel: string;
  align?: ContentKindBadgeAlign;
}) {
  const pill = (
    <span
      className={[
        "font-display inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        kindClass[kind],
      ].join(" ")}
    >
      {kind === "reel" ? reelLabel : postLabel}
    </span>
  );

  if (align === "center") {
    return pill;
  }

  return <span className={[CONTENT_KIND_BADGE_SLOT_CLASS, "justify-start"].join(" ")}>{pill}</span>;
}
