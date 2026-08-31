"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useI18n } from "@/contexts/i18n-context";
import {
  fetchInstagramAnalytics,
  type InstagramAccountProfile,
  type InstagramAccountWeek,
} from "@/lib/instagramAnalytics";
import { metaScopesForPermissions, PlatformPermissionsModal } from "./PlatformPermissionsModal";
import { StudioCreateButton } from "./StudioCreateButton";
import { StudioCreateShell } from "./StudioCreateShell";
import { StudioHeader } from "./StudioHeader";
import { StudioWrapperList, StudioWrapperListBody, StudioWrapperListRow, studioWrapperList } from "./StudioWrapperList";

const ANALYTICS_IG_DEFAULTS = ["instagram.insights.read"] as const;

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function weekdayLabel(day: string): string {
  const parsed = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day.slice(5);
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
}

function startInstagramOAuth(pickedPermissionIds: string[], returnTo: string) {
  try {
    sessionStorage.setItem("kont.instagram.grantedPermissionIds", JSON.stringify(pickedPermissionIds));
  } catch {
    // continue even if sessionStorage is blocked
  }
  const start = new URL("/api/meta/oauth/start", window.location.origin);
  start.searchParams.set("intent", "instagram");
  start.searchParams.set("returnTo", returnTo);
  const scopes = metaScopesForPermissions("instagram", pickedPermissionIds);
  if (scopes.length) start.searchParams.set("scopes", scopes.join(","));
  start.searchParams.set("perms", pickedPermissionIds.join(","));
  window.location.assign(`${start.pathname}${start.search}`);
}

function WeekBars({ week }: { week: InstagramAccountWeek }) {
  const series = week.days.map((d) => d.reach ?? d.views ?? 0);
  const max = Math.max(1, ...series);
  if (!week.days.length) return null;

  return (
    <ol className="studio-analytics-week" aria-label="Daily reach">
      {week.days.map((d) => {
        const value = d.reach ?? d.views;
        const h = value == null ? 0.08 : Math.max(0.08, value / max);
        const label = weekdayLabel(d.day);
        return (
          <li key={d.day} className="studio-analytics-week__day">
            <span
              className="studio-analytics-week__bar"
              style={{ height: `${h * 100}%` }}
              title={`${label}: ${formatCount(value)}`}
            />
            <span className="studio-analytics-week__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function AnalyticsView() {
  const { messages } = useI18n();
  const pathname = usePathname();
  const A = messages.studio.analytics;
  const itemsCopy = messages.studio.items.analytics;
  const instagramLabel = messages.studio.inbox.platform.instagram;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [hasInsights, setHasInsights] = useState(false);
  const [profile, setProfile] = useState<InstagramAccountProfile | null>(null);
  const [week, setWeek] = useState<InstagramAccountWeek | null>(null);
  const [permOpen, setPermOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchInstagramAnalytics();
      if (result.unauthorized) {
        setError(A.signIn);
        setConnected(false);
        setHandle(null);
        setHasInsights(false);
        setProfile(null);
        setWeek(null);
        return;
      }
      if (result.error) setError(result.error);
      setConnected(result.connected);
      setHandle(result.handle);
      setHasInsights(result.hasInsights);
      setProfile(result.profile);
      setWeek(result.week);
    } catch (e) {
      setError(e instanceof Error ? e.message : A.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [A.loadFailed, A.signIn]);

  useEffect(() => {
    void load();
  }, [load]);

  const returnTo = `${pathname}`;
  const showReconnect = connected && !hasInsights;
  const emptyCopy = loading
    ? A.loading
    : !connected
      ? A.notConnected
      : showReconnect
        ? null
        : !week
          ? A.empty
          : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StudioCreateShell showCreate={false}>
        {error ? <div className="mb-3 text-sm font-semibold text-[var(--ember)]">{error}</div> : null}
        <StudioHeader label={itemsCopy.label} title={handle ?? A.title} subtitle={A.subtitle} />

        {showReconnect ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--muted)]">{A.reconnectHint}</p>
            <StudioCreateButton className="studio-create-btn--sm" onClick={() => setPermOpen(true)}>
              {A.reconnect}
            </StudioCreateButton>
          </div>
        ) : null}

        <StudioWrapperList className={`${studioWrapperList.surfaceGrow} mt-4`}>
          <div className={`${studioWrapperList.tableScroll} p-0.5`}>
            {emptyCopy ? (
              <StudioWrapperListBody as="div">
                <StudioWrapperListRow empty className="flex flex-col items-center gap-4 px-4 py-12 text-sm">
                  <span>{emptyCopy}</span>
                  {!loading && !connected ? (
                    <StudioCreateButton onClick={() => setPermOpen(true)}>{A.connect}</StudioCreateButton>
                  ) : null}
                </StudioWrapperListRow>
              </StudioWrapperListBody>
            ) : week ? (
              <div className="studio-analytics-account">
                <p className="studio-analytics-account__kicker">{A.weekLabel}</p>
                <p className="studio-analytics-account__hero">
                  {formatCount(week.views ?? week.reach)}
                  <span>{week.views != null || week.reach == null ? A.viewsLabel : A.reach}</span>
                </p>
                <WeekBars week={week} />
                <ul className="studio-analytics-account__stats">
                  <li>
                    <span>{A.reach}</span>
                    <strong>{formatCount(week.reach)}</strong>
                  </li>
                  <li>
                    <span>{A.followers}</span>
                    <strong>{formatCount(profile?.followers)}</strong>
                  </li>
                  <li>
                    <span>{A.follows}</span>
                    <strong>{formatCount(week.follows)}</strong>
                  </li>
                  <li>
                    <span>{A.engaged}</span>
                    <strong>{formatCount(week.accountsEngaged ?? week.interactions)}</strong>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </StudioWrapperList>
      </StudioCreateShell>

      <PlatformPermissionsModal
        open={permOpen}
        platformId="instagram"
        platformLabel={instagramLabel}
        extraDefaultIds={ANALYTICS_IG_DEFAULTS}
        onClose={() => setPermOpen(false)}
        onConfirm={(picked) => {
          const ids = picked.includes("instagram.insights.read")
            ? picked
            : [...picked, "instagram.insights.read"];
          startInstagramOAuth(ids, returnTo);
        }}
      />
    </div>
  );
}
