import type { ComponentType } from "react";

import { AnalyticsView } from "./features/AnalyticsView";
import { AutomationsViewLite } from "./features/AutomationsViewLite";
import { CalendarView } from "./features/CalendarView";
import { ContentView } from "./features/ContentView";
import { EventsView } from "./features/EventsView";
import { InboxView } from "./features/InboxView";
import { PlatformsView } from "./features/PlatformsView";

export type StudioItemViewProps = {
  onBack: () => void;
};

type ItemViewEntry = {
  /** When true, renders the full feature view instead of the placeholder shell. */
  wired: boolean;
  View?: ComponentType<StudioItemViewProps>;
};

function AutomationsPanel(_props: StudioItemViewProps) {
  return (
    <AutomationsViewLite intent={null} onIntentConsumed={() => undefined} onViewChange={() => undefined} />
  );
}

function ContentPanel(_props: StudioItemViewProps) {
  return <ContentView />;
}

function CalendarPanel(_props: StudioItemViewProps) {
  return <CalendarView />;
}

function PlatformsPanel(_props: StudioItemViewProps) {
  return <PlatformsView />;
}

function EventsPanel(_props: StudioItemViewProps) {
  return <EventsView />;
}

function AnalyticsPanel(_props: StudioItemViewProps) {
  return <AnalyticsView />;
}

function InboxPanel(props: StudioItemViewProps) {
  return <InboxView {...props} />;
}

/** Maps onboarding tile ids to ported feature views from contentfabric. */
export const ITEM_REGISTRY: Record<string, ItemViewEntry> = {
  content: { wired: true, View: ContentPanel },
  calendar: { wired: true, View: CalendarPanel },
  inbox: { wired: true, View: InboxPanel },
  storage: { wired: false },
  platforms: { wired: true, View: PlatformsPanel },
  automations: { wired: true, View: AutomationsPanel },
  bot: { wired: false },
  events: { wired: true, View: EventsPanel },
  sub: { wired: false },
  media: { wired: true, View: ContentPanel },
  queue: { wired: false },
  analytics: { wired: true, View: AnalyticsPanel },
  insights: { wired: false },
  reports: { wired: false },
  audience: { wired: false },
  experiments: { wired: false },
};

export function isWiredItem(itemId: string): boolean {
  return ITEM_REGISTRY[itemId]?.wired === true;
}

export type ItemPlaceholderCopy = {
  body: string;
  primary: string;
};

export function placeholderCopyFor(_itemId: string): ItemPlaceholderCopy | null {
  return null;
}
