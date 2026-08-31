export type InstagramDayPoint = {
  day: string;
  views: number | null;
  reach: number | null;
};

export type InstagramAccountWeek = {
  views: number | null;
  reach: number | null;
  accountsEngaged: number | null;
  interactions: number | null;
  follows: number | null;
  unfollows: number | null;
  days: InstagramDayPoint[];
};

export type InstagramAccountProfile = {
  followers: number | null;
  mediaCount: number | null;
};

export type InstagramAnalyticsPayload = {
  connected: boolean;
  handle: string | null;
  hasInsights: boolean;
  profile: InstagramAccountProfile | null;
  week: InstagramAccountWeek | null;
};

export type FetchInstagramAnalyticsResult = InstagramAnalyticsPayload & {
  unauthorized: boolean;
  error: string | null;
};

const emptyPayload: InstagramAnalyticsPayload = {
  connected: false,
  handle: null,
  hasInsights: false,
  profile: null,
  week: null,
};

export async function fetchInstagramAnalytics(): Promise<FetchInstagramAnalyticsResult> {
  try {
    const res = await fetch("/api/instagram/media", { cache: "no-store" });
    if (res.status === 401) {
      return { ...emptyPayload, unauthorized: true, error: null };
    }
    const body = (await res.json().catch(() => null)) as
      | (Partial<InstagramAnalyticsPayload> & { error?: string })
      | null;
    if (!res.ok) {
      return {
        ...emptyPayload,
        unauthorized: false,
        error: typeof body?.error === "string" ? body.error : "Could not load Instagram analytics.",
      };
    }
    return {
      connected: body?.connected === true,
      handle: typeof body?.handle === "string" ? body.handle : null,
      hasInsights: body?.hasInsights === true,
      profile: isProfile(body?.profile) ? body.profile : null,
      week: isWeek(body?.week) ? body.week : null,
      unauthorized: false,
      error: null,
    };
  } catch {
    return { ...emptyPayload, unauthorized: false, error: "Could not load Instagram analytics." };
  }
}

function isProfile(value: unknown): value is InstagramAccountProfile {
  return Boolean(value) && typeof value === "object";
}

function isWeek(value: unknown): value is InstagramAccountWeek {
  return Boolean(value) && typeof value === "object" && Array.isArray((value as InstagramAccountWeek).days);
}
