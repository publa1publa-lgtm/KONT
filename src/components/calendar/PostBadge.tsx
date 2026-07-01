"use client";

import type { ScheduledPost } from "./types";

export function PostBadge({ post }: { post: ScheduledPost }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="cal-badge flex min-h-[1.75rem] w-full touch-manipulation items-center truncate rounded-md px-1.5 py-1 text-left text-[10px] leading-tight text-[var(--fg)] sm:min-h-[2rem] sm:px-2 sm:py-1"
      title={`${post.time} — ${post.title}`}
    >
      <span className="mr-2 inline-flex h-1.5 w-1.5 align-middle rounded-full bg-white/55" />
      <span className="font-mono text-[var(--muted)]">{post.time}</span>{" "}
      <span className="font-medium">{post.title}</span>
      <span className="ml-2 text-[9px] text-[var(--muted)]">Post</span>
    </button>
  );
}

