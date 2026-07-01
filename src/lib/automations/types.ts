export const WORKFLOW_GRAPH_VERSION = 1 as const;

export type AutomationEventType =
  | "content.created"
  | "content.updated"
  | "content.scheduled"
  | "platform.connected"
  | "publish.requested";

export type TriggerNodeData =
  | { kind: "trigger.contentCreated"; event: "content.created" }
  | { kind: "trigger.contentScheduled"; event: "content.scheduled" };

export type ConditionNodeData = {
  kind: "condition.contentTypeIs";
  contentType: "REEL" | "POST";
};

export type ActionNodeData =
  | { kind: "action.addTags"; tags: string[]; hashtags: string[] }
  | { kind: "action.setSchedule"; scheduledAtIso: string }
  | { kind: "action.notify"; message: string };

export type AutomationNodeData = TriggerNodeData | ConditionNodeData | ActionNodeData;

export type AutomationNode = {
  id: string;
  type: "trigger" | "condition" | "action";
  position: { x: number; y: number };
  data: AutomationNodeData;
  width?: number;
  height?: number;
};

export type AutomationEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  /** Branch path label for condition yes/no arms. */
  label?: string;
};

export type AutomationGraph = {
  version: typeof WORKFLOW_GRAPH_VERSION;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
};

export type Workflow = {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  graph: AutomationGraph;
};
