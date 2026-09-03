"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Inbox, Loader2, RefreshCw, SendHorizontal } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { toast } from "@/lib/toast";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { StudioHeader } from "./StudioHeader";
import { FacebookLogo, InstagramLogo } from "./platformLogos";
import type { StudioItemViewProps } from "../itemRegistry";

type InboxPlatform = "instagram" | "messenger";

type Participant = { id: string; name: string | null; username: string | null };

type InboxMessage = {
  id: string;
  body: string;
  createdAt: string | null;
  from: Participant;
  direction: "inbound" | "outbound";
};

type InboxThread = {
  id: string;
  platform: InboxPlatform;
  updatedAt: string | null;
  snippet: string | null;
  peer: Participant | null;
  messages: InboxMessage[];
};

type InboxPayload = {
  pageId: string;
  pageName: string;
  threads: InboxThread[];
  ephemeral?: boolean;
  error?: string;
  code?: string;
};

function peerLabel(peer: Participant | null): string {
  if (!peer) return "Conversation";
  if (peer.username) return peer.username.startsWith("@") ? peer.username : `@${peer.username}`;
  return peer.name || peer.id;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function InboxView(_props: StudioItemViewProps) {
  const { messages } = useI18n();
  const I = messages.studio.inbox;

  const [platform, setPlatform] = useState<InboxPlatform>("instagram");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pageName, setPageName] = useState<string | null>(null);
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = useMemo(() => threads.find((th) => th.id === activeId) ?? null, [activeId, threads]);

  const load = useCallback(async (nextPlatform: InboxPlatform) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/meta/inbox?platform=${nextPlatform}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as InboxPayload;
      if (!res.ok) {
        setThreads([]);
        setActiveId(null);
        setPageName(null);
        setError(data.error || I.loadFailed);
        setErrorCode(typeof data.code === "string" ? data.code : null);
        return;
      }
      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setPageName(data.pageName || null);
      setActiveId(data.threads?.[0]?.id ?? null);
    } catch {
      setThreads([]);
      setActiveId(null);
      setError(I.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [I.loadFailed]);

  useEffect(() => {
    void load(platform);
  }, [load, platform]);

  async function sendReply() {
    if (!active?.peer?.id || !draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/meta/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          recipientId: active.peer.id,
          text: draft,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || I.sendFailed);
        return;
      }
      const text = draft.trim();
      setDraft("");
      setThreads((prev) =>
        prev.map((th) =>
          th.id !== active.id
            ? th
            : {
                ...th,
                snippet: text,
                messages: [
                  ...th.messages,
                  {
                    id: `local-${Date.now()}`,
                    body: text,
                    createdAt: new Date().toISOString(),
                    from: { id: "me", name: "You", username: null },
                    direction: "outbound",
                  },
                ],
              },
        ),
      );
      toast.success(I.sentLive);
    } catch {
      toast.error(I.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="studio-inbox flex h-full min-h-0 flex-col gap-4">
      <StudioHeader
        label={I.label}
        title={I.label}
        subtitle={I.liveSubtitle}
        right={
          <StudioGhostButton type="button" className="studio-btn-ghost--sm" onClick={() => void load(platform)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {I.refresh}
          </StudioGhostButton>
        }
      />

      <p className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)]/80 px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
        {I.ephemeralBanner}
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["instagram", "Instagram", InstagramLogo],
            ["messenger", "Messenger", FacebookLogo],
          ] as const
        ).map(([id, label, Logo]) => {
          const activeTab = platform === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPlatform(id)}
              className={
                activeTab
                  ? "studio-create-btn studio-create-btn--sm inline-flex items-center gap-2"
                  : "studio-btn-ghost studio-btn-ghost--sm inline-flex items-center gap-2"
              }
            >
              <Logo className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {pageName ? (
        <p className="text-xs text-[var(--muted)]">
          {I.connectedAs}: <span className="font-semibold text-[var(--fg)]">{pageName}</span>
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {I.loading}
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)] p-6">
          <Inbox className="h-6 w-6 text-[var(--muted)]" />
          <p className="text-sm font-semibold text-[var(--fg)]">{error}</p>
          <p className="max-w-md text-xs leading-relaxed text-[var(--muted)]">
            {errorCode === "META_INBOX_SCOPE" || errorCode === "META_NOT_CONNECTED"
              ? I.reconnectHint
              : I.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)]">
            {threads.length === 0 ? (
              <p className="p-4 text-sm text-[var(--muted)]">{I.listEmptyLive}</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {threads.map((th) => {
                  const selected = th.id === activeId;
                  return (
                    <li key={th.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(th.id)}
                        className={[
                          "flex w-full flex-col gap-1 px-4 py-3 text-start transition",
                          selected ? "bg-[var(--studio-surface-3)]" : "hover:bg-[var(--studio-surface-3)]/60",
                        ].join(" ")}
                      >
                        <span className="text-sm font-semibold text-[var(--fg)]">{peerLabel(th.peer)}</span>
                        <span className="line-clamp-2 text-xs text-[var(--muted)]">{th.snippet || I.noPreview}</span>
                        <span className="text-[10px] tabular-nums text-[var(--muted)]">{formatTime(th.updatedAt)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)]">
            {!active ? (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-[var(--muted)]">{I.pickThreadLive}</div>
            ) : (
              <>
                <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
                  <button
                    type="button"
                    className="lg:hidden"
                    onClick={() => setActiveId(null)}
                    aria-label={I.back}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--fg)]">{peerLabel(active.peer)}</p>
                    <p className="text-[10px] text-[var(--muted)]">{I.kindDm}</p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                  {active.messages.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">{I.noMessages}</p>
                  ) : (
                    active.messages.map((m) => (
                      <div
                        key={m.id}
                        className={[
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          m.direction === "outbound"
                            ? "ms-auto bg-[var(--ice)]/20 text-[var(--fg)]"
                            : "me-auto bg-[var(--studio-surface-3)] text-[var(--fg)]",
                        ].join(" ")}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body || I.noPreview}</p>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">{formatTime(m.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[var(--line)] p-3">
                  <p className="mb-2 text-[10px] leading-relaxed text-[var(--muted)]">{I.replyHintLive}</p>
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendReply();
                        }
                      }}
                      placeholder={I.replyPlaceholder}
                      className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-sm text-[var(--fg)] outline-none ring-[var(--ice)]/35 focus:ring-2"
                    />
                    <StudioCreateButton type="button" className="studio-create-btn--sm" onClick={() => void sendReply()} disabled={sending || !draft.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                      {I.send}
                    </StudioCreateButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
