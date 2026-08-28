"use client";

import {
  DiscordLogo,
  DropboxLogo,
  EmailLogo,
  FacebookLogo,
  GoogleCalendarLogo,
  GoogleDriveLogo,
  GoogleSheetsLogo,
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
  | "googleSheets"
  | "googleCalendar"
  | "dropbox"
  | "email"
  | "discord";

export type PlatformGroupId = "social" | "messengers" | "storage" | "productivity" | "notifications";

export type ConnectedAccount = {
  displayName: string;
  connectedAt: number;
  lastSyncAt: number | null;
};

export function PlatformIcon({ id, className }: { id: PlatformId; className?: string }) {
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
    case "googleSheets":
      return <GoogleSheetsLogo className={className} />;
    case "googleCalendar":
      return <GoogleCalendarLogo className={className} />;
    case "dropbox":
      return <DropboxLogo className={className} />;
    case "email":
      return <EmailLogo className={className} />;
    case "discord":
      return <DiscordLogo className={className} />;
  }
}

export function formatRelative(ms: number): string {
  const d = Math.max(0, Date.now() - ms);
  const min = Math.round(d / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}
