import {
  ArrowUpRightIcon,
  ArticleMediumIcon,
  CalendarBlankIcon,
  CalendarDotsIcon,
  ChartLineUpIcon,
  FlaskIcon,
  HardDrivesIcon,
  ImagesIcon,
  PenNibIcon,
  PlugsConnectedIcon,
  RobotIcon,
  SparkleIcon,
  SubtitlesIcon,
  TrayIcon,
  TreeStructureIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react";

export type SectionId = "create" | "manage" | "grow";

export type StudioItem = {
  id: string;
  icon: Icon;
  /** CSS grid-area (row-start / col-start / row-end / col-end). */
  area: string;
};

export type StudioSection = {
  id: SectionId;
  /** Tailwind grid template for the section panel. */
  gridClass: string;
  items: StudioItem[];
};

/** Structure preserved 1:1 from the onboarding template (grid areas unchanged). */
export const SECTIONS: Record<SectionId, StudioSection> = {
  create: {
    id: "create",
    gridClass: "grid-cols-6 grid-rows-6",
    items: [
      { id: "content", icon: PenNibIcon, area: "1 / 1 / 4 / 5" },
      { id: "sub", icon: SubtitlesIcon, area: "1 / 5 / 4 / 7" },
      { id: "bot", icon: RobotIcon, area: "4 / 1 / 7 / 3" },
      { id: "automations", icon: TreeStructureIcon, area: "4 / 3 / 7 / 7" },
    ],
  },
  manage: {
    id: "manage",
    gridClass: "grid-cols-6 grid-rows-6",
    items: [
      { id: "events", icon: CalendarBlankIcon, area: "3 / 5 / 5 / 6" },
      { id: "media", icon: ImagesIcon, area: "3 / 6 / 5 / 7" },
      { id: "inbox", icon: TrayIcon, area: "5 / 5 / 7 / 6" },
      { id: "storage", icon: HardDrivesIcon, area: "5 / 6 / 7 / 7" },
      { id: "calendar", icon: CalendarDotsIcon, area: "1 / 1 / 7 / 5" },
      { id: "platforms", icon: PlugsConnectedIcon, area: "1 / 5 / 3 / 7" },
    ],
  },
  grow: {
    id: "grow",
    gridClass: "grid-cols-6 grid-rows-6",
    items: [
      { id: "analytics", icon: ChartLineUpIcon, area: "1 / 1 / 5 / 5" },
      { id: "insights", icon: SparkleIcon, area: "1 / 5 / 5 / 7" },
      { id: "reports", icon: ArticleMediumIcon, area: "5 / 1 / 7 / 3" },
      { id: "audience", icon: UsersThreeIcon, area: "5 / 3 / 7 / 5" },
      { id: "experiments", icon: FlaskIcon, area: "5 / 5 / 7 / 7" },
    ],
  },
};

export const SECTION_ORDER: SectionId[] = ["create", "manage", "grow"];

/** Shared tile chrome icon (arrow CTA). */
export const STUDIO_TILE_ARROW = ArrowUpRightIcon;

