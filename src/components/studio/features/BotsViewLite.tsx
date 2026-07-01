"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/i18n-context";

import { formatStudioCreateCta, StudioCreateShell } from "./StudioCreateShell";
import { StudioHeader } from "./StudioHeader";
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow } from "./StudioWrapperList";

const btn =
  "rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-xs font-semibold text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]";

type Bot = {
  id: string;
  name: string;
  enabled: boolean;
  updatedAtIso: string;
  rulesText: string;
};

function nowIso() {
  return new Date().toISOString();
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function BotsViewLite({
  intent,
  onIntentConsumed,
  onViewChange,
}: {
  intent: "all" | "create" | null;
  onIntentConsumed: () => void;
  onViewChange: (v: "all" | "edit") => void;
}) {
  const { messages } = useI18n();
  const B = messages.studio.bots;
  const C = messages.common;
  const itemLabel = messages.studio.items.bot.label;
  const createLabel = formatStudioCreateCta(messages.studio.createCta, itemLabel);
  const [view, setView] = useState<"all" | "edit">("all");
  const [bots, setBots] = useState<Bot[]>(() => []);
  const [activeId, setActiveId] = useState<string>("");

  const active = useMemo(() => bots.find((b) => b.id === activeId) ?? null, [activeId, bots]);

  const applyIntent = useCallback(
    (next: "all" | "create") => {
      if (next === "all") {
        setView("all");
        onViewChange("all");
        return;
      }
      const id = genId("bot");
      const b: Bot = { id, name: "New bot", enabled: false, updatedAtIso: nowIso(), rulesText: "" };
      setBots((prev) => [b, ...prev]);
      setActiveId(id);
      setView("edit");
      onViewChange("edit");
    },
    [onViewChange],
  );

  useEffect(() => {
    if (!intent) return;
    applyIntent(intent);
    onIntentConsumed();
  }, [applyIntent, intent, onIntentConsumed]);

  return (
    <StudioCreateShell
      showCreate={view === "all"}
      createLabel={createLabel}
      onCreate={() => applyIntent("create")}
    >
      {view === "edit" && active ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <input
                value={active.name}
                onChange={(e) =>
                  setBots((prev) =>
                    prev.map((x) => (x.id === active.id ? { ...x, name: e.target.value, updatedAtIso: nowIso() } : x)),
                  )
                }
                className="w-[min(520px,90vw)] rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-sm font-semibold text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/35"
                placeholder={B.botNamePlaceholder}
              />
              <button
                type="button"
                className={[
                  "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                  active.enabled
                    ? "border-[var(--ice)]/30 bg-[var(--ice)]/12 text-[var(--ice)]"
                    : "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)] hover:bg-[var(--studio-surface-2)]",
                ].join(" ")}
                onClick={() =>
                  setBots((prev) =>
                    prev.map((x) => (x.id === active.id ? { ...x, enabled: !x.enabled, updatedAtIso: nowIso() } : x)),
                  )
                }
              >
                {active.enabled ? C.enabled : C.disabled}
              </button>
            </div>
            <button
              type="button"
              className={btn}
              onClick={() => {
                setView("all");
                onViewChange("all");
              }}
            >
              {B.allBots}
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)]/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{B.behaviorTitle}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{B.behaviorHint}</div>
              <textarea
                value={active.rulesText}
                onChange={(e) =>
                  setBots((prev) =>
                    prev.map((x) => (x.id === active.id ? { ...x, rulesText: e.target.value, updatedAtIso: nowIso() } : x)),
                  )
                }
                placeholder={B.rulesPlaceholder}
                className="mt-3 min-h-[220px] w-full rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3 text-sm text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/35"
              />
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)]/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{B.botInfoTitle}</div>
              <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">ID</div>
                <div className="mt-2 text-xs font-semibold text-[var(--fg)]">{active.id}</div>
              </div>
              <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                <div className="mt-2 text-xs text-[var(--muted)]">{B.useInFlows}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <StudioHeader label={itemLabel} title={B.allBots} subtitle={B.subtitleAll} />

          <StudioWrapperList className="mt-4">
            <StudioWrapperListBody>
              {bots.length ? (
                bots.map((b) => (
                  <StudioWrapperListRow
                    key={b.id}
                    className="flex items-center justify-between gap-3"
                  >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--fg)]">{b.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {b.enabled ? C.enabled : C.disabled} • {C.updated}{" "}
                      {new Date(b.updatedAtIso).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className={btn}
                      onClick={() => {
                        setActiveId(b.id);
                        setView("edit");
                        onViewChange("edit");
                      }}
                    >
                      {C.edit}
                    </button>
                    <button
                      type="button"
                      className={btn}
                      onClick={() => setBots((prev) => prev.filter((x) => x.id !== b.id))}
                    >
                      {C.delete}
                    </button>
                  </div>
                  </StudioWrapperListRow>
                ))
              ) : (
                <StudioWrapperListRow empty className="text-sm">
                  {B.noBots}{" "}
                  <span className="font-semibold text-[var(--st-ink)]">{B.noBotsCta}</span>.
                </StudioWrapperListRow>
              )}
            </StudioWrapperListBody>
          </StudioWrapperList>
        </>
      )}
    </StudioCreateShell>
  );
}
