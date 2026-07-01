"use client";

import { useLayoutEffect, useRef, useState } from "react";

const chipClass =
  "inline-flex max-w-[9rem] shrink-0 items-center rounded-full border border-[var(--ice)]/28 bg-[var(--ice)]/10 px-2 py-0.5 text-[10px] font-medium leading-tight text-[var(--ice)]";

const overflowClass =
  "inline-flex shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-2 py-0.5 font-display text-[10px] font-semibold tabular-nums text-[var(--muted)]";

function normalizeHashtag(tag: string): string {
  return tag.trim().replace(/^#+/, "");
}

function countChipRows(container: HTMLElement): number {
  const tops = new Set<number>();
  container.querySelectorAll("[data-hashtag-chip]").forEach((node) => {
    tops.add((node as HTMLElement).offsetTop);
  });
  return tops.size;
}

type ContentHashtagChipsProps = {
  tags?: string[];
  /** Max wrapped lines before collapsing the rest into +N. */
  maxLines?: number;
  size?: "sm" | "md";
  center?: boolean;
};

export function ContentHashtagChips({ tags, maxLines = 2, size = "sm", center = false }: ContentHashtagChipsProps) {
  const cleaned = (tags ?? []).map(normalizeHashtag).filter(Boolean);
  const cleanedKey = cleaned.join("\0");
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(cleaned.length);

  useLayoutEffect(() => {
    setVisibleCount(cleaned.length);
  }, [cleanedKey]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !cleaned.length) return;

    const rows = countChipRows(el);
    if (rows > maxLines && visibleCount > 0) {
      setVisibleCount((n) => Math.max(0, n - 1));
    }
  }, [cleaned.length, cleanedKey, maxLines, visibleCount]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setVisibleCount(cleaned.length);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cleaned.length, cleanedKey]);

  if (!cleaned.length) {
    return (
      <span className={["block text-[11px] text-[var(--muted)]", center ? "text-center" : ""].join(" ")}>—</span>
    );
  }

  const visible = cleaned.slice(0, visibleCount);
  const overflow = cleaned.length - visible.length;
  const gap = size === "md" ? "gap-1.5" : "gap-1";

  return (
    <div
      ref={containerRef}
      className={["flex flex-wrap", gap, center ? "justify-center" : ""].join(" ")}
      role="list"
    >
      {visible.map((tag) => (
        <span key={tag} data-hashtag-chip className={chipClass} title={`#${tag}`} role="listitem">
          <span className="truncate">#{tag}</span>
        </span>
      ))}
      {overflow > 0 ? (
        <span
          data-hashtag-chip
          className={overflowClass}
          title={cleaned.slice(visibleCount).map((t) => `#${t}`).join(" ")}
          role="listitem"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
