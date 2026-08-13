import type { ComponentType } from "react";

import { AutomationsViewLite } from "./features/AutomationsViewLite";
import { CalendarView } from "./features/CalendarView";
import { ContentView } from "./features/ContentView";
import { EventsView } from "./features/EventsView";
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

function AccountsPanel(_props: StudioItemViewProps) {
  return <PlatformsView />;
}

function EventsPanel(_props: StudioItemViewProps) {
  return <EventsView />;
}

/** Maps onboarding tile ids to ported feature views from contentfabric. */
export const ITEM_REGISTRY: Record<string, ItemViewEntry> = {
  content: { wired: true, View: ContentPanel },
  calendar: { wired: true, View: CalendarPanel },
  inbox: { wired: false },
  accounts: { wired: true, View: AccountsPanel },
  automations: { wired: true, View: AutomationsPanel },
  bot: { wired: false },
  events: { wired: true, View: EventsPanel },
  sub: { wired: false },
  media: { wired: true, View: ContentPanel },
  queue: { wired: false },
  analytics: { wired: false },
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
