"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { StudioDialog } from "./StudioDialog";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { formatTemplate } from "@/lib/formatTemplate";
import { INBOX_UNIFIED_PERMISSION_ID } from "@/lib/studioInboxPermissions";
import { driveScopesForPermissionIds } from "@/lib/google-drive/permissions";
import { youtubeScopesForPermissionIds } from "@/lib/youtube/permissions";
import { platformBrandAccent, platformIconTileStyle } from "./platformCardStyles";
import {
  DiscordLogo,
  DropboxLogo,
  EmailLogo,
  FacebookLogo,
  GoogleDriveLogo,
  InstagramLogo,
  LinkedInLogo,
  NotionLogo,
  PinterestLogo,
  TelegramLogo,
  TikTokLogo,
  YouTubeLogo,
} from "./platformLogos";

export type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "linkedin"
  | "telegram"
  | "notion"
  | "googleDrive"
  | "dropbox"
  | "email"
  | "discord";

export type PermissionSpec = {
  id: string;
  title: string;
  description: string;
  required?: boolean;
  /** Pre-checked when the modal opens (optional scopes only). */
  defaultOn?: boolean;
  /** Provider scope shown under the row (Google / Meta / etc.). */
  scope?: string;
};

/** Same for every social network. Platform-specific scopes are appended below. */
export const SOCIAL_SHARED_PERMISSIONS: PermissionSpec[] = [
  {
    id: "account.identity",
    title: "Account access",
    description: "Identify your account during OAuth and keep the connection active.",
    required: true,
  },
  {
    id: INBOX_UNIFIED_PERMISSION_ID,
    title: "Unified Inbox",
    description: "Show comments, mentions, and activity from this account in the studio Inbox.",
  },
];

const YOUTUBE_SCOPE_PERMISSIONS: PermissionSpec[] = [
  {
    id: "youtube.upload",
    title: "Upload videos",
    description: "Upload new videos to your YouTube channel. Without this, publishing is unavailable.",
    scope: "https://www.googleapis.com/auth/youtube.upload",
  },
  {
    id: "youtube",
    title: "Manage YouTube account",
    description: "Edit metadata, change visibility, and delete videos on your channel.",
    scope: "https://www.googleapis.com/auth/youtube",
  },
  {
    id: "youtube.readonly",
    title: "Read YouTube data",
    description: "View your channel, videos, playlists, and public YouTube information.",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
  },
  {
    id: "yt-analytics.readonly",
    title: "Read analytics",
    description: "View performance metrics such as views, watch time, and engagement.",
    scope: "https://www.googleapis.com/auth/yt-analytics.readonly",
  },
];

export const YOUTUBE_REQUIRED_PERMISSION_IDS: readonly string[] = [
  ...SOCIAL_SHARED_PERMISSIONS.filter((p) => p.required).map((p) => p.id),
  ...YOUTUBE_SCOPE_PERMISSIONS.filter((p) => p.required).map((p) => p.id),
];

export function youtubeScopesForPermissions(permissionIds: readonly string[]): string[] {
  return youtubeScopesForPermissionIds(permissionIds);
}

export function driveScopesForPermissions(permissionIds: readonly string[]): string[] {
  return driveScopesForPermissionIds(permissionIds);
}

export function permissionLabel(platformId: PlatformId, permissionId: string): string {
  const spec = PLATFORM_PERMISSIONS[platformId].find((p) => p.id === permissionId);
  return spec?.title ?? permissionId;
}

export const PLATFORM_PERMISSIONS: Record<PlatformId, PermissionSpec[]> = {
  youtube: [...SOCIAL_SHARED_PERMISSIONS, ...YOUTUBE_SCOPE_PERMISSIONS],
  tiktok: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "tiktok.publish", title: "Publish videos", description: "Upload and publish videos to your TikTok account." },
    { id: "tiktok.manage", title: "Manage posts", description: "Edit or delete posts created through KONT." },
    { id: "tiktok.analytics.read", title: "Read analytics", description: "View performance metrics for your TikTok posts." },
  ],
  instagram: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "instagram.content_publish", title: "Publish to Instagram", description: "Publish Reels and posts to your Instagram account." },
    { id: "instagram.manage_comments", title: "Manage comments", description: "Read and respond to comments on content posted through KONT." },
    { id: "instagram.insights.read", title: "Read insights", description: "View analytics and insights for your Instagram content." },
  ],
  facebook: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "pages_show_list", title: "Access pages", description: "List and select Facebook Pages you manage." },
    { id: "pages_manage_posts", title: "Publish posts", description: "Create and manage posts on selected Pages." },
    { id: "pages_read_engagement", title: "Read engagement", description: "Read reactions and comments for moderation and reporting." },
    { id: "read_insights", title: "Read insights", description: "View Page insights and analytics." },
  ],
  pinterest: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "pinterest.read_boards", title: "Read boards", description: "List boards and sections you choose to share." },
    { id: "pinterest.create_pins", title: "Create Pins", description: "Publish new Pins to boards you manage." },
    { id: "pinterest.analytics.read", title: "Read analytics", description: "View Pin and board performance metrics." },
  ],
  linkedin: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "linkedin.w_member_social", title: "Post as member", description: "Create and manage posts on behalf of the authenticated member." },
    { id: "linkedin.w_organization_social", title: "Post as organization", description: "Publish to LinkedIn Pages you administer." },
    { id: "linkedin.r_organization_social", title: "Read organization content", description: "Read posts and analytics for managed Pages." },
  ],
  telegram: [
    { id: "telegram.bot.token", title: "Bot token", description: "Use your Bot API token to send messages from automations.", required: true },
    {
      id: INBOX_UNIFIED_PERMISSION_ID,
      title: "Unified Inbox",
      description: "Show inbound bot conversations and updates in the studio Inbox.",
    },
    { id: "telegram.sendMessages", title: "Send messages", description: "Send notifications to chats/users where your bot is allowed." },
    { id: "telegram.webhooks", title: "Webhooks", description: "Receive updates via webhook (optional, needed for inbound commands)." },
  ],
  notion: [
    { id: "notion.integration", title: "Notion Integration", description: "Use an integration token connected to pages/databases.", required: true },
    { id: "notion.read", title: "Read pages & databases", description: "Read database rows and page content." },
    { id: "notion.write", title: "Create & update pages", description: "Create pages, update properties, and append blocks." },
  ],
  googleDrive: [
    {
      id: "openid",
      title: "Basic identity",
      description: "Identify your Google account during OAuth.",
      required: true,
      scope: "openid",
    },
    {
      id: "drive.file",
      title: "Create & manage app files",
      description: "Create and upload files that KONT opens or creates in Drive.",
      defaultOn: true,
      scope: "https://www.googleapis.com/auth/drive.file",
    },
    {
      id: "drive.readonly",
      title: "Read files",
      description: "List and read existing Drive files for import.",
      scope: "https://www.googleapis.com/auth/drive.readonly",
    },
  ],
  dropbox: [
    { id: "dropbox.oauth", title: "Dropbox OAuth", description: "Authorize ContentFabric to access your Dropbox.", required: true },
    { id: "files.content.read", title: "Read file content", description: "Download files for import/export pipelines." },
    { id: "files.content.write", title: "Write file content", description: "Upload exports, previews, and generated assets." },
  ],
  email: [
    { id: "email.smtp", title: "SMTP / provider API key", description: "Use SMTP credentials or provider API key to send email.", required: true },
    { id: "email.send", title: "Send emails", description: "Send notification emails to recipients you configure." },
  ],
  discord: [
    { id: "discord.webhook", title: "Incoming webhook", description: "Post messages to a channel via webhook URL.", required: true },
    { id: "discord.postMessages", title: "Post messages", description: "Send automation notifications to Discord." },
  ],
};


function PlatformConnectIcon({ id, className }: { id: PlatformId; className?: string }) {
  switch (id) {
    case "youtube":
      return <YouTubeLogo className={className} />;
    case "tiktok":
      return <TikTokLogo className={className} />;
    case "instagram":
      return <InstagramLogo className={className} />;
    case "facebook":
      return <FacebookLogo className={className} />;
    case "pinterest":
      return <PinterestLogo className={className} />;
    case "linkedin":
      return <LinkedInLogo className={className} />;
    case "telegram":
      return <TelegramLogo className={className} />;
    case "notion":
      return <NotionLogo className={className} />;
    case "googleDrive":
      return <GoogleDriveLogo className={className} />;
    case "dropbox":
      return <DropboxLogo className={className} />;
    case "email":
      return <EmailLogo className={className} />;
    case "discord":
      return <DiscordLogo className={className} />;
  }
}

function PermissionRow({
  spec,
  checked,
  locked,
  requiredLabel,
  onToggle,
}: {
  spec: PermissionSpec;
  checked: boolean;
  locked: boolean;
  requiredLabel: string;
  onToggle: (next: boolean) => void;
}) {
  return (
    <label
      className={[
        "studio-perm-row",
        checked ? "studio-perm-row--checked" : "",
        locked ? "studio-perm-row--locked" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="studio-perm-row__native-check"
        checked={checked}
        disabled={locked}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="studio-perm-row__check pointer-events-none relative z-[1]" aria-hidden>
        {checked ? <Check strokeWidth={3} /> : null}
      </span>
      <span className="pointer-events-none relative z-[1] min-w-0">
        <span className="studio-perm-row__title-row">
          <span className="studio-perm-row__title">{spec.title}</span>
          {spec.required ? <span className="studio-perm-row__badge">{requiredLabel}</span> : null}
        </span>
        <p className="studio-perm-row__desc">{spec.description}</p>
        <code className="studio-perm-row__id">{spec.scope ?? spec.id}</code>
      </span>
    </label>
  );
}

function PermissionSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="studio-perm-section" aria-label={label}>
      <div className="studio-perm-section__head">
        <h3 className="studio-perm-section__label">{label}</h3>
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}


export function PlatformPermissionsModal({
  open,
  platformId,
  platformLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  platformId: PlatformId | null;
  platformLabel: string;
  onClose: () => void;
  onConfirm: (pickedPermissionIds: string[]) => void;
}) {
  const { messages } = useI18n();
  const PC = messages.studio.platformConnect;
  const C = messages.common;
  const permissions = useMemo(() => (platformId ? PLATFORM_PERMISSIONS[platformId] : []), [platformId]);

  const defaultPicked = useMemo(() => {
    const picked = new Set<string>();
    for (const p of permissions) if (p.required || p.defaultOn) picked.add(p.id);
    return picked;
  }, [permissions]);

  const [picked, setPicked] = useState<Set<string>>(defaultPicked);
  const [accepted, setAccepted] = useState(false);
  const resetSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      resetSessionRef.current = null;
      return;
    }
    if (!platformId) return;

    const sessionKey = platformId;
    if (resetSessionRef.current === sessionKey) return;

    const initial = new Set<string>();
    for (const p of PLATFORM_PERMISSIONS[platformId]) {
      if (p.required || p.defaultOn) initial.add(p.id);
    }
    setPicked(initial);
    setAccepted(false);
    resetSessionRef.current = sessionKey;
  }, [open, platformId]);

  const requiredOk = useMemo(() => {
    for (const p of permissions) {
      if (p.required && !picked.has(p.id)) return false;
    }
    return true;
  }, [permissions, picked]);

  const canContinue = open && Boolean(platformId) && requiredOk && accepted;

  const requiredPermissions = useMemo(() => permissions.filter((p) => p.required), [permissions]);
  const optionalPermissions = useMemo(() => permissions.filter((p) => !p.required), [permissions]);

  const agreeId = useId();

  if (!open || !platformId) return null;

  const connectTitle = formatTemplate(PC.connect, { platform: platformLabel });

  return (
    <StudioDialog
      open={open}
      onClose={onClose}
      title={connectTitle}
      fillViewport
      widthClassName="w-full max-w-[720px]"
      cancelLabel={C.cancel}
      bodyClassName="flex min-h-0 flex-1 flex-col px-5 py-4"
      header={({ titleId }) => (
        <div className="studio-permissions-header">
          <div className="studio-permissions-header__main">
            <div
              className="studio-permissions-header__icon"
              style={platformIconTileStyle(platformId ? platformBrandAccent(platformId) : "var(--ice)")}
            >
              <PlatformConnectIcon id={platformId} className="h-[1.35rem] w-[1.35rem]" />
            </div>
            <div className="min-w-0">
              <p className="studio-permissions-header__eyebrow">{PC.permissions}</p>
              <h2 id={titleId} className="studio-permissions-header__title">
                {connectTitle}
              </h2>
              <p className="studio-permissions-header__intro">{PC.intro}</p>
              <div className="studio-permissions-summary">
                <span className="studio-permissions-summary__pill">
                  {picked.size} / {permissions.length}
                </span>
                <span className="studio-permissions-summary__pill studio-permissions-summary__pill--muted">
                  {requiredPermissions.length} {C.required}
                </span>
                {accepted ? (
                  <span className="studio-permissions-summary__pill" title={PC.agreeTitle}>
                    <Check className="h-3 w-3" strokeWidth={2.75} aria-hidden />
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
      footer={
        <div className="studio-permissions-footer-stack">
          <label
            className={[
              "studio-perm-consent__card",
              accepted ? "studio-perm-consent__card--accepted" : "",
            ].join(" ")}
          >
            <input
              id={agreeId}
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="studio-perm-consent__native-check"
            />
            <span className="studio-perm-consent__shield pointer-events-none relative z-[1]" aria-hidden>
              <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="pointer-events-none relative z-[1] min-w-0 text-start">
              <span className="studio-perm-consent__title">{PC.agreeTitle}</span>
              <span className="studio-perm-consent__body">{PC.agreeBody}</span>
            </span>
            <span className="studio-perm-row__check pointer-events-none relative z-[1] mt-0.5 shrink-0" aria-hidden>
              {accepted ? <Check strokeWidth={3} /> : null}
            </span>
          </label>

          <div className="studio-permissions-footer studio-permissions-footer--actions-only">
            <div className="studio-permissions-footer__actions">
              <StudioGhostButton type="button" className="studio-btn-ghost--md" onClick={onClose}>
                {C.cancel}
              </StudioGhostButton>
              <StudioCreateButton
                type="button"
                className="studio-create-btn--sm"
                disabled={!canContinue}
                onClick={() => onConfirm(Array.from(picked))}
              >
                {PC.continue}
              </StudioCreateButton>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-1 [scrollbar-width:thin]">
        {requiredPermissions.length > 0 ? (
          <PermissionSection label={C.required}>
            {requiredPermissions.map((p) => (
              <PermissionRow
                key={p.id}
                spec={p}
                checked={picked.has(p.id)}
                locked
                requiredLabel={C.required}
                onToggle={() => undefined}
              />
            ))}
          </PermissionSection>
        ) : null}

        {optionalPermissions.length > 0 ? (
          requiredPermissions.length > 0 ? (
            <PermissionSection label={PC.permissions}>
              {optionalPermissions.map((p) => (
                <PermissionRow
                  key={p.id}
                  spec={p}
                  checked={picked.has(p.id)}
                  locked={false}
                  requiredLabel={C.required}
                  onToggle={(next) => {
                    const updated = new Set(picked);
                    if (next) updated.add(p.id);
                    else updated.delete(p.id);
                    setPicked(updated);
                  }}
                />
              ))}
            </PermissionSection>
          ) : (
            <div className="grid gap-2">
              {optionalPermissions.map((p) => (
                <PermissionRow
                  key={p.id}
                  spec={p}
                  checked={picked.has(p.id)}
                  locked={false}
                  requiredLabel={C.required}
                  onToggle={(next) => {
                    const updated = new Set(picked);
                    if (next) updated.add(p.id);
                    else updated.delete(p.id);
                    setPicked(updated);
                  }}
                />
              ))}
            </div>
          )
        ) : null}
        </div>
      </div>
    </StudioDialog>
  );
}

