import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import type { ContentItem, PaginatedResponse, LinkedStreamFeedItem } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

export interface UseCustomItemsOptions {
  streamType: StreamType;
  id: string | undefined;
  enabled?: boolean;
}

export interface UseCustomItemsReturn {
  hasCustomItems: boolean;
  customItemsCount: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for checking if custom items exist for a stream or linked stream.
 * Useful for conditionally showing custom items tab in the UI.
 *
 * @example
 * ```tsx
 * const { hasCustomItems } = useCustomItems({
 *   streamType: "stream",
 *   id: streamId,
 * });
 *
 * // Conditionally show custom tab
 * const filterTabs = hasCustomItems
 *   ? [...baseTabs, { value: "custom", label: "Custom" }]
 *   : baseTabs;
 * ```
 */
export function useCustomItems(options: UseCustomItemsOptions): UseCustomItemsReturn {
  const { streamType, id, enabled = true } = options;

  const queryKey =
    streamType === "stream"
      ? queryKeys.streams.feedCustomCheck(id!)
      : queryKeys.linkedStreams.feedCustomCheck(id!);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!id) throw new Error("ID is required");

      if (streamType === "stream") {
        return api.get<PaginatedResponse<ContentItem>>(
          `/streams/${id}/feed?category=custom&limit=1`
        );
      } else {
        return api.get<PaginatedResponse<LinkedStreamFeedItem>>(
          `/linked-streams/${id}/feed?category=custom&limit=1`
        );
      }
    },
    enabled: enabled && !!id,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid excessive requests
  });

  const customItemsCount = data?.total ?? 0;
  const hasCustomItems = customItemsCount > 0;

  return {
    hasCustomItems,
    customItemsCount,
    isLoading,
    error: error as Error | null,
  };
}

