import Image from "next/image";

import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import type { LegalServiceId } from "@/lib/legal/catalog";

const COLOR_ICONS: Partial<Record<LegalServiceId, string>> = {
  tiktok: "/home/icons/color/tiktok.svg",
  instagram: "/home/icons/color/instagram.svg",
  youtube: "/home/icons/color/youtube.svg",
  facebook: "/home/icons/color/facebook.svg",
  pinterest: "/home/icons/color/pinterest.svg",
  linkedin: "/home/icons/color/linkedin.svg",
  telegram: "/home/icons/color/telegram.svg",
  discord: "/home/icons/color/discord.svg",
};

export function LegalServiceIcon({
  id,
  className,
}: {
  id: LegalServiceId;
  className?: string;
}) {
  if (id === "kont") {
    return <KontBrandLogo variant="mark" decorative className={className} />;
  }

  const src = COLOR_ICONS[id];
  if (!src) return null;

  return <Image src={src} alt="" width={24} height={24} className={className} />;
}
