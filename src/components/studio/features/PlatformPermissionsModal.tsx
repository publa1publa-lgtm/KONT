"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Blocks,
  Check,
  Eye,
  FilePenLine,
  Inbox,
  KeyRound,
  LayoutList,
  Send,
  Settings2,
  ShieldCheck,
  Upload,
  UserRound,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { StudioDialog } from "./StudioDialog";
import { StudioCreateButton, StudioGhostButton } from "./StudioCreateButton";
import { formatTemplate } from "@/lib/formatTemplate";
import { INBOX_UNIFIED_PERMISSION_ID } from "@/lib/studioInboxPermissions";
import { driveScopesForPermissionIds } from "@/lib/google-drive/permissions";
import { metaScopesForPermissionIds } from "@/lib/meta/permissions";
import { youtubeScopesForPermissionIds } from "@/lib/youtube/permissions";
import { platformBrandAccent, platformIconTileStyle } from "./platformCardStyles";
import { PlatformIcon, type PlatformId } from "./platformShared";

export type { PlatformId };

/** Shared capability labels across platforms — only the scopes under them differ. */
export type PermissionCategoryId =
  | "account"
  | "publish"
  | "manage"
  | "read"
  | "analytics"
  | "inbox"
  | "pages"
  | "write"
  | "send"
  | "webhook"
  | "token"
  | "integration";

export type PermissionSpec = {
  id: string;
  category: PermissionCategoryId;
  required?: boolean;
  /** Pre-checked when the modal opens (optional scopes only). */
  defaultOn?: boolean;
  /** Provider permission / scope names shown under the category title. */
  scopes?: readonly string[];
};

const GOOGLE_AUTH_PREFIX = "https://www.googleapis.com/auth/";

/** Shorten long Google scope URLs for display; Meta / custom ids stay as-is. */
export function formatPermissionScopeName(scope: string): string {
  if (scope.startsWith(GOOGLE_AUTH_PREFIX)) return scope.slice(GOOGLE_AUTH_PREFIX.length);
  return scope;
}

export const PERMISSION_CATEGORY_ICONS: Record<PermissionCategoryId, LucideIcon> = {
  account: UserRound,
  publish: Upload,
  manage: Settings2,
  read: Eye,
  analytics: BarChart3,
  inbox: Inbox,
  pages: LayoutList,
  write: FilePenLine,
  send: Send,
  webhook: Webhook,
  token: KeyRound,
  integration: Blocks,
};

const CATEGORY_FALLBACK_LABEL: Record<PermissionCategoryId, string> = {
  account: "Account",
  publish: "Publish",
  manage: "Manage",
  read: "Read",
  analytics: "Analytics",
  inbox: "Inbox",
  pages: "Pages",
  write: "Write",
  send: "Send",
  webhook: "Webhooks",
  token: "Access token",
  integration: "Integration",
};

/** Same for every social network. Platform-specific scopes are appended below. */
export const SOCIAL_SHARED_PERMISSIONS: PermissionSpec[] = [
  {
    id: "account.identity",
    category: "account",
    required: true,
  },
  {
    id: INBOX_UNIFIED_PERMISSION_ID,
    category: "inbox",
    scopes: [INBOX_UNIFIED_PERMISSION_ID],
  },
];

const YOUTUBE_SCOPE_PERMISSIONS: PermissionSpec[] = [
  {
    id: "youtube.upload",
    category: "publish",
    scopes: ["youtube.upload"],
  },
  {
    id: "youtube",
    category: "manage",
    scopes: ["youtube"],
  },
  {
    id: "youtube.readonly",
    category: "read",
    scopes: ["youtube.readonly"],
  },
  {
    id: "yt-analytics.readonly",
    category: "analytics",
    scopes: ["yt-analytics.readonly"],
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

export function metaScopesForPermissions(
  platformId: "facebook" | "instagram",
  permissionIds: readonly string[],
): string[] {
  return metaScopesForPermissionIds(platformId, permissionIds);
}

export function permissionCategoryOf(
  platformId: PlatformId,
  permissionId: string,
): PermissionCategoryId | null {
  return PLATFORM_PERMISSIONS[platformId].find((p) => p.id === permissionId)?.category ?? null;
}

/** Category label for a stored permission id (English fallback if i18n unavailable). */
export function permissionLabel(platformId: PlatformId, permissionId: string): string {
  const category = permissionCategoryOf(platformId, permissionId);
  return category ? CATEGORY_FALLBACK_LABEL[category] : permissionId;
}

export const PLATFORM_PERMISSIONS: Record<PlatformId, PermissionSpec[]> = {
  youtube: [...SOCIAL_SHARED_PERMISSIONS, ...YOUTUBE_SCOPE_PERMISSIONS],
  tiktok: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "tiktok.publish", category: "publish", scopes: ["tiktok.publish"] },
    { id: "tiktok.manage", category: "manage", scopes: ["tiktok.manage"] },
    { id: "tiktok.analytics.read", category: "analytics", scopes: ["tiktok.analytics.read"] },
  ],
  instagram: [
    {
      id: "account.identity",
      category: "account",
      required: true,
    },
    {
      id: "instagram.content_publish",
      category: "publish",
      defaultOn: true,
      required: true,
      scopes: ["instagram_content_publish"],
    },
    {
      id: "instagram.insights.read",
      category: "analytics",
      scopes: ["instagram_manage_insights"],
    },
    {
      id: "instagram.manage_messages",
      category: "inbox",
      scopes: ["instagram_manage_messages", "pages_manage_metadata"],
    },
  ],
  facebook: [
    {
      id: "account.identity",
      category: "account",
      required: true,
    },
    {
      id: "pages_show_list",
      category: "pages",
      required: true,
      scopes: ["pages_show_list"],
    },
    {
      id: "pages_manage_posts",
      category: "publish",
      defaultOn: true,
      required: true,
      scopes: ["pages_manage_posts"],
    },
    {
      id: "pages_messaging",
      category: "inbox",
      scopes: ["pages_messaging", "pages_manage_metadata", "pages_read_engagement"],
    },
  ],
  pinterest: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "pinterest.read_boards", category: "read", scopes: ["pinterest.read_boards"] },
    { id: "pinterest.create_pins", category: "publish", scopes: ["pinterest.create_pins"] },
    { id: "pinterest.analytics.read", category: "analytics", scopes: ["pinterest.analytics.read"] },
  ],
  linkedin: [
    ...SOCIAL_SHARED_PERMISSIONS,
    { id: "linkedin.w_member_social", category: "publish", scopes: ["linkedin.w_member_social"] },
    { id: "linkedin.w_organization_social", category: "publish", scopes: ["linkedin.w_organization_social"] },
    { id: "linkedin.r_organization_social", category: "read", scopes: ["linkedin.r_organization_social"] },
  ],
  telegram: [
    {
      id: "telegram.bot.token",
      category: "token",
      required: true,
      scopes: ["telegram.bot.token"],
    },
    {
      id: INBOX_UNIFIED_PERMISSION_ID,
      category: "inbox",
      scopes: [INBOX_UNIFIED_PERMISSION_ID],
    },
    {
      id: "telegram.sendMessages",
      category: "send",
      scopes: ["telegram.sendMessages"],
    },
    {
      id: "telegram.webhooks",
      category: "webhook",
      scopes: ["telegram.webhooks"],
    },
  ],
  notion: [
    {
      id: "notion.integration",
      category: "integration",
      required: true,
      scopes: ["notion.integration"],
    },
    { id: "notion.read", category: "read", scopes: ["notion.read"] },
    { id: "notion.write", category: "write", scopes: ["notion.write"] },
  ],
  googleDrive: [
    {
      id: "openid",
      category: "account",
      required: true,
      scopes: ["openid"],
    },
    {
      id: "drive.file",
      category: "write",
      defaultOn: true,
      scopes: ["drive.file"],
    },
    {
      id: "drive.readonly",
      category: "read",
      scopes: ["drive.readonly"],
    },
  ],
  googleSheets: [
    {
      id: "openid",
      category: "account",
      required: true,
      scopes: ["openid"],
    },
    {
      id: "spreadsheets",
      category: "write",
      defaultOn: true,
      scopes: ["spreadsheets"],
    },
    {
      id: "spreadsheets.readonly",
      category: "read",
      scopes: ["spreadsheets.readonly"],
    },
  ],
  googleCalendar: [
    {
      id: "openid",
      category: "account",
      required: true,
      scopes: ["openid"],
    },
    {
      id: "calendar.events",
      category: "manage",
      defaultOn: true,
      scopes: ["calendar.events"],
    },
    {
      id: "calendar.readonly",
      category: "read",
      scopes: ["calendar.readonly"],
    },
  ],
  dropbox: [
    {
      id: "dropbox.oauth",
      category: "account",
      required: true,
      scopes: ["dropbox.oauth"],
    },
    { id: "files.content.read", category: "read", scopes: ["files.content.read"] },
    { id: "files.content.write", category: "write", scopes: ["files.content.write"] },
  ],
  email: [
    {
      id: "email.smtp",
      category: "token",
      required: true,
      scopes: ["email.smtp"],
    },
    { id: "email.send", category: "send", scopes: ["email.send"] },
  ],
  discord: [
    {
      id: "discord.webhook",
      category: "webhook",
      required: true,
      scopes: ["discord.webhook"],
    },
    { id: "discord.postMessages", category: "send", scopes: ["discord.postMessages"] },
  ],
};

function permissionScopeLines(spec: PermissionSpec): string[] {
  if (spec.scopes?.length) return spec.scopes.map(formatPermissionScopeName);
  return [];
}

function PermissionRow({
  spec,
  categoryLabel,
  checked,
  locked,
  requiredLabel,
  onToggle,
}: {
  spec: PermissionSpec;
  categoryLabel: string;
  checked: boolean;
  locked: boolean;
  requiredLabel: string;
  onToggle: (next: boolean) => void;
}) {
  const Icon = PERMISSION_CATEGORY_ICONS[spec.category];
  const scopeLines = permissionScopeLines(spec);

  return (
    <label
      className={[
        "studio-perm-row",
        checked ? "studio-perm-row--checked" : "",
        locked ? "studio-perm-row--locked" : "",
      ].join(" ")}
      data-category={spec.category}
    >
      <input
        type="checkbox"
        className="studio-perm-row__native-check"
        checked={checked}
        disabled={locked}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="studio-perm-row__icon pointer-events-none relative z-[1]" aria-hidden>
        <Icon strokeWidth={2.1} />
      </span>
      <span className="studio-perm-row__body pointer-events-none relative z-[1] min-w-0">
        <span className="studio-perm-row__title-row">
          <span className="studio-perm-row__title">{categoryLabel}</span>
          {spec.required ? <span className="studio-perm-row__badge">{requiredLabel}</span> : null}
        </span>
        {scopeLines.length > 0 ? (
          <ul className="studio-perm-row__scopes">
            {scopeLines.map((scope) => (
              <li key={scope}>
                <code className="studio-perm-row__scope">{scope}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </span>
      <span className="studio-perm-row__check pointer-events-none relative z-[1]" aria-hidden>
        {checked ? <Check strokeWidth={3} /> : null}
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
          <div className="grid gap-2.5">{children}</div>
    </section>
  );
}

export function PlatformPermissionsModal({
  open,
  platformId,
  platformLabel,
  onClose,
  onConfirm,
  extraDefaultIds,
}: {
  open: boolean;
  platformId: PlatformId | null;
  platformLabel: string;
  onClose: () => void;
  onConfirm: (pickedPermissionIds: string[]) => void;
  extraDefaultIds?: readonly string[];
}) {
  const { messages } = useI18n();
  const PC = messages.studio.platformConnect;
  const C = messages.common;
  const categories = PC.categories;
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

    const sessionKey = `${platformId}:${(extraDefaultIds ?? []).join(",")}`;
    if (resetSessionRef.current === sessionKey) return;

    const initial = new Set<string>();
    for (const p of PLATFORM_PERMISSIONS[platformId]) {
      if (p.required || p.defaultOn) initial.add(p.id);
    }
    for (const id of extraDefaultIds ?? []) initial.add(id);
    setPicked(initial);
    setAccepted(false);
    resetSessionRef.current = sessionKey;
  }, [open, platformId, extraDefaultIds]);

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

  function categoryLabel(category: PermissionCategoryId): string {
    return categories[category] ?? CATEGORY_FALLBACK_LABEL[category];
  }

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
              <PlatformIcon id={platformId} className="h-[1.35rem] w-[1.35rem]" />
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
                  categoryLabel={categoryLabel(p.category)}
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
                    categoryLabel={categoryLabel(p.category)}
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
                    categoryLabel={categoryLabel(p.category)}
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
