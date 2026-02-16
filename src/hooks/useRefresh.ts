import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { useToast } from "@/hooks/useToast";
import { useLimitError } from "@/hooks/useLimitError";
import { queryKeys } from "@/lib/QueryKeys";
import type { SortOption, LinkedStreamRefreshResponse, Category } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

interface StreamRefreshResponse {
  refreshed: number;
  batchId: string;
}

export interface UseRefreshOptions {
  streamType: StreamType;
  id: string | undefined;
  sortPreference?: SortOption;
  category?: Category | "all"; // Optional: refresh specific category only
  onSuccess?: (result: StreamRefreshResponse | LinkedStreamRefreshResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseRefreshReturn {
  refresh: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  limitError: ReturnType<typeof useLimitError>["limitError"];
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
}

/**
 * Shared hook for refreshing/milking streams or linked streams.
 * Handles API calls, success/error toasts, and query invalidation.
 *
 * @example
 * ```tsx
 * // For streams
 * const { refresh, isPending } = useRefresh({
 *   streamType: "stream",
 *   id: streamId,
 *   sortPreference: stream.sortPreference,
 *   onSuccess: () => setFeedFilter("lastMilk"),
 * });
 *
 * // For linked streams
 * const { refresh, isPending } = useRefresh({
 *   streamType: "linkedStream",
 *   id: linkedStreamId,
 * });
 * ```
 */
export function useRefresh(options: UseRefreshOptions): UseRefreshReturn {
  const { streamType, id, sortPreference = "date", category, onSuccess, onError } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
  } = useLimitError();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("ID is required");

      const body: { sortBy: SortOption; category?: Category } = {
        sortBy: sortPreference,
      };

      // Only pass category if it's not "all" (all means fetch all categories)
      if (category && category !== "all") {
        body.category = category as Category;
      }

      if (streamType === "stream") {
        return api.post<StreamRefreshResponse>(`/streams/${id}/refresh`, body);
      } else {
        return api.post<LinkedStreamRefreshResponse>(`/linked-streams/${id}/refresh`, body);
      }
    },
    onSuccess: (result) => {
      // Always invalidate usage data to reflect the new refresh count
      queryClient.invalidateQueries({ queryKey: queryKeys.account.usage() });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });

      if (streamType === "stream") {
        const streamResult = result as StreamRefreshResponse;
        // Invalidate instead of reset to preserve cache structure while forcing refetch
        queryClient.invalidateQueries({
          queryKey: ["streams", id, "feed", "infinite"],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ["streams", id, "feed"]
        });
        toast({
          title: "Fresh content!",
          description: `Found ${streamResult.refreshed} new items.`,
        });
      } else {
        const linkedResult = result as LinkedStreamRefreshResponse;
        // Invalidate instead of reset to preserve cache structure while forcing refetch
        queryClient.invalidateQueries({
          queryKey: ["linked-stream", id, "feed", "infinite"],
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ["linked-stream", id, "feed"]
        });
        queryClient.invalidateQueries({
          queryKey: ["linked-stream", id, "batches"]
        });
        // Force refetch of custom items check to ensure Custom tab appears
        queryClient.refetchQueries({
          queryKey: ["linked-stream", id, "feed", "custom-check"]
        });

        if (linkedResult.streamsFailed > 0) {
          toast({
            title: "Partially refreshed",
            description: `Fetched ${linkedResult.refreshed} items from ${linkedResult.streamsRefreshed} streams. ${linkedResult.streamsFailed} failed.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Fresh content!",
            description: `Found ${linkedResult.refreshed} items from ${linkedResult.streamsRefreshed} streams.`,
          });
        }
      }

      onSuccess?.(result);
    },
    onError: (error) => {
      const isLimit = handleLimitError(error);
      if (!isLimit) {
        toast({
          title: "Refresh failed",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
      onError?.(error as Error);
    },
  });

  return {
    refresh: () => mutation.mutate(),
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
  };
}

export const refreshQueryKeys = {
  stream: (id: string) => ["streams", id, "refresh"] as const,
  linkedStream: (id: string) => ["linked-stream", id, "refresh"] as const,
};
