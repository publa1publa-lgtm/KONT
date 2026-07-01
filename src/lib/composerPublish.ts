import type { ReelPlatformId } from "@/lib/reelPlatformIds";

export type ComposerPublishSelection =
  | { kind: "draft" }
  | { kind: "platforms"; platformIds: ReelPlatformId[] };

export type ConnectedPlatformAccount = {
  id: string;
  platformId: ReelPlatformId;
  handle: string | null;
};

export function defaultPublishSelection(): ComposerPublishSelection {
  return { kind: "draft" };
}

export function isPublishSelectionReady(
  accountsLoaded: boolean,
  accounts: ConnectedPlatformAccount[],
  value: ComposerPublishSelection,
  options?: { isEdit?: boolean },
): boolean {
  if (!accountsLoaded) return false;
  if (accounts.length === 0) {
    if (value.kind === "draft") return true;
    if (options?.isEdit && value.kind === "platforms" && value.platformIds.length > 0) return true;
    return false;
  }
  if (value.kind === "draft") return true;
  return value.platformIds.length > 0;
}
