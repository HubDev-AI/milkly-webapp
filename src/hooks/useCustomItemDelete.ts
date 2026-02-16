import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import type { ContentItem, LinkedStreamFeedItem } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

export interface DeleteItemInfo {
  itemId: string;
  sourceStreamId?: string | null;
}

export interface UseCustomItemDeleteOptions {
  streamType: StreamType;
  id: string | undefined;
  onSuccess?: () => void;
}

export interface UseCustomItemDeleteReturn {
  deleteSingle: (info: DeleteItemInfo) => void;
  bulkDelete: (items: DeleteItemInfo[]) => void;
  getDeletableItems: <T extends ContentItem | LinkedStreamFeedItem>(
    items: T[],
    selectedIds: Set<string>
  ) => T[];
  isDeletingSingle: boolean;
  isDeletingBulk: boolean;
  isDeleting: boolean;
}

interface BulkDeleteResponse {
  deleted: number;
  skipped: number;
}

/**
 * Hook for deleting custom items from streams or linked streams.
 * Supports both single item deletion and bulk deletion.
 *
 * For linked streams, items may belong to:
 * - The linked stream itself (isLinkedStreamCustomItem: true, streamId: null)
 * - A member stream (isLinkedStreamCustomItem: false, streamId: string)
 *
 * The hook automatically routes deletion to the correct endpoint based on sourceStreamId.
 *
 * @example
 * ```tsx
 * const { deleteSingle, bulkDelete, getDeletableItems, isDeleting } = useCustomItemDelete({
 *   streamType: "linkedStream",
 *   id: linkedStreamId,
 *   onSuccess: () => setSelectedItems(new Set()),
 * });
 *
 * // Single delete - pass sourceStreamId for items from member streams
 * deleteSingle({ itemId: item.id, sourceStreamId: item.streamId });
 *
 * // Bulk delete - include sourceStreamId for proper routing
 * const customItems = getDeletableItems(feedItems, selectedItems);
 * bulkDelete(customItems.map(item => ({
 *   itemId: item.id,
 *   sourceStreamId: item.streamId
 * })));
 * ```
 */
export function useCustomItemDelete(
  options: UseCustomItemDeleteOptions
): UseCustomItemDeleteReturn {
  const { streamType, id, onSuccess } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateQueries = (affectedStreamIds?: Set<string>) => {
    if (!id) return;

    if (streamType === "stream") {
      // Reset all feed queries for this stream to force fresh data
      queryClient.resetQueries({
        queryKey: ["streams", id, "feed"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.feedCustomCheck(id),
      });
    } else {
      // Reset all feed queries for this linked stream to force fresh data
      queryClient.resetQueries({
        queryKey: ["linked-stream", id, "feed"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.linkedStreams.feedCustomCheck(id),
      });

      // Also invalidate any affected member stream feeds
      if (affectedStreamIds) {
        for (const streamId of affectedStreamIds) {
          queryClient.resetQueries({
            queryKey: ["streams", streamId, "feed"],
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.streams.feedCustomCheck(streamId),
          });
        }
      }
    }
  };

  const singleDeleteMutation = useMutation({
    mutationFn: async (info: DeleteItemInfo) => {
      if (!id) throw new Error("Stream ID is required");

      if (streamType === "stream") {
        return api.delete(`/streams/${id}/content-items/${info.itemId}`);
      } else {
        // For linked streams, check if item is from a member stream
        if (info.sourceStreamId) {
          // Item is from a member stream - delete via the stream endpoint
          return api.delete(`/streams/${info.sourceStreamId}/content-items/${info.itemId}`);
        }
        // Item is a linked stream's own custom item
        return api.delete(`/linked-streams/custom-items/${info.itemId}`);
      }
    },
    onSuccess: (_result, info) => {
      toast({
        title: "Item deleted",
        description: "The custom item has been deleted.",
      });
      const affectedStreams = info.sourceStreamId ? new Set([info.sourceStreamId]) : undefined;
      invalidateQueries(affectedStreams);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (items: DeleteItemInfo[]) => {
      if (!id) throw new Error("Stream ID is required");

      if (streamType === "stream") {
        const body = JSON.stringify({ itemIds: items.map(i => i.itemId) });
        return api.delete<BulkDeleteResponse>(
          `/streams/${id}/content-items/bulk`,
          { body }
        );
      } else {
        // For linked streams, group items by source
        const linkedStreamItems = items.filter(i => !i.sourceStreamId);
        const memberStreamItems = items.filter(i => i.sourceStreamId);

        // Group member stream items by their source stream
        const byStream = new Map<string, string[]>();
        for (const item of memberStreamItems) {
          const streamId = item.sourceStreamId!;
          const existing = byStream.get(streamId) || [];
          existing.push(item.itemId);
          byStream.set(streamId, existing);
        }

        const results: BulkDeleteResponse[] = [];

        // Delete linked stream's own custom items
        if (linkedStreamItems.length > 0) {
          const body = JSON.stringify({ itemIds: linkedStreamItems.map(i => i.itemId) });
          const result = await api.delete<BulkDeleteResponse>(
            `/linked-streams/${id}/custom-items/bulk`,
            { body }
          );
          results.push(result);
        }

        // Delete member stream items via their respective stream endpoints
        for (const [streamId, itemIds] of byStream) {
          const body = JSON.stringify({ itemIds });
          const result = await api.delete<BulkDeleteResponse>(
            `/streams/${streamId}/content-items/bulk`,
            { body }
          );
          results.push(result);
        }

        // Combine results
        return {
          deleted: results.reduce((sum, r) => sum + (r?.deleted ?? 0), 0),
          skipped: results.reduce((sum, r) => sum + (r?.skipped ?? 0), 0),
        };
      }
    },
    onSuccess: (result, items) => {
      const count = result?.deleted ?? items.length;
      toast({
        title: "Items deleted",
        description: `${count} custom item${count === 1 ? "" : "s"} deleted.`,
      });
      // Collect all affected member streams
      const affectedStreams = new Set(
        items.filter(i => i.sourceStreamId).map(i => i.sourceStreamId!)
      );
      invalidateQueries(affectedStreams.size > 0 ? affectedStreams : undefined);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete items",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const getDeletableItems = <T extends ContentItem | LinkedStreamFeedItem>(
    items: T[],
    selectedIds: Set<string>
  ): T[] => {
    return items.filter((item) => selectedIds.has(item.id) && item.isCustomItem);
  };

  return {
    deleteSingle: (info: DeleteItemInfo) => singleDeleteMutation.mutate(info),
    bulkDelete: (items: DeleteItemInfo[]) => bulkDeleteMutation.mutate(items),
    getDeletableItems,
    isDeletingSingle: singleDeleteMutation.isPending,
    isDeletingBulk: bulkDeleteMutation.isPending,
    isDeleting: singleDeleteMutation.isPending || bulkDeleteMutation.isPending,
  };
}
