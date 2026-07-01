"use client";

import type { ReactNode } from "react";

export type TabSpec<T extends string> = {
  id: T;
  label: string;
  hint?: string;
};

export function Tabs<T extends string>({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Array<TabSpec<T>>;
  activeId: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              "group inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              "focus:outline-none focus:ring-2 focus:ring-[var(--ice)]/40",
              active
                ? "border-[var(--ice)]/28 bg-[var(--ice)]/12 text-[var(--ice)] shadow-[0_18px_60px_-44px_rgba(0,234,255,0.22)]"
                : "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)] hover:bg-[var(--studio-surface-2)]",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span>{t.label}</span>
            {t.hint ? <span className="hidden text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--fg)]/70 sm:inline">{t.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  children,
  hidden,
}: {
  children: ReactNode;
  hidden: boolean;
}) {
  return (
    <div className={hidden ? "hidden" : "block"}>
      {children}
    </div>
  );
}

