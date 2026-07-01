"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type MenuButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  /** Label-only chip (selected tile name) — not interactive. */
  static?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children">;

function joinClasses(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

export const menuButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200/90 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-neutral-900 shadow-sm transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 sm:min-h-11 sm:px-5 sm:text-base";

export function MenuButton({
  children,
  onClick,
  static: isStatic = false,
  className,
  ...rest
}: MenuButtonProps) {
  if (isStatic) {
    return (
      <span
        className={joinClasses(menuButtonClass, "cursor-default hover:bg-white", className)}
        aria-live="polite"
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(menuButtonClass, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
