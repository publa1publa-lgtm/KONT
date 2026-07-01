"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import type { AutomationEdge, AutomationGraph, AutomationNode, Workflow } from "@/lib/automations/types";
import { AutomationStepper } from "./AutomationStepper";
import { genAutomationNodeId } from "@/lib/automations/nodeLibrary";
import { formatTemplate } from "@/lib/formatTemplate";
import { formatStudioCreateCta, StudioCreateShell } from "./StudioCreateShell";
import { StudioHeader } from "./StudioHeader";
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow } from "./StudioWrapperList";

const btn =
  "rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-xs font-semibold text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]";

function nowIso() {
  return new Date().toISOString();
}

function createTestWorkflow(): Workflow {
  const nodes: AutomationNode[] = [
    {
      id: "t1",
      type: "trigger",
      position: { x: 80, y: 120 },
      data: { kind: "trigger.contentCreated", event: "content.created" },
    },
    {
      id: "c1",
      type: "condition",
      position: { x: 300, y: 120 },
      data: { kind: "condition.contentTypeIs", contentType: "REEL" },
    },
    {
      id: "a1",
      type: "action",
      position: { x: 540, y: 120 },
      data: { kind: "action.notify", message: "New video added" },
    },
  ];
  const edges: AutomationEdge[] = [
    { id: "e1", source: "t1", target: "c1" },
    { id: "e2", source: "c1", target: "a1" },
  ];
  const graph: AutomationGraph = { version: 1, nodes, edges };
  const t = nowIso();
  return { id: "local-default", name: "Video notifications (test)", enabled: true, createdAt: t, updatedAt: t, graph };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, init);
  if (r.status === 401) throw new Error("Unauthorized");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Request failed");
  }
  return (await r.json()) as T;
}

export function AutomationsViewLite({
  intent,
  onIntentConsumed,
  onViewChange,
}: {
  intent: "all" | "create" | null;
  onIntentConsumed: () => void;
  onViewChange: (v: "all" | "edit") => void;
}) {
  const { messages } = useI18n();
  const A = messages.studio.automations;
  const C = messages.common;
  const itemLabel = messages.studio.items.automations.label;
  const createLabel = formatStudioCreateCta(messages.studio.createCta, itemLabel);

  const [view, setView] = useState<"all" | "edit">("all");
  const [workflows, setWorkflows] = useState<Workflow[]>(() => []);
  const [activeId, setActiveId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = useMemo(
    () => workflows.find((w) => w.id === activeId) ?? workflows[0] ?? null,
    [activeId, workflows],
  );

  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [edges, setEdges] = useState<AutomationEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined),
    [nodes, selectedNodeId],
  );

  const syncActiveGraph = useCallback(
    (nextNodes: AutomationNode[], nextEdges: AutomationEdge[]) => {
      if (!active) return;
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id !== active.id
            ? w
            : {
                ...w,
                updatedAt: nowIso(),
                graph: { version: 1, nodes: nextNodes, edges: nextEdges },
              },
        ),
      );
    },
    [active],
  );

  const onChangeGraph = useCallback(
    (nextNodes: AutomationNode[], nextEdges: AutomationEdge[]) => {
      setNodes(nextNodes);
      setEdges(nextEdges);
      syncActiveGraph(nextNodes, nextEdges);
    },
    [syncActiveGraph],
  );

  const load = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ items: Workflow[] }>("/api/automations");
      const items = Array.isArray(res.items) ? res.items : [];
      setWorkflows(items.length ? items : [createTestWorkflow()]);
      const first = items[0]?.id ?? "local-default";
      setActiveId((prev) => prev || first);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setWorkflows([createTestWorkflow()]);
      setActiveId("local-default");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!active) return;
    setSelectedNodeId(null);
    setNodes(active.graph.nodes);
    setEdges(active.graph.edges);
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    if (!active) return;
    setBusy(true);
    setError(null);
    void api<Workflow>(`/api/automations/${encodeURIComponent(active.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(active),
    })
      .then((wf) => {
        setWorkflows((prev) => prev.map((x) => (x.id === wf.id ? wf : x)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Save failed"))
      .finally(() => setBusy(false));
  }, [active]);

  const updateSelectedData = useCallback(
    (patch: Partial<AutomationNode["data"]>) => {
      if (!selectedNodeId) return;
      const nextNodes = nodes.map((n) => (n.id !== selectedNodeId ? n : ({ ...n, data: { ...n.data, ...patch } } as AutomationNode)));
      onChangeGraph(nextNodes, edges);
    },
    [edges, nodes, onChangeGraph, selectedNodeId],
  );

  const updateActive = useCallback(
    (patch: Partial<Workflow>) => {
      if (!active) return;
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id !== active.id
            ? w
            : {
                ...w,
                ...patch,
                id: w.id,
                createdAt: w.createdAt,
                updatedAt: nowIso(),
              },
        ),
      );
    },
    [active],
  );

  const createFlow = useCallback(() => {
    setBusy(true);
    setError(null);
    void api<Workflow>("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New flow", enabled: false }),
    })
      .then((wf) => {
        setWorkflows((prev) => [wf, ...prev.filter((x) => x.id !== wf.id)]);
        setActiveId(wf.id);
        setNodes(wf.graph.nodes);
        setEdges(wf.graph.edges);
        setSelectedNodeId(null);
        setView("edit");
        onViewChange("edit");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Create failed"))
      .finally(() => setBusy(false));
  }, [onViewChange]);

  useEffect(() => {
    if (!intent) return;
    if (intent === "all") {
      setView("all");
      onViewChange("all");
      onIntentConsumed();
      return;
    }
    createFlow();
    onIntentConsumed();
  }, [createFlow, intent, onIntentConsumed, onViewChange]);

  const openFlow = useCallback(
    (id: string) => {
      setActiveId(id);
      setSelectedNodeId(null);
      setView("edit");
      onViewChange("edit");
    },
    [onViewChange],
  );

  const deleteFlow = useCallback(
    (id: string) => {
      const name = workflows.find((w) => w.id === id)?.name ?? "this flow";
      if (!window.confirm(formatTemplate(A.deleteConfirm, { name }))) return;
      setBusy(true);
      setError(null);
      void api<{ ok: true }>(`/api/automations/${encodeURIComponent(id)}`, { method: "DELETE" })
        .then(() => {
          setWorkflows((prev) => prev.filter((w) => w.id !== id));
          if (activeId === id) {
            setActiveId("");
            setNodes([]);
            setEdges([]);
            setSelectedNodeId(null);
            setView("all");
            onViewChange("all");
          }
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Delete failed"))
        .finally(() => setBusy(false));
    },
    [A.deleteConfirm, activeId, onViewChange, workflows],
  );

  return (
    <StudioCreateShell
      showCreate={view === "all"}
      createLabel={createLabel}
      onCreate={createFlow}
      createDisabled={busy}
    >
      {error ? <div className="mb-3 text-sm font-semibold text-[var(--ember)]">{error}</div> : null}

      {view === "all" ? (
        <>
          <StudioHeader label={itemLabel} title={A.allFlows} subtitle={A.subtitleAll} />

          <StudioWrapperList className="mt-4">
            <StudioWrapperListBody>
              {workflows.length ? (
                workflows.map((w) => (
                  <StudioWrapperListRow
                    key={w.id}
                    className="flex items-center justify-between gap-3"
                  >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--fg)]">{w.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {formatTemplate(A.updatedAt, {
                        status: w.enabled ? C.enabled : C.disabled,
                        date: new Date(w.updatedAt).toLocaleString(),
                      })}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" className={btn} onClick={() => openFlow(w.id)}>
                      {C.edit}
                    </button>
                    <button type="button" className={btn} onClick={() => deleteFlow(w.id)} disabled={busy}>
                      {C.delete}
                    </button>
                  </div>
                  </StudioWrapperListRow>
                ))
              ) : (
                <StudioWrapperListRow empty className="text-sm">
                  {A.noFlows}{" "}
                  <span className="font-semibold text-[var(--st-ink)]">{A.noFlowsCta}</span>.
                </StudioWrapperListRow>
              )}
            </StudioWrapperListBody>
          </StudioWrapperList>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {active ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <input
                  value={active.name}
                  onChange={(e) => updateActive({ name: e.target.value })}
                  className="w-[min(520px,90vw)] rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-sm font-semibold text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/35"
                  placeholder={A.flowNamePlaceholder}
                />
                <button
                  type="button"
                  className={[
                    "rounded-2xl border px-3 py-2 text-xs font-semibold transition",
                    active.enabled
                      ? "border-[var(--ice)]/30 bg-[var(--ice)]/12 text-[var(--ice)]"
                      : "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)] hover:bg-[var(--studio-surface-2)]",
                  ].join(" ")}
                  onClick={() => updateActive({ enabled: !active.enabled })}
                >
                  {active.enabled ? C.enabled : C.disabled}
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setView("all");
                  onViewChange("all");
                }}
              >
                {A.allFlows}
              </button>
              <button type="button" className={btn} onClick={save} disabled={busy || !active}>
                {busy ? A.saving : C.save}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
            <AutomationStepper
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onChangeGraph={onChangeGraph}
            />

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)]/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{A.stepSettings}</div>
              {selectedNode ? (
                <div className="mt-3 space-y-3 text-sm text-[var(--muted)]">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{A.type}</div>
                    <div className="mt-2 font-semibold text-[var(--fg)]">{selectedNode.data.kind}</div>
                  </div>

                  {selectedNode.data.kind === "action.notify" ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{A.message}</div>
                      <input
                        value={selectedNode.data.message}
                        onChange={(e) => updateSelectedData({ message: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/40"
                        placeholder={A.notificationPlaceholder}
                      />
                    </div>
                  ) : null}

                  {selectedNode.data.kind === "condition.contentTypeIs" ? (
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{A.contentType}</div>
                      <div className="mt-2 flex gap-2">
                        {(["REEL", "POST"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateSelectedData({ contentType: t })}
                            className={[
                              "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                              (selectedNode.data as { contentType: "REEL" | "POST" }).contentType === t
                                ? "border-[var(--ice)]/35 bg-[var(--ice)]/12 text-[var(--ice)]"
                                : "border-[var(--line)] bg-[var(--studio-surface-3)] text-[var(--fg)] hover:bg-[var(--studio-surface-2)]",
                            ].join(" ")}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{A.json}</div>
                    <pre className="mt-2 overflow-auto text-xs text-[var(--fg)]">{JSON.stringify(selectedNode.data, null, 2)}</pre>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" className={btn} onClick={() => setSelectedNodeId(null)}>
                      {C.close}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">{A.selectStep}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className={btn}
                  onClick={() => {
                    setView("all");
                    onViewChange("all");
                  }}
                >
                  {A.backToAll}
                </button>
                {active ? (
                  <button type="button" className={btn} onClick={() => deleteFlow(active.id)} disabled={busy}>
                    {A.deleteFlow}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </StudioCreateShell>
  );
}
