"use client";

import Image from "next/image";

const FLOAT_ICONS = [
  { src: "/home/icons/color/instagram.svg", label: "Instagram" },
  { src: "/home/icons/color/youtube.svg", label: "YouTube" },
  { src: "/home/icons/color/tiktok.svg", label: "TikTok" },
  { src: "/home/icons/color/x.svg", label: "X" },
  { src: "/home/icons/color/telegram.svg", label: "Telegram" },
  { src: "/home/icons/color/linkedin.svg", label: "LinkedIn" },
  { src: "/home/icons/color/facebook.svg", label: "Facebook" },
  { src: "/home/icons/color/threads.svg", label: "Threads" },
] as const;

export function HeroFloatingIcons() {
  return (
    <div className="hero2-float-icons" aria-hidden="true">
      {FLOAT_ICONS.map((icon, i) => (
        <span
          key={icon.label}
          className={`hero2-float-icons__item hero2-float-icons__item--${i + 1}${i >= 5 ? " hero2-float-icons__item--sm" : ""}`}
          title={icon.label}
        >
          <Image src={icon.src} alt="" width={20} height={20} />
        </span>
      ))}
    </div>
  );
}
