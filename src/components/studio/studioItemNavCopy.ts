import type { AppMessages } from "@/i18n/messages";

export type StudioItemNavCopy = {
  label: string;
  description: string;
};

export function getStudioItemNavCopy(itemId: string, messages: AppMessages): StudioItemNavCopy {
  const tile = messages.studio.items[itemId as keyof typeof messages.studio.items];
  const label = tile?.label ?? itemId;

  const featureDescriptions: Record<string, string | undefined> = {
    content: messages.studio.content?.subtitle,
    media: messages.studio.content?.subtitle,
    calendar: messages.calendar.subtitle,
    inbox: messages.studio.itemDetails?.inbox?.body,
    accounts: messages.studio.platforms?.connectedSubtitle,
    automations: messages.studio.placeholders?.pickAutomations,
    bot: messages.studio.placeholders?.pickBots,
  };

  const placeholderBody = messages.studio.itemDetails?.[itemId as keyof typeof messages.studio.itemDetails]?.body;

  const description = featureDescriptions[itemId] ?? placeholderBody ?? tile?.hint ?? "";

  return { label, description };
}
