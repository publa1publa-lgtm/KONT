"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const ACCOUNTS = [
  { src: "/home/icons/color/instagram.svg", label: "Instagram", connected: true },
  { src: "/home/icons/color/youtube.svg", label: "YouTube", connected: true },
  { src: "/home/icons/color/tiktok.svg", label: "TikTok", connected: true },
  { src: "/home/icons/color/telegram.svg", label: "Telegram", connected: true },
  { src: "/home/icons/color/x.svg", label: "X", connected: true },
  { src: "/home/icons/color/linkedin.svg", label: "LinkedIn", connected: false },
] as const;

export function AccountsWidget() {
  return (
    <div className="nh-accounts" aria-hidden>
      <ul className="nh-accounts__grid">
        {ACCOUNTS.map((a) => (
          <li
            key={a.label}
            className={a.connected ? "nh-accounts__item nh-accounts__item--on" : "nh-accounts__item"}
          >
            <span className="nh-accounts__icon">
              <Image src={a.src} alt="" width={18} height={18} />
            </span>
            <span className="nh-accounts__label">{a.label}</span>
            <span className="nh-accounts__status" aria-hidden />
          </li>
        ))}
      </ul>

      <p className="nh-accounts__trust">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        OAuth-only · revoke anytime
      </p>
    </div>
  );
}
