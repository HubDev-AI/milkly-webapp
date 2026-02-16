import type { Category } from "../../../milkly-backend/src/types";

export type FeedFilter = "all" | "lastMilk";

export const queryKeys = {
  streams: {
    all: ["streams"] as const,
    lists: () => [...queryKeys.streams.all, "list"] as const,
    list: (filters?: { page?: number; limit?: number }) => [...queryKeys.streams.lists(), filters] as const,
    details: () => [...queryKeys.streams.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.streams.details(), id] as const,
    feed: (id: string) => [...queryKeys.streams.all, id, "feed"] as const,
    feedInfinite: (
      id: string,
      category: Category | "all",
      feedFilter: FeedFilter,
      search?: string
    ) => [...queryKeys.streams.all, id, "feed", "infinite", category, feedFilter, search] as const,
    feedCustomCheck: (id: string) => [...queryKeys.streams.all, id, "feed", "custom-check"] as const,
    templates: (id: string) => [...queryKeys.streams.all, id, "templates"] as const,
    availableCategories: () => [...queryKeys.streams.all, "available-categories"] as const,
  },

  feed: {
    all: ["feed"] as const,
    byStream: (streamId: string) => [...queryKeys.feed.all, "stream", streamId] as const,
    byLinkedStream: (streamId: string) => [...queryKeys.feed.all, "linked-stream", streamId] as const,
  },

  templates: {
    all: ["templates"] as const,
    byStream: (streamId: string) => [...queryKeys.templates.all, "stream", streamId] as const,
    byLinkedStream: (streamId: string) => [...queryKeys.templates.all, "linked-stream", streamId] as const,
    lists: () => [...queryKeys.templates.all, "list"] as const,
    list: (filters?: {
      page?: number;
      limit?: number;
      streamType?: "stream" | "linkedStream" | "all" | "global";
      isActive?: boolean;
      search?: string;
    }) => [...queryKeys.templates.lists(), filters] as const,
    details: () => [...queryKeys.templates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.templates.details(), id] as const,
  },

  newsletters: {
    all: ["newsletters"] as const,
    lists: () => [...queryKeys.newsletters.all, "list"] as const,
    list: (streamId: string) => [...queryKeys.newsletters.lists(), streamId] as const,
    details: () => [...queryKeys.newsletters.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.newsletters.details(), id] as const,
  },

  linkedStreams: {
    all: ["linked-streams"] as const,
    lists: () => [...queryKeys.linkedStreams.all, "list"] as const,
    list: (filters?: { page?: number }) => [...queryKeys.linkedStreams.lists(), filters] as const,
    details: () => [...queryKeys.linkedStreams.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.linkedStreams.details(), id] as const,
    summary: () => [...queryKeys.linkedStreams.all, "summary"] as const,
    feed: (id: string) => ["linked-stream", id, "feed"] as const,
    feedInfinite: (
      id: string,
      category: Category | "all",
      feedFilter: FeedFilter,
      batchId?: string,
      search?: string
    ) => ["linked-stream", id, "feed", "infinite", category, feedFilter, batchId, search] as const,
    feedCustomCheck: (id: string) => ["linked-stream", id, "feed", "custom-check"] as const,
    templates: (id: string) => ["linked-stream", id, "templates"] as const,
  },

  media: {
    all: ["media"] as const,
    status: () => [...queryKeys.media.all, "status"] as const,
    list: (params?: { page?: number; search?: string; tags?: string }) =>
      [...queryKeys.media.all, "list", params] as const,
    listInfinite: (params?: { search?: string; tags?: string }) =>
      [...queryKeys.media.all, "list", "infinite", params] as const,
    detail: (id: string) => [...queryKeys.media.all, "detail", id] as const,
    url: (id: string) => [...queryKeys.media.all, "url", id] as const,
    usage: () => [...queryKeys.media.all, "usage"] as const,
    logo: () => [...queryKeys.media.all, "logo"] as const,
  },

  subscription: {
    all: ["subscription"] as const,
    details: () => ["subscription-details"] as const,
    categories: () => ["available-categories"] as const,
  },

  user: {
    all: ["user"] as const,
    current: () => [...queryKeys.user.all, "current"] as const,
  },

  account: {
    all: ["account"] as const,
    data: () => [...queryKeys.account.all, "data"] as const,
    usage: () => [...queryKeys.account.all, "usage"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
