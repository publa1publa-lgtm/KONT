export type Platform = "Instagram" | "TikTok" | "YouTube" | "Pinterest" | "LinkedIn";

export type CalendarEvent = {
  id: string;
  dateKey: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  videoUrl: string; // data: URL (base64) or remote url
  title: string;
  description: string;
  hashtags: string[];
  platforms: Platform[];
  tags: string[]; // auto-generated based on platforms
  createdAt: number;
};

export type CalendarEventsByDate = Record<string, CalendarEvent[]>;

export type ScheduledPost = {
  id: string;
  kind: "post";
  title: string;
  dateKey: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  createdAt: number;
};

export type ScheduledPostsByDate = Record<string, ScheduledPost[]>;

