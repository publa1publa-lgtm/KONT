import type { AutomationNode } from "./types";

export type NodeLibraryGroup = "trigger" | "condition" | "action";

export type NodeTemplateId =
  | "trigger.contentCreated"
  | "trigger.contentScheduled"
  | "condition.contentTypeIs"
  | "action.notify"
  | "action.addTags"
  | "action.setSchedule";

export type NodeTemplate = {
  id: NodeTemplateId;
  group: NodeLibraryGroup;
  title: string;
  description: string;
  create: (nodeId: string) => AutomationNode;
};

export function genAutomationNodeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const NODE_LIBRARY: NodeTemplate[] = [
  {
    id: "trigger.contentCreated",
    group: "trigger",
    title: "Content created",
    description: "Start when new content is added",
    create: (id) => ({
      id,
      type: "trigger",
      position: { x: 0, y: 0 },
      data: { kind: "trigger.contentCreated", event: "content.created" },
    }),
  },
  {
    id: "trigger.contentScheduled",
    group: "trigger",
    title: "Content scheduled",
    description: "Start when content is scheduled",
    create: (id) => ({
      id,
      type: "trigger",
      position: { x: 0, y: 0 },
      data: { kind: "trigger.contentScheduled", event: "content.scheduled" },
    }),
  },
  {
    id: "condition.contentTypeIs",
    group: "condition",
    title: "Content type condition",
    description: "Branch on content type (editable)",
    create: (id) => ({
      id,
      type: "condition",
      position: { x: 0, y: 0 },
      data: { kind: "condition.contentTypeIs", contentType: "REEL" },
    }),
  },
  {
    id: "action.notify",
    group: "action",
    title: "Notify",
    description: "Send notification (demo)",
    create: (id) => ({
      id,
      type: "action",
      position: { x: 0, y: 0 },
      data: { kind: "action.notify", message: "Notification" },
    }),
  },
  {
    id: "action.addTags",
    group: "action",
    title: "Add tags",
    description: "Add tags/hashtags (demo)",
    create: (id) => ({
      id,
      type: "action",
      position: { x: 0, y: 0 },
      data: { kind: "action.addTags", tags: ["new"], hashtags: ["#demo"] },
    }),
  },
  {
    id: "action.setSchedule",
    group: "action",
    title: "Set schedule",
    description: "Set scheduled time (demo)",
    create: (id) => ({
      id,
      type: "action",
      position: { x: 0, y: 0 },
      data: { kind: "action.setSchedule", scheduledAtIso: new Date().toISOString() },
    }),
  },
];

export function getTemplate(id: NodeTemplateId): NodeTemplate {
  const t = NODE_LIBRARY.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown template id: ${id}`);
  return t;
}

