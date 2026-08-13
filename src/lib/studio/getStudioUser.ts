import { cache } from "react";

import { getSessionUserId } from "@/lib/session";
import * as userRepo from "@/lib/repos/userRepo";

export type StudioUserProfile = NonNullable<Awaited<ReturnType<typeof userRepo.findUserProfile>>>;

export const getStudioUser = cache(async (): Promise<StudioUserProfile | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return userRepo.findUserProfile(userId);
});
