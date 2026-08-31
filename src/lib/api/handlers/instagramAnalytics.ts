import { NextResponse } from "next/server";

import { internalError } from "@/lib/api/errors";
import { json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import type { InstagramAnalyticsPayload } from "@/lib/instagramAnalytics";
import { getInstagramAccountInsights } from "@/lib/meta/insights";
import { hasInstagramInsightsScope } from "@/lib/meta/permissions";
import { getMetaAccount } from "@/lib/meta/storage";
import { metaAccountHandle, MetaError } from "@/lib/meta/types";

export async function listInstagramAnalytics(_req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  try {
    const account = await getMetaAccount(userId, "instagram");
    if (!account) {
      return json({
        connected: false,
        handle: null,
        hasInsights: false,
        profile: null,
        week: null,
      } satisfies InstagramAnalyticsPayload);
    }

    const page = account.selectedPage;
    const handle = metaAccountHandle("instagram", page);
    const scopes = account.scope.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean);
    const hasInsights = hasInstagramInsightsScope(scopes);

    if (!page.igUserId || !hasInsights) {
      return json({
        connected: true,
        handle,
        hasInsights,
        profile: null,
        week: null,
      } satisfies InstagramAnalyticsPayload);
    }

    const { profile, week } = await getInstagramAccountInsights({
      igUserId: page.igUserId,
      accessToken: page.accessToken,
    });

    return json({
      connected: true,
      handle,
      hasInsights,
      profile,
      week,
    } satisfies InstagramAnalyticsPayload);
  } catch (err) {
    if (err instanceof MetaError) {
      return json({ error: err.message, code: err.code }, err.status >= 400 ? err.status : 502);
    }
    return internalError("instagram.analytics", err, "Could not load Instagram analytics.");
  }
}
