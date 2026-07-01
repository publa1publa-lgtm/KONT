import type { ComponentType, ReactNode } from "react";

import { AutomationsViewLite } from "./features/AutomationsViewLite";
import { BotsViewLite } from "./features/BotsViewLite";
import { CalendarView } from "./features/CalendarView";
import { ContentView } from "./features/ContentView";
import { PlatformsView } from "./features/PlatformsView";
import { StudioUnifiedInboxDemo } from "./features/StudioUnifiedInboxDemo";

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

function BotsPanel(_props: StudioItemViewProps) {
  return <BotsViewLite intent={null} onIntentConsumed={() => undefined} onViewChange={() => undefined} />;
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

function InboxPanel(_props: StudioItemViewProps) {
  return <StudioUnifiedInboxDemo />;
}

/** Maps onboarding tile ids to ported feature views from contentfabric. */
export const ITEM_REGISTRY: Record<string, ItemViewEntry> = {
  content: { wired: true, View: ContentPanel },
  calendar: { wired: true, View: CalendarPanel },
  inbox: { wired: true, View: InboxPanel },
  accounts: { wired: true, View: AccountsPanel },
  automations: { wired: true, View: AutomationsPanel },
  bot: { wired: true, View: BotsPanel },
  sub: { wired: false },
  drafts: { wired: false },
  queue: { wired: false },
  archive: { wired: false },
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
