import { Newspaper, Video, MessageCircle, FileEdit, MinusCircle } from "lucide-react";
import type { Category } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

export const NEWS_URL =
  import.meta.env.VITE_NEWS_URL || "http://localhost:8002";

export function getPublicNewsletterUrl(
  userId: string,
  newsletterId: string,
): string {
  return `${NEWS_URL}/users/${userId}/${newsletterId}`;
}

// UI Timing
export const UI = {
  DEBOUNCE_MS: 300,
  AUTOSAVE_DELAY_MS: 2000,
  TOAST_DURATION_MS: 2000,
  MOBILE_BREAKPOINT: 768,
  TOOLTIP_DELAY_MS: 300,
  NAVIGATION_DELAY_MS: 500,
  TIMER_INTERVAL_MS: 1000,
} as const;

// Query/Cache Settings
export const QUERY = {
  STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  SUBSCRIPTION_STALE_TIME_MS: 30 * 1000, // 30 seconds
  MEDIA_URL_STALE_TIME_MS: 50 * 60 * 1000, // 50 minutes (signed URLs expire in 1 hour)
} as const;

// Upload Limits
export const UPLOAD = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  TEMPLATES_LIMIT: 10,
  DRAFTS_LIMIT: 3,
  FEED_MAX: 100,
  STREAMS_DROPDOWN_MAX: 50,
} as const;

// Unified category configuration used across the entire app
export const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    icon: typeof Newspaper;
    // Dark theme colors
    textColor: string;
    bgColor: string;
    borderColor: string;
    badgeClass: string;
  }
> = {
  news: {
    label: "News",
    icon: Newspaper,
    textColor: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20",
  },
  videos: {
    label: "Videos",
    icon: Video,
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20",
  },
  social: {
    label: "Social",
    icon: MessageCircle,
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20",
  },
  custom: {
    label: "Custom",
    icon: FileEdit,
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
  },
  none: {
    label: "None",
    icon: MinusCircle,
    textColor: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    badgeClass: "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
  },
};

export function getCategoryConfig(category: Category) {
  return CATEGORY_CONFIG[category];
}

export function getCategoryLabel(category: Category): string {
  return CATEGORY_CONFIG[category].label;
}
