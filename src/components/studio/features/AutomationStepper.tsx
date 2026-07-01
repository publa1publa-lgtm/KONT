"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AutomationEdge, AutomationNode } from "@/lib/automations/types";
import { NODE_LIBRARY, genAutomationNodeId, getTemplate, type NodeLibraryGroup, type NodeTemplateId } from "@/lib/automations/nodeLibrary";

const cardBase =
  "w-full rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-4 py-3 text-left shadow-[var(--studio-shadow)] transition hover:bg-[var(--studio-surface-2)]";

const pill =
  "inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

type AddKind = NodeTemplateId;
type BranchLabel = "yes" | "no";

function ActionPicker({
  open,
  anchorEl,
  onClose,
  onPick,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onPick: (id: NodeTemplateId) => void;
}) {
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return NODE_LIBRARY.filter((t) => {
      if (t.group !== "action") return false;
      const hay = `${t.title} ${t.description} ${t.id}`.toLowerCase();
      return qq ? hay.includes(qq) : true;
    });
  }, [q]);

  if (!open || !anchorEl || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[10000] w-[260px] rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-2 text-[var(--fg)] shadow-xl backdrop-blur-md"
      style={{
        top: anchorEl.getBoundingClientRect().bottom + 8,
        left: anchorEl.getBoundingClientRect().left,
      }}
    >
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Add action</div>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[rgba(0,0,0,0.06)]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="px-2 pb-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actions..."
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--studio-surface-2)] px-3 py-2 text-xs font-semibold text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/30"
        />
      </div>
      <div className="max-h-[280px] overflow-auto px-1 pb-1">
        {items.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              onPick(x.id);
              onClose();
            }}
            className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--fg)] hover:bg-[rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span>{x.title}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{x.group}</span>
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">{x.description}</div>
          </button>
        ))}
        {items.length === 0 ? <div className="px-3 py-2 text-xs text-[var(--muted)]">No matches</div> : null}
      </div>
    </div>,
    (anchorEl.closest(".theme-studio-light, .theme-studio-dark") as HTMLElement | null) ?? document.body,
  );
}

function TreeNode({
  nodeId,
  depth,
  idx,
  selectedNodeId,
  onSelectNode,
  onRemoveNode,
  onAddToBranch,
}: {
  nodeId: string;
  depth: number;
  idx: ReturnType<typeof buildIndex>;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onAddToBranch: (conditionId: string, branch: BranchLabel, kind: AddKind) => void;
}) {
  const n = idx.byId.get(nodeId);
  if (!n) return null;
  const { title, subtitle } = labelForNode(n);
  const selected = n.id === selectedNodeId;

  const indent = depth * 16;
  const out = idx.outgoing.get(n.id) ?? [];

  const yesEdge = n.type === "condition" ? firstEdgeByBranch(out, "yes") : undefined;
  const noEdge = n.type === "condition" ? firstEdgeByBranch(out, "no") : undefined;
  const nextEdge = n.type !== "condition" ? nextLinearEdge(out) : undefined;

  const [actionMenuOpen, setActionMenuOpen] = useState<BranchLabel | null>(null);
  const yesBtnRef = useRef<HTMLButtonElement>(null);
  const noBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="grid gap-2" style={{ marginLeft: indent }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectNode(n.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelectNode(n.id);
        }}
        className={[
          cardBase,
          selected ? "ring-2 ring-[var(--ice)]/35" : "",
          "outline-none focus:ring-2 focus:ring-[var(--ice)]/30",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={pill}>{title}</span>
              <span className="text-xs font-semibold text-[var(--fg)]">{subtitle}</span>
            </div>
            <div className="mt-1 text-[10px] font-medium text-[var(--muted)]">{n.data.kind}</div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveNode(n.id);
            }}
            className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--studio-surface-2)]"
          >
            Delete
          </button>
        </div>
      </div>

      {n.type === "condition" ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)] p-3 sm:grid-cols-2">
          {(
            [
              { b: "yes" as const, label: "YES", head: yesEdge?.target },
              { b: "no" as const, label: "NO", head: noEdge?.target },
            ] as const
          ).map((br) => (
            <div key={br.b} className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: br.b === "yes" ? "var(--ice)" : "var(--ember)" }}
                  />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{br.label}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    ref={br.b === "yes" ? yesBtnRef : noBtnRef}
                    onClick={() => setActionMenuOpen(br.b)}
                    className="rounded-xl border border-[var(--line)] bg-[var(--studio-surface-3)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--fg)] hover:bg-[var(--studio-surface-2)]"
                    title="Add action to this branch"
                  >
                    + Action
                  </button>
                </div>
              </div>

              <ActionPicker
                open={actionMenuOpen === br.b}
                anchorEl={(br.b === "yes" ? yesBtnRef.current : noBtnRef.current) as HTMLElement | null}
                onClose={() => setActionMenuOpen(null)}
                onPick={(id) => onAddToBranch(n.id, br.b, id)}
              />

              <div className="mt-3 grid gap-2">
                {br.head ? (
                  <TreeNode
                    nodeId={br.head}
                    depth={depth + 1}
                    idx={idx}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    onRemoveNode={onRemoveNode}
                    onAddToBranch={onAddToBranch}
                  />
                ) : (
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-2)] p-3 text-xs text-[var(--muted)]">
                    No steps yet. Add an action to continue.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : nextEdge ? (
        <TreeNode
          nodeId={nextEdge.target}
          depth={depth}
          idx={idx}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onRemoveNode={onRemoveNode}
          onAddToBranch={onAddToBranch}
        />
      ) : null}
    </div>
  );
}

function createNode(templateId: AddKind): AutomationNode {
  const template = getTemplate(templateId);
  return template.create(genAutomationNodeId(template.group));
}

function labelForNode(n: AutomationNode): { title: string; subtitle: string } {
  if (n.type === "trigger") {
    const d = n.data;
    return {
      title: "Trigger",
      subtitle: "event" in d ? d.event : "Trigger",
    };
  }
  if (n.type === "condition") {
    const d = n.data;
    return { title: "Condition", subtitle: d.kind === "condition.contentTypeIs" ? `type is ${d.contentType}` : "Condition" };
  }
  const d = n.data;
  return { title: "Action", subtitle: d.kind === "action.notify" ? "notify" : "Action" };
}

function bridgeEdgesAfterRemoval(removedId: string, edges: AutomationEdge[]): AutomationEdge[] {
  const incoming = edges.filter((e) => e.target === removedId);
  const outgoing = edges.filter((e) => e.source === removedId);
  const rest = edges.filter((e) => e.source !== removedId && e.target !== removedId);

  const bridges: AutomationEdge[] = [];
  for (const inc of incoming) {
    for (const out of outgoing) {
      // Preserve branch label when removing nodes inside a branch path.
      const label = (inc.label ?? out.label) as string | undefined;
      bridges.push({ id: genAutomationNodeId("e"), source: inc.source, target: out.target, ...(label ? { label } : null) });
    }
  }
  return [...rest, ...bridges];
}

function collectDescendants(rootId: string, edges: AutomationEdge[]): Set<string> {
  const out = new Map<string, string[]>();
  for (const e of edges) {
    const list = out.get(e.source) ?? [];
    list.push(e.target);
    out.set(e.source, list);
  }

  const seen = new Set<string>();
  const q: string[] = [rootId];
  while (q.length) {
    const id = q.shift();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    for (const nxt of out.get(id) ?? []) q.push(nxt);
  }
  // remove the root itself; caller decides whether to include it
  seen.delete(rootId);
  return seen;
}

function buildIndex(nodes: AutomationNode[], edges: AutomationEdge[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, AutomationEdge[]>();
  const incomingCount = new Map<string, number>();
  for (const n of nodes) {
    outgoing.set(n.id, []);
    incomingCount.set(n.id, 0);
  }
  for (const e of edges) {
    outgoing.get(e.source)?.push(e);
    incomingCount.set(e.target, (incomingCount.get(e.target) ?? 0) + 1);
  }
  for (const [id, list] of outgoing) {
    list.sort((a, b) => String(a.label ?? "").localeCompare(String(b.label ?? "")));
    outgoing.set(id, list);
  }
  const roots = nodes.filter((n) => (incomingCount.get(n.id) ?? 0) === 0);
  const rootTriggers = roots.filter((n) => n.type === "trigger");
  return { byId, outgoing, roots: rootTriggers.length ? rootTriggers : roots };
}

function nextLinearEdge(edges: AutomationEdge[]): AutomationEdge | undefined {
  // Prefer non-branch edges for linear path
  const direct = edges.find((e) => e.label !== "yes" && e.label !== "no");
  return direct ?? edges[0];
}

function firstEdgeByBranch(edges: AutomationEdge[], branch: BranchLabel): AutomationEdge | undefined {
  return edges.find((e) => String(e.label) === branch);
}

export function AutomationStepper({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onChangeGraph,
}: {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onChangeGraph: (nextNodes: AutomationNode[], nextEdges: AutomationEdge[]) => void;
}) {
  const idx = useMemo(() => buildIndex(nodes, edges), [nodes, edges]);

  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const hasTrigger = useMemo(() => nodes.some((n) => n.type === "trigger"), [nodes]);

  const tailInfo = useMemo(() => {
    const root = idx.roots[0];
    let tail: AutomationNode | undefined = root;
    const seen = new Set<string>();
    while (tail && !seen.has(tail.id)) {
      seen.add(tail.id);
      const out: AutomationEdge[] = idx.outgoing.get(tail.id) ?? [];
      const edge: AutomationEdge | undefined = tail.type === "condition" ? undefined : nextLinearEdge(out);
      const nxt: AutomationNode | undefined = edge ? idx.byId.get(edge.target) : undefined;
      if (!nxt) break;
      tail = nxt;
    }
    return { tail };
  }, [idx.byId, idx.outgoing, idx.roots]);

  const addToBranch = useCallback(
    (conditionId: string, branch: BranchLabel, kind: AddKind) => {
      // Rule: after a Condition you can only add Actions (no nested Conditions) in MVP.
      if (getTemplate(kind).group !== "action") return;
      const next = createNode(kind);
      const out = idx.outgoing.get(conditionId) ?? [];
      const headEdge = firstEdgeByBranch(out, branch);

      // If branch is empty, connect condition -> next with label.
      if (!headEdge) {
        onChangeGraph(
          [...nodes, next],
          [...edges, { id: genAutomationNodeId("e"), source: conditionId, target: next.id, label: branch }],
        );
        onSelectNode(next.id);
        return;
      }

      // Otherwise append to the end of that branch's linear path (stop at conditions).
      let tail = idx.byId.get(headEdge.target);
      const seen = new Set<string>();
      while (tail && !seen.has(tail.id)) {
        seen.add(tail.id);
        if (tail.type === "condition") break;
        const e = nextLinearEdge(idx.outgoing.get(tail.id) ?? []);
        const nxt = e ? idx.byId.get(e.target) : undefined;
        if (!nxt) break;
        tail = nxt;
      }
      const prevNode = tail ?? idx.byId.get(headEdge.target);
      onChangeGraph(
        [...nodes, next],
        [...edges, { id: genAutomationNodeId("e"), source: prevNode!.id, target: next.id }],
      );
      onSelectNode(next.id);
    },
    [edges, idx.byId, idx.outgoing, nodes, onChangeGraph, onSelectNode],
  );

  const addAtEnd = useCallback(
    (kind: AddKind) => {
      // Rule: exactly one Trigger, and it must be the first node.
      const tpl = getTemplate(kind);
      if (!hasTrigger && tpl.group !== "trigger") return;
      if (hasTrigger && tpl.group === "trigger") return;

      const next = createNode(kind);
      const tail = tailInfo.tail;

      // If the chain currently ends at a Condition, continuation must go through a branch.
      if (tail?.type === "condition") {
        if (getTemplate(kind).group !== "action") return;
        addToBranch(tail.id, "yes", kind);
        setMenuOpen(false);
        return;
      }

      const prevNode = nodes.length ? (tail ?? nodes[nodes.length - 1]) : undefined;
      const nextNodes = [...nodes, next];
      const nextEdges = prevNode ? [...edges, { id: genAutomationNodeId("e"), source: prevNode.id, target: next.id }] : edges;
      onChangeGraph(nextNodes, nextEdges);
      onSelectNode(next.id);
      setMenuOpen(false);
    },
    [addToBranch, edges, hasTrigger, nodes, onChangeGraph, onSelectNode, tailInfo.tail],
  );

  const filteredLibrary = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NODE_LIBRARY.filter((t) => {
      // Enforce trigger constraints in the picker too.
      if (!hasTrigger && t.group !== "trigger") return false;
      if (hasTrigger && t.group === "trigger") return false;
      const hay = `${t.title} ${t.description} ${t.id}`.toLowerCase();
      return q ? hay.includes(q) : true;
    });
  }, [hasTrigger, query]);

  const removeNode = useCallback(
    (id: string) => {
      const victim = nodes.find((n) => n.id === id);
      if (victim?.type === "condition") {
        const descendants = collectDescendants(id, edges);
        const toDelete = new Set<string>([id, ...descendants]);
        const nextNodes = nodes.filter((n) => !toDelete.has(n.id));
        const nextEdges = edges.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target));
        onChangeGraph(nextNodes, nextEdges);
        return;
      }

      const nextNodes = nodes.filter((n) => n.id !== id);
      const nextEdges = bridgeEdgesAfterRemoval(id, edges);
      onChangeGraph(nextNodes, nextEdges);
    },
    [edges, nodes, onChangeGraph],
  );

  const menu =
    menuOpen && btnRef.current && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[10000] min-w-[220px] rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-2 text-[var(--fg)] shadow-xl backdrop-blur-md"
            style={{
              top: btnRef.current.getBoundingClientRect().bottom + 8,
              left: btnRef.current.getBoundingClientRect().left,
            }}
          >
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Add step
            </div>
            <div className="px-2 pb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--studio-surface-2)] px-3 py-2 text-xs font-semibold text-[var(--fg)] outline-none focus:ring-2 focus:ring-[var(--ice)]/30"
              />
            </div>
            <div className="max-h-[320px] overflow-auto px-1 pb-1">
              {filteredLibrary.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => addAtEnd(x.id)}
                  className="block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--fg)] hover:bg-[rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{x.title}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{x.group}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium text-[var(--muted)]">{x.description}</div>
                </button>
              ))}
              {filteredLibrary.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--muted)]">No matches</div>
              ) : null}
            </div>
          </div>,
          (btnRef.current.closest(".theme-studio-light, .theme-studio-dark") as HTMLElement | null) ?? document.body,
        )
      : null;

  return (
    <>
      <div className="glass-nav overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--studio-surface-2)]">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Flow</div>
              <div className="mt-1 text-[13px] text-[var(--muted)]">Build steps (trigger → actions / conditions).</div>
            </div>
            <div className="text-xs font-semibold text-[var(--muted)]">{nodes.length} nodes</div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto p-4">
          {nodes.length ? (
            <div className="grid gap-3">
              {idx.roots.map((root) => (
                <TreeNode
                  key={root.id}
                  nodeId={root.id}
                  depth={0}
                  idx={idx}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={onSelectNode}
                  onRemoveNode={removeNode}
                  onAddToBranch={addToBranch}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-4 text-sm text-[var(--muted)]">
              Start by adding a <span className="font-semibold text-[var(--fg)]">Trigger</span>.
            </div>
          )}

          {tailInfo.tail?.type === "condition" ? (
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--studio-surface-3)] p-3 text-center text-xs text-[var(--muted)]">
              Continue from a <span className="font-semibold text-[var(--fg)]">Condition</span> using the{" "}
              <span className="font-semibold text-[var(--fg)]">+ Action</span> buttons in the YES/NO columns.
            </div>
          ) : (
            <div className="mt-4 flex justify-center">
              <button
                ref={btnRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--studio-surface-3)] text-lg font-light text-[var(--fg)] transition hover:bg-[var(--studio-surface-2)]"
                aria-label="Add step"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
      {menu}
    </>
  );
}

