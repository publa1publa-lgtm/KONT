"use client";

import { useI18n } from "@/contexts/i18n-context";
import type { ComposerPublishSelection, ConnectedPlatformAccount } from "@/lib/composerPublish";
import { ComposerFieldError } from "./ComposerContentPreview";

type Props = {
  accounts: ConnectedPlatformAccount[];
  loaded: boolean;
  value: ComposerPublishSelection;
  onChange: (next: ComposerPublishSelection) => void;
  error?: string;
};

export function ComposerPublishTargets({ accounts, loaded, value, onChange, error }: Props) {
  const { messages } = useI18n();
  const P = messages.studio.content.composer.publishing;
  const platformLabels = messages.studio.inbox.platform;

  const shellClass = [
    "rounded-2xl border bg-[var(--studio-surface-3)] p-4",
    error ? "border-[var(--ember)]/40" : "border-[var(--line)]",
  ].join(" ");

  if (!loaded) {
    return (
      <div className={shellClass}>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{P.title}</div>
        <p className="mt-2 text-sm text-[var(--muted)]">{P.loadingAccounts}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={shellClass}>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{P.title}</div>
        <p className="mt-2 text-sm font-semibold text-[var(--fg)]">{P.draftOnlyTitle}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{P.draftOnlyBody}</p>
        <div className="mt-2">
          <ComposerFieldError message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{P.title}</div>
      <p className="mt-1 text-sm text-[var(--muted)]">{P.intro}</p>

      <div className="mt-4 grid gap-2">
        <label
          className={[
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
            value.kind === "draft"
              ? "border-[var(--ice)]/30 bg-[var(--ice)]/8"
              : "border-[var(--line)] bg-[var(--studio-surface-3)] hover:bg-[var(--studio-surface-2)]",
          ].join(" ")}
        >
          <input
            type="radio"
            className="mt-1"
            name="composer-publish-mode"
            checked={value.kind === "draft"}
            onChange={() => onChange({ kind: "draft" })}
          />
          <div>
            <div className="text-sm font-semibold text-[var(--fg)]">{P.draftLabel}</div>
            <div className="text-xs text-[var(--muted)]">{P.draftHint}</div>
          </div>
        </label>

        <label
          className={[
            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
            value.kind === "platforms"
              ? "border-[var(--ice)]/30 bg-[var(--ice)]/8"
              : "border-[var(--line)] bg-[var(--studio-surface-3)] hover:bg-[var(--studio-surface-2)]",
          ].join(" ")}
        >
          <input
            type="radio"
            className="mt-1"
            name="composer-publish-mode"
            checked={value.kind === "platforms"}
            onChange={() => {
              const first = accounts[0]?.platformId;
              onChange({
                kind: "platforms",
                platformIds: first ? [first] : [],
              });
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--fg)]">{P.connectedLabel}</div>
            <div className="mt-2 space-y-2">
              {accounts.map((a) => {
                const checked = value.kind === "platforms" && value.platformIds.includes(a.platformId);
                const label =
                  a.platformId in platformLabels
                    ? platformLabels[a.platformId as keyof typeof platformLabels]
                    : a.platformId;
                return (
                  <label
                    key={a.id}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2",
                      value.kind !== "platforms" ? "pointer-events-none opacity-45" : "",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={value.kind !== "platforms"}
                      onChange={(e) => {
                        if (value.kind !== "platforms") return;
                        const next = new Set(value.platformIds);
                        if (e.target.checked) next.add(a.platformId);
                        else next.delete(a.platformId);
                        onChange({ kind: "platforms", platformIds: Array.from(next) });
                      }}
                    />
                    <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
                    {a.handle ? <span className="truncate text-xs text-[var(--muted)]">{a.handle}</span> : null}
                  </label>
                );
              })}
            </div>
          </div>
        </label>
      </div>
      <div className="mt-3">
        <ComposerFieldError message={error} />
      </div>
    </div>
  );
}
