import type { ReelPlatformId } from "@/lib/reelPlatformIds";
import { REEL_PLATFORM_IDS } from "@/lib/reelPlatformIds";
import { platformIconTileStyle } from "./platformCardStyles";
import {
  FacebookLogo,
  InstagramLogo,
  LinkedInLogo,
  PinterestLogo,
  TikTokLogo,
  YouTubeLogo,
} from "./platformLogos";

const PLATFORM_ACCENT: Record<ReelPlatformId, string> = {
  youtube: "#FF0033",
  tiktok: "var(--fg)",
  instagram: "#E1306C",
  facebook: "#1877F2",
  pinterest: "#E60023",
  linkedin: "#0A66C2",
};

function platformIconColor(id: ReelPlatformId): string {
  switch (id) {
    case "instagram":
      return "text-[#E1306C]";
    case "youtube":
      return "text-[#FF0033]";
    case "tiktok":
      return "text-[var(--fg)]";
    case "facebook":
      return "text-[#1877F2]";
    case "pinterest":
      return "text-[#E60023]";
    case "linkedin":
      return "text-[#0A66C2]";
    default:
      return "text-[var(--muted)]";
  }
}

function PlatformIcon({ id, className }: { id: ReelPlatformId; className?: string }) {
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
  }
}

export type ContentPlatformLabels = Record<ReelPlatformId, string>;

type ContentPlatformIconsProps = {
  platforms?: ReelPlatformId[];
  labels: ContentPlatformLabels;
  density?: "default" | "compact";
};

export function ContentPlatformIcons({ platforms, labels, density = "default" }: ContentPlatformIconsProps) {
  const ordered = REEL_PLATFORM_IDS.filter((id) => (platforms ?? []).includes(id));
  if (!ordered.length) {
    return <span className="text-[11px] text-[var(--muted)]">—</span>;
  }

  const compact = density === "compact";

  return (
    <div
      className={["flex flex-wrap items-center", compact ? "gap-0.5" : "justify-center gap-1"].join(" ")}
      role="list"
      aria-label={ordered.map((id) => labels[id]).join(", ")}
    >
      {ordered.map((id) => (
        <span
          key={id}
          role="listitem"
          className={
            compact
              ? "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--muted)]"
              : "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
          }
          style={compact ? undefined : platformIconTileStyle(PLATFORM_ACCENT[id])}
          title={labels[id]}
        >
          <PlatformIcon
            id={id}
            className={
              compact
                ? `h-3 w-3 ${platformIconColor(id)}`
                : `h-3.5 w-3.5 ${platformIconColor(id)}`
            }
          />
        </span>
      ))}
    </div>
  );
}
