"use client";

import type { ReactNode } from "react";

import { StudioCreateButton, formatStudioCreateCta } from "./StudioCreateButton";

export const STUDIO_CREATE_VIEW_CLASS = "studio-create-view";

export { formatStudioCreateCta };

export const studioCreatePanel =
  "cal-surface relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl p-4 sm:rounded-3xl sm:p-5";

type StudioCreateShellProps = {
  children: ReactNode;
  createLabel?: string;
  onCreate?: () => void;
  createDisabled?: boolean;
  showCreate?: boolean;
};

export function StudioCreateShell({
  children,
  createLabel,
  onCreate,
  createDisabled = false,
  showCreate = true,
}: StudioCreateShellProps) {
  const canCreate = showCreate && Boolean(createLabel && onCreate);

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col gap-5 sm:gap-6 lg:h-full ${STUDIO_CREATE_VIEW_CLASS}`}
    >
      {canCreate ? (
        <div className="self-end shrink-0">
          <StudioCreateButton onClick={onCreate} disabled={createDisabled}>
            {createLabel}
          </StudioCreateButton>
        </div>
      ) : null}

      <div className={studioCreatePanel}>
        <div className="pointer-events-none absolute inset-0 opacity-30 cal-grid-lines" aria-hidden />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
