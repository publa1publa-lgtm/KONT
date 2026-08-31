import "server-only";

import { graphGet } from "./graph";
import { MetaError } from "./types";
import type {
  InstagramAccountProfile,
  InstagramAccountWeek,
  InstagramDayPoint,
} from "@/lib/instagramAnalytics";

type InstagramMediaSnapshot = {
  id: string;
  caption: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  timestamp: string | null;
  views: number | null;
};

const MEDIA_PAGE_SIZE = 50;
const MAX_VIDEOS = 24;
const MAX_PAGES = 4;
const INSIGHTS_BATCH = 5;

const MEDIA_FIELDS_BASE =
  "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp";

type GraphPaging = {
  cursors?: { after?: string };
};

type IgInsightRow = {
  name?: string;
  values?: Array<{ value?: number | string }>;
};

type IgMediaNode = {
  id?: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp?: string;
  total_views_count?: number;
  insights?: { data?: IgInsightRow[] };
};

type IgMediaPage = {
  data?: IgMediaNode[];
  paging?: GraphPaging;
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function insightValue(rows: IgInsightRow[] | undefined): number | null {
  if (!rows?.length) return null;
  const preferred =
    rows.find((row) => row.name === "views" || row.name === "plays" || row.name === "total_views") ?? rows[0];
  return asFiniteNumber(preferred?.values?.[0]?.value);
}

function isVideoMedia(node: IgMediaNode): boolean {
  if (node.media_product_type === "STORY") return false;
  return node.media_type === "VIDEO" || node.media_product_type === "REELS";
}

function firstCaptionLine(caption: string | undefined): string | null {
  const line = caption?.split(/\r?\n/).map((part) => part.trim()).find(Boolean);
  return line || null;
}

function toVideo(node: IgMediaNode): InstagramMediaSnapshot | null {
  if (!node.id || !isVideoMedia(node)) return null;
  return {
    id: node.id,
    caption: firstCaptionLine(node.caption),
    permalink: node.permalink ?? null,
    thumbnailUrl: node.thumbnail_url || null,
    timestamp: node.timestamp ?? null,
    views: asFiniteNumber(node.total_views_count) ?? insightValue(node.insights?.data),
  };
}

async function graphGetMediaPage(
  igUserId: string,
  accessToken: string,
  fields: string,
  after?: string,
): Promise<IgMediaPage> {
  const params: Record<string, string> = { fields, limit: String(MEDIA_PAGE_SIZE) };
  if (after) params.after = after;
  return graphGet<IgMediaPage>(`/${igUserId}/media`, accessToken, params);
}

async function listMediaPages(
  igUserId: string,
  accessToken: string,
  hasInsights: boolean,
): Promise<IgMediaNode[]> {
  const fieldSets = hasInsights
    ? [
        `${MEDIA_FIELDS_BASE},total_views_count,insights.metric(views)`,
        `${MEDIA_FIELDS_BASE},total_views_count`,
        MEDIA_FIELDS_BASE,
      ]
    : [MEDIA_FIELDS_BASE];

  let fields = fieldSets[0]!;
  let fieldIndex = 0;
  const nodes: IgMediaNode[] = [];
  let after: string | undefined;
  let pages = 0;

  while (pages < MAX_PAGES && nodes.filter(isVideoMedia).length < MAX_VIDEOS) {
    try {
      const page = await graphGetMediaPage(igUserId, accessToken, fields, after);
      const batch = Array.isArray(page.data) ? page.data : [];
      nodes.push(...batch);
      after = page.paging?.cursors?.after;
      pages += 1;
      if (!after || batch.length === 0) break;
    } catch (err) {
      if (err instanceof MetaError && fieldIndex < fieldSets.length - 1) {
        fieldIndex += 1;
        fields = fieldSets[fieldIndex]!;
        after = undefined;
        nodes.length = 0;
        pages = 0;
        continue;
      }
      throw err;
    }
  }

  return nodes;
}

async function fetchMediaViews(mediaId: string, accessToken: string, metric: string): Promise<number | null> {
  const res = await graphGet<{ data?: IgInsightRow[] }>(`/${mediaId}/insights`, accessToken, { metric });
  return insightValue(res.data);
}

async function fillMissingViews(
  videos: InstagramMediaSnapshot[],
  accessToken: string,
): Promise<InstagramMediaSnapshot[]> {
  const missing = videos.filter((item) => item.views == null);
  if (missing.length === 0) return videos;

  const metrics = ["views", "plays", "total_views"];
  let metricIndex = 0;
  const viewsById = new Map<string, number | null>();

  for (let i = 0; i < missing.length; i += INSIGHTS_BATCH) {
    const batch = missing.slice(i, i + INSIGHTS_BATCH);
    await Promise.all(
      batch.map(async (item) => {
        for (let attempt = metricIndex; attempt < metrics.length; attempt += 1) {
          try {
            const value = await fetchMediaViews(item.id, accessToken, metrics[attempt]!);
            viewsById.set(item.id, value);
            metricIndex = attempt;
            return;
          } catch (err) {
            if (!(err instanceof MetaError) || attempt === metrics.length - 1) {
              viewsById.set(item.id, null);
              return;
            }
          }
        }
      }),
    );
  }

  return videos.map((item) => (item.views != null ? item : { ...item, views: viewsById.get(item.id) ?? null }));
}

export async function getInstagramMediaSnapshot(
  mediaId: string,
  accessToken: string,
  hasInsights: boolean,
): Promise<{ views: number | null; permalink: string | null; live: boolean }> {
  try {
    const fields = hasInsights ? "id,permalink,total_views_count" : "id,permalink";
    const node = await graphGet<IgMediaNode>(`/${mediaId}`, accessToken, { fields });
    let views = asFiniteNumber(node.total_views_count);
    if (views == null && hasInsights) {
      for (const metric of ["views", "plays", "total_views"]) {
        try {
          views = await fetchMediaViews(mediaId, accessToken, metric);
          if (views != null) break;
        } catch {
          continue;
        }
      }
    }
    return { views, permalink: node.permalink ?? null, live: Boolean(node.id) };
  } catch {
    return { views: null, permalink: null, live: false };
  }
}

export async function listInstagramVideosWithViews(options: {
  igUserId: string;
  accessToken: string;
  hasInsights: boolean;
}): Promise<InstagramMediaSnapshot[]> {
  const nodes = await listMediaPages(options.igUserId, options.accessToken, options.hasInsights);
  const videos: InstagramMediaSnapshot[] = [];
  for (const node of nodes) {
    const video = toVideo(node);
    if (!video) continue;
    videos.push(video);
    if (videos.length >= MAX_VIDEOS) break;
  }

  if (!options.hasInsights) return videos;
  return fillMissingViews(videos, options.accessToken);
}

type IgUserInsightRow = {
  name?: string;
  period?: string;
  values?: Array<{ value?: number | string; end_time?: string }>;
  total_value?: {
    value?: number | string;
    breakdowns?: Array<{
      results?: Array<{ value?: number | string; dimension_values?: string[] }>;
    }>;
  };
};

function unixSeconds(d: Date): string {
  return String(Math.floor(d.getTime() / 1000));
}

function lastNDaysRange(days: number): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { since: unixSeconds(since), until: unixSeconds(until) };
}

function dayKey(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

async function fetchUserInsights(
  igUserId: string,
  accessToken: string,
  params: Record<string, string>,
): Promise<IgUserInsightRow[]> {
  const res = await graphGet<{ data?: IgUserInsightRow[] }>(`/${igUserId}/insights`, accessToken, params);
  return Array.isArray(res.data) ? res.data : [];
}

function parseTotal(row: IgUserInsightRow | undefined): number | null {
  if (!row) return null;
  const direct = asFiniteNumber(row.total_value?.value);
  if (direct != null) return direct;
  const results = row.total_value?.breakdowns?.[0]?.results;
  if (results?.length) {
    let sum = 0;
    let any = false;
    for (const item of results) {
      const n = asFiniteNumber(item.value);
      if (n != null) {
        sum += n;
        any = true;
      }
    }
    return any ? sum : null;
  }
  if (!row.values?.length) return null;
  let sum = 0;
  let any = false;
  for (const point of row.values) {
    const n = asFiniteNumber(point.value);
    if (n != null) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
}

function parseBreakdown(row: IgUserInsightRow | undefined, wanted: string): number | null {
  const results = row?.total_value?.breakdowns?.[0]?.results;
  if (!results?.length) return null;
  const needle = wanted.toUpperCase();
  const match = results.find((item) =>
    (item.dimension_values ?? []).some((v) => v.toUpperCase() === needle),
  );
  return asFiniteNumber(match?.value);
}

async function insightTotal(
  igUserId: string,
  accessToken: string,
  metric: string,
  range: { since: string; until: string },
  extra?: Record<string, string>,
): Promise<IgUserInsightRow | null> {
  const base = {
    metric,
    period: "day",
    metric_type: "total_value",
    ...extra,
  };
  try {
    const rows = await fetchUserInsights(igUserId, accessToken, {
      ...base,
      since: range.since,
      until: range.until,
    });
    return rows.find((row) => row.name === metric) ?? rows[0] ?? null;
  } catch {
    try {
      const rows = await fetchUserInsights(igUserId, accessToken, {
        ...base,
        timeframe: "this_week",
      });
      return rows.find((row) => row.name === metric) ?? rows[0] ?? null;
    } catch {
      return null;
    }
  }
}

function sumSeries(days: InstagramDayPoint[], key: "views" | "reach"): number | null {
  let sum = 0;
  let any = false;
  for (const point of days) {
    const n = point[key];
    if (n != null) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
}

export async function getInstagramAccountInsights(options: {
  igUserId: string;
  accessToken: string;
}): Promise<{ profile: InstagramAccountProfile; week: InstagramAccountWeek }> {
  const range = lastNDaysRange(7);

  const profileRaw = await graphGet<{ followers_count?: number; media_count?: number }>(
    `/${options.igUserId}`,
    options.accessToken,
    { fields: "followers_count,media_count" },
  );

  const [viewsRow, reachRow, engagedRow, interactionsRow, followsRow, seriesRows] = await Promise.all([
    insightTotal(options.igUserId, options.accessToken, "views", range),
    insightTotal(options.igUserId, options.accessToken, "reach", range),
    insightTotal(options.igUserId, options.accessToken, "accounts_engaged", range),
    insightTotal(options.igUserId, options.accessToken, "total_interactions", range),
    insightTotal(options.igUserId, options.accessToken, "follows_and_unfollows", range, {
      breakdown: "follow_type",
    }),
    fetchUserInsights(options.igUserId, options.accessToken, {
      metric: "reach",
      period: "day",
      metric_type: "time_series",
      since: range.since,
      until: range.until,
    }).catch(() => [] as IgUserInsightRow[]),
  ]);

  const reachSeries = seriesRows.find((row) => row.name === "reach") ?? seriesRows[0];
  const byDay = new Map<string, InstagramDayPoint>();

  for (const point of reachSeries?.values ?? []) {
    const day = dayKey(point.end_time);
    if (!day) continue;
    byDay.set(day, { day, views: null, reach: asFiniteNumber(point.value) });
  }

  const days = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));

  return {
    profile: {
      followers: asFiniteNumber(profileRaw.followers_count),
      mediaCount: asFiniteNumber(profileRaw.media_count),
    },
    week: {
      views: parseTotal(viewsRow ?? undefined) ?? sumSeries(days, "views"),
      reach: parseTotal(reachRow ?? undefined) ?? sumSeries(days, "reach"),
      accountsEngaged: parseTotal(engagedRow ?? undefined),
      interactions: parseTotal(interactionsRow ?? undefined),
      follows: parseBreakdown(followsRow ?? undefined, "FOLLOW") ?? parseTotal(followsRow ?? undefined),
      unfollows: parseBreakdown(followsRow ?? undefined, "UNFOLLOW"),
      days,
    },
  };
}
