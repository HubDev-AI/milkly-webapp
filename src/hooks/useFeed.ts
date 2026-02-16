import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import type {
  ContentItem,
  Category,
  PaginatedResponse,
  LinkedStreamFeedItem,
} from "../../../milkly-backend/src/types";
import {
  PaginatedResponseSchema,
  ContentItemSchema,
  LinkedStreamFeedItemSchema,
} from "../../../milkly-backend/src/types";

const ITEMS_PER_PAGE = 20;

export type StreamType = "stream" | "linkedStream";
export type FeedFilter = "all" | "lastMilk";

export interface UseFeedOptions {
  streamType: StreamType;
  id: string | undefined;
  category?: Category | "all";
  feedFilter?: FeedFilter;
  batchId?: string;
  search?: string;
  enabled?: boolean;
  itemsPerPage?: number;
}

export interface UseFeedReturn<T> {
  feedItems: T[];
  totalItems: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  refetch: () => void;
  latestBatchId: string | null;
}

function buildFeedUrl(
  streamType: StreamType,
  id: string,
  options: {
    category?: Category | "all";
    feedFilter?: FeedFilter;
    batchId?: string;
    search?: string;
    limit: number;
    offset: number;
  }
): string {
  const basePath =
    streamType === "linkedStream"
      ? `/linked-streams/${id}/feed`
      : `/streams/${id}/feed`;

  const params = new URLSearchParams();

  if (options.category && options.category !== "all") {
    params.set("category", options.category);
  }
  if (options.feedFilter === "lastMilk") {
    params.set("lastMilkOnly", "true");
  }
  if (options.batchId && options.batchId !== "all") {
    params.set("batchId", options.batchId);
  }
  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }
  params.set("limit", options.limit.toString());
  params.set("offset", options.offset.toString());

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Shared hook for fetching feed data from streams or linked streams.
 * Supports infinite scrolling with pagination.
 *
 * @example
 * ```tsx
 * // For streams
 * const { feedItems, hasMore, fetchNextPage, isLoading } = useFeed({
 *   streamType: "stream",
 *   id: streamId,
 *   category: "news",
 *   feedFilter: "lastMilk",
 *   search: debouncedSearch,
 * });
 *
 * // For linked streams
 * const { feedItems, hasMore, fetchNextPage } = useFeed({
 *   streamType: "linkedStream",
 *   id: linkedStreamId,
 *   category: "all",
 *   batchId: selectedBatch,
 *   search: debouncedSearch,
 * });
 * ```
 */
export function useFeed<T extends ContentItem | LinkedStreamFeedItem = ContentItem>(
  options: UseFeedOptions
): UseFeedReturn<T> {
  const {
    streamType,
    id,
    category = "all",
    feedFilter = "all",
    batchId,
    search,
    enabled = true,
    itemsPerPage = ITEMS_PER_PAGE,
  } = options;

  const queryKey =
    streamType === "stream"
      ? queryKeys.streams.feedInfinite(id ?? "", category, feedFilter, search)
      : queryKeys.linkedStreams.feedInfinite(id ?? "", category, feedFilter, batchId, search);

  const {
    data: feedData,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      if (!id) throw new Error("ID is required");

      const url = buildFeedUrl(streamType, id, {
        category,
        feedFilter,
        batchId,
        search,
        limit: itemsPerPage,
        offset: pageParam,
      });

      // Fetch and validate with Zod schema
      const response = await api.get<unknown>(url);
      const schema =
        streamType === "stream"
          ? PaginatedResponseSchema(ContentItemSchema)
          : PaginatedResponseSchema(LinkedStreamFeedItemSchema);
      return schema.parse(response) as PaginatedResponse<T>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore) return undefined;
      return (lastPage.offset ?? 0) + itemsPerPage;
    },
    enabled: enabled && !!id,
  });

  const feedItems = useMemo(() => {
    return feedData?.pages.flatMap((page) => page?.items ?? []) ?? [];
  }, [feedData?.pages]);

  const totalItems = feedData?.pages[0]?.total ?? 0;
  const hasMore = hasNextPage ?? false;
  const latestBatchId = feedData?.pages[0]?.latestBatchId ?? null;

  return {
    feedItems,
    totalItems,
    hasMore,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error: error as Error | null,
    fetchNextPage,
    refetch,
    latestBatchId,
  };
}

