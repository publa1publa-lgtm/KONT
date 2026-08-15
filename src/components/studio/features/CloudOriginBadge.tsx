"use client";

import { Cloud } from "lucide-react";
import { cloudProviderLabel, type CloudMediaOrigin } from "@/lib/cloud/types";
import { DropboxLogo, GoogleDriveLogo } from "./platformLogos";

export function CloudOriginBadge({
  origin,
  className = "",
}: {
  origin: CloudMediaOrigin | null | undefined;
  className?: string;
}) {
  if (!origin) return null;
  const label = cloudProviderLabel(origin.provider);
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--ice)_12%,var(--studio-surface-3))] px-2 py-0.5 text-[10px] font-semibold tracking-tight text-[var(--fg)]",
        className,
      ].join(" ")}
      title={origin.webViewUrl ? `${label} · ${origin.label}` : origin.label}
    >
      {origin.provider === "dropbox" ? (
        <DropboxLogo className="size-3 shrink-0" />
      ) : origin.provider === "googleDrive" ? (
        <GoogleDriveLogo className="size-3 shrink-0" />
      ) : (
        <Cloud className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}
