"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import type { CloudFile, CloudFileKind, CloudMediaOrigin, CloudProviderId } from "@/lib/cloud/types";
import { StudioDialog } from "./StudioDialog";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { GoogleDriveLogo } from "./platformLogos";
import { composerInputClass } from "./ComposerContentPreview";

type Props = {
  open: boolean;
  kind: CloudFileKind;
  provider?: CloudProviderId;
  busy?: boolean;
  onClose: () => void;
  onPicked: (origin: CloudMediaOrigin, mediaUrl: string, mediaId: string) => void;
};

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposerCloudPicker({
  open,
  kind,
  provider = "googleDrive",
  busy = false,
  onClose,
  onPicked,
}: Props) {
  const { messages } = useI18n();
  const C = messages.studio.content.composer.cloud;
  const [query, setQuery] = useState("");
  const [link, setLink] = useState("");
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLink("");
      setFiles([]);
      setHint(null);
      setError(null);
      setImportingId(null);
      return;
    }

    const ac = new AbortController();
    const params = new URLSearchParams({ provider, kind });
    setLoading(true);
    fetch(`/api/cloud/files?${params.toString()}`, { signal: ac.signal })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          files?: CloudFile[];
          hint?: string;
          error?: string;
        };
        if (!r.ok) throw new Error(data.error || C.loadFailed);
        setFiles(Array.isArray(data.files) ? data.files : []);
        setHint(typeof data.hint === "string" ? data.hint : null);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err.message : C.loadFailed);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [C.loadFailed, kind, open, provider]);

  async function search() {
    const params = new URLSearchParams({ provider, kind });
    if (query.trim()) params.set("q", query.trim());
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/cloud/files?${params.toString()}`);
      const data = (await r.json().catch(() => ({}))) as {
        files?: CloudFile[];
        hint?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || C.loadFailed);
      setFiles(Array.isArray(data.files) ? data.files : []);
      setHint(typeof data.hint === "string" ? data.hint : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : C.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function importRef(fileId?: string, url?: string) {
    setError(null);
    setImportingId(fileId || url || "link");
    try {
      const r = await fetch("/api/cloud/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, fileId, url }),
      });
      const data = (await r.json().catch(() => ({}))) as {
        media?: { id: string; url: string; filename: string; origin?: CloudMediaOrigin | null };
        origin?: CloudMediaOrigin;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || C.importFailed);
      const origin =
        data.origin ??
        data.media?.origin ?? {
          provider,
          fileId: fileId || "",
          label: data.media?.filename || "Cloud file",
          webViewUrl: null,
        };
      if (!data.media?.url || !data.media.id) throw new Error(C.importFailed);
      onPicked(origin, data.media.url, data.media.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : C.importFailed);
    } finally {
      setImportingId(null);
    }
  }

  const hintText =
    hint === "not_connected"
      ? C.hintNotConnected
      : hint === "reconnect_readonly"
        ? C.hintReadonly
        : hint === "not_implemented"
          ? C.hintSoon
          : null;

  return (
    <StudioDialog
      open={open}
      onClose={busy || importingId ? () => undefined : onClose}
      title={C.title}
      widthClassName="w-full max-w-[560px]"
      cancelLabel={messages.common.cancel}
      footer={
        <div className="flex justify-end gap-2">
          <StudioGhostButton type="button" className="studio-btn-ghost--md" onClick={onClose} disabled={Boolean(importingId)}>
            {messages.common.cancel}
          </StudioGhostButton>
        </div>
      }
    >
      <div className="grid gap-3">
        <p className="text-sm leading-relaxed text-[var(--muted)]">{C.intro}</p>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{C.searchPlaceholder}</span>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={C.searchPlaceholder}
              className={`${composerInputClass()} ps-9`}
            />
          </label>
          <StudioGhostButton type="submit" className="studio-btn-ghost--md shrink-0" disabled={loading}>
            {C.search}
          </StudioGhostButton>
        </form>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (link.trim()) void importRef(undefined, link.trim());
          }}
        >
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={C.linkPlaceholder}
            className={composerInputClass()}
          />
          <StudioCreateButton
            type="submit"
            className="studio-create-btn--sm shrink-0"
            disabled={!link.trim() || Boolean(importingId)}
          >
            {C.useLink}
          </StudioCreateButton>
        </form>

        {error ? <p className="text-sm text-[var(--ember)]">{error}</p> : null}
        {hintText && !error ? <p className="text-xs leading-relaxed text-[var(--muted)]">{hintText}</p> : null}

        <div className="max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain rounded-xl border border-[var(--line)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-[var(--muted)]">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {C.loading}
            </div>
          ) : files.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">{C.empty}</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {files.map((file) => {
                const importing = importingId === file.id;
                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      disabled={Boolean(importingId)}
                      onClick={() => void importRef(file.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition hover:bg-[color-mix(in_srgb,var(--ice)_8%,transparent)] disabled:opacity-60"
                    >
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--studio-surface-3)]">
                        {file.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.thumbnailUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <GoogleDriveLogo className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--fg)]">{file.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                          {[formatSize(file.sizeBytes), file.mimeType.replace(/^.*\//, "")].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {importing ? <Loader2 className="size-4 shrink-0 animate-spin text-[var(--ice)]" aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </StudioDialog>
  );
}
