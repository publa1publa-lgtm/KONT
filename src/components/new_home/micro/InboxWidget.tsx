"use client";

import Image from "next/image";
import { SendHorizontal } from "lucide-react";

const THREADS = [
  {
    id: "ig",
    platform: "/home/icons/color/instagram.svg",
    author: "Maya Chen",
    preview: "This hook is insane — what mic are you using?",
    time: "12m",
    unread: true,
    active: true,
  },
  {
    id: "yt",
    platform: "/home/icons/color/youtube.svg",
    author: "Jordan Lee",
    preview: "Can you pin the timestamps in the description?",
    time: "55m",
    unread: true,
    active: false,
  },
  {
    id: "tt",
    platform: "/home/icons/color/tiktok.svg",
    author: "Avery",
    preview: "Stitch this into the next reel?",
    time: "2h",
    unread: false,
    active: false,
  },
  {
    id: "tg",
    platform: "/home/icons/color/telegram.svg",
    author: "Studio North",
    preview: "Draft approved — schedule for Friday?",
    time: "4h",
    unread: false,
    active: false,
  },
] as const;

const MESSAGES = [
  { from: "them" as const, body: "This hook is insane — what mic are you using?", time: "12m ago" },
  { from: "them" as const, body: "Also dropped this to our Slack, team loves it.", time: "11m ago" },
  { from: "me" as const, body: "Rode VideoMic GO II — full gear list in the caption.", time: "Just now" },
];

export function InboxWidget() {
  return (
    <div className="nh-inbox" aria-hidden>
      <div className="nh-inbox__layout">
        <ul className="nh-inbox__threads">
          {THREADS.map((t) => (
            <li
              key={t.id}
              className={
                t.active
                  ? "nh-inbox__thread nh-inbox__thread--active"
                  : "nh-inbox__thread"
              }
            >
              <span className="nh-inbox__thread-icon">
                <Image src={t.platform} alt="" width={14} height={14} />
              </span>
              <span className="nh-inbox__thread-copy">
                <strong>
                  {t.author}
                  {t.unread ? <i className="nh-inbox__unread" aria-hidden /> : null}
                </strong>
                <small>{t.preview}</small>
              </span>
              <span className="nh-inbox__thread-time">{t.time}</span>
            </li>
          ))}
        </ul>

        <div className="nh-inbox__pane">
          <div className="nh-inbox__pane-head">
            <Image src="/home/icons/color/instagram.svg" alt="" width={16} height={16} />
            <span>@studio.north · Comment</span>
          </div>
          <ul className="nh-inbox__messages">
            {MESSAGES.map((m, i) => (
              <li
                key={i}
                className={m.from === "me" ? "nh-inbox__msg nh-inbox__msg--me" : "nh-inbox__msg"}
              >
                <p>{m.body}</p>
                <time>{m.time}</time>
              </li>
            ))}
          </ul>
          <div className="nh-inbox__reply">
            <span>Reply from one desk…</span>
            <i aria-hidden>
              <SendHorizontal className="h-3 w-3" />
            </i>
          </div>
        </div>
      </div>
    </div>
  );
}
