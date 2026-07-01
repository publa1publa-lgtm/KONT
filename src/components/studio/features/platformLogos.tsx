import type { ReactNode } from "react";

type Props = {
  className?: string;
  title?: string;
};

function Svg({ title, className, children }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function YouTubeLogo({ className, title = "YouTube" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M23.498 6.186a3.015 3.015 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.015 3.015 0 0 0 .502 6.186 31.247 31.247 0 0 0 0 12a31.247 31.247 0 0 0 .502 5.814 3.015 3.015 0 0 0 2.121 2.136c1.872.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136A31.247 31.247 0 0 0 24 12a31.247 31.247 0 0 0-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z"
      />
    </Svg>
  );
}

export function TikTokLogo({ className, title = "TikTok" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M17.303 6.063a5.76 5.76 0 0 1-1.69-4.083h-3.2v13.64a2.69 2.69 0 1 1-2.694-2.69c.26 0 .512.037.75.105V9.73a6.06 6.06 0 0 0-.75-.047 5.894 5.894 0 1 0 5.894 5.894V8.18a8.89 8.89 0 0 0 5.187 1.664V6.74a5.72 5.72 0 0 1-3.497-.677Z"
      />
    </Svg>
  );
}

export function InstagramLogo({ className, title = "Instagram" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M7.5 0h9A7.5 7.5 0 0 1 24 7.5v9A7.5 7.5 0 0 1 16.5 24h-9A7.5 7.5 0 0 1 0 16.5v-9A7.5 7.5 0 0 1 7.5 0Zm0 2.6A4.9 4.9 0 0 0 2.6 7.5v9a4.9 4.9 0 0 0 4.9 4.9h9a4.9 4.9 0 0 0 4.9-4.9v-9a4.9 4.9 0 0 0-4.9-4.9h-9Zm4.5 4.7a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4Zm0 2.6a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm6.1-3.05a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
      />
    </Svg>
  );
}

export function FacebookLogo({ className, title = "Facebook" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M24 12.07C24 5.405 18.627 0 12 0S0 5.405 0 12.07C0 18.092 4.388 23.082 10.125 24v-8.437H7.078v-3.493h3.047V9.41c0-3.03 1.792-4.703 4.532-4.703 1.312 0 2.686.236 2.686.236v2.975h-1.513c-1.49 0-1.955.93-1.955 1.885v2.263h3.328l-.532 3.493h-2.796V24C19.612 23.082 24 18.092 24 12.07Z"
      />
    </Svg>
  );
}

export function TelegramLogo({ className, title = "Telegram" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M21.8 3.7c.8-.3 1.5.4 1.2 1.2L19.4 20c-.3 1.4-1.3 1.7-2.6 1.1l-4-3-1.9 1.8c-.2.2-.4.4-.8.4l.3-4.4L18.6 7.1c.4-.4-.1-.7-.6-.3L8.1 13l-4.2-1.3c-1.3-.4-1.3-1.3.3-1.9L21.8 3.7Z"
      />
    </Svg>
  );
}

export function NotionLogo({ className, title = "Notion" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M6 2.8h12A3.2 3.2 0 0 1 21.2 6v12A3.2 3.2 0 0 1 18 21.2H6A3.2 3.2 0 0 1 2.8 18V6A3.2 3.2 0 0 1 6 2.8Zm0 2.2c-.6 0-1 .4-1 1v12c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H6Zm3 2.6h2.2l3.8 6.2V7.6H17v8.8h-2.2L11 10.2v6.2H9V7.6Z"
      />
    </Svg>
  );
}

export function GoogleDriveLogo({ className, title = "Google Drive" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z"
      />
    </Svg>
  );
}

export function DropboxLogo({ className, title = "Dropbox" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M7.2 3 2 6.4l5.2 3.4L12.4 6.4 7.2 3Zm9.6 0-5.2 3.4 5.2 3.4L22 6.4 16.8 3ZM2 13.2l5.2-3.4L12.4 13l-5.2 3.4L2 13.2Zm20 0-5.2-3.4L11.6 13l5.2 3.4L22 13.2ZM7.2 17.6 12 20.7l4.8-3.1-4.8-3.1-4.8 3.1Z"
      />
    </Svg>
  );
}

export function EmailLogo({ className, title = "Email" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M4.2 5.5h15.6c1.2 0 2.2 1 2.2 2.2v8.6c0 1.2-1 2.2-2.2 2.2H4.2C3 18.5 2 17.5 2 16.3V7.7c0-1.2 1-2.2 2.2-2.2Zm.5 2.1 7.1 5.1c.1.1.3.1.4 0l7.1-5.1H4.7Zm15.1 1.7-6.6 4.7c-.7.5-1.6.5-2.3 0L4.2 9.3v7c0 .2.2.4.4.4h14.8c.2 0 .4-.2.4-.4v-7Z"
      />
    </Svg>
  );
}

export function DiscordLogo({ className, title = "Discord" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M17.7 6.2c-1.2-.6-2.5-1-3.8-1.2l-.5 1c-1.4-.2-2.8-.2-4.2 0l-.5-1c-1.4.2-2.6.6-3.8 1.2C2.5 9.9 1.7 13.5 2 17c1.6 1.2 3.2 2 5 2.5l.7-1.2c-.6-.2-1.2-.5-1.7-.8l.4-.3c3.2 1.5 6.8 1.5 10 0l.4.3c-.5.3-1.1.6-1.7.8l.7 1.2c1.8-.5 3.4-1.3 5-2.5.4-3.4-.5-7-2.9-10.8ZM8.6 14.8c-.7 0-1.2-.7-1.2-1.5S7.9 11.8 8.6 11.8c.7 0 1.2.7 1.2 1.5s-.5 1.5-1.2 1.5Zm6.8 0c-.7 0-1.2-.7-1.2-1.5s.5-1.5 1.2-1.5c.7 0 1.2.7 1.2 1.5s-.5 1.5-1.2 1.5Z"
      />
    </Svg>
  );
}

export function PinterestLogo({ className, title = "Pinterest" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"
      />
    </Svg>
  );
}

export function LinkedInLogo({ className, title = "LinkedIn" }: Props) {
  return (
    <Svg className={className} title={title}>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </Svg>
  );
}

