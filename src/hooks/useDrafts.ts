import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { useToast } from "@/hooks/useToast";
import { z } from "zod";
import type { Newsletter, LinkedNewsletter } from "../../../milkly-backend/src/types";
import { NewsletterSchema, LinkedNewsletterSchema } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

// Extended types with item count
export interface NewsletterWithCount extends Newsletter {
  _count: { items: number };
}

export interface LinkedNewsletterWithCount extends LinkedNewsletter {
  _count: { items: number };
}

// Zod schemas for extended types
const NewsletterWithCountSchema = NewsletterSchema.extend({
  _count: z.object({ items: z.number() }),
});

const LinkedNewsletterWithCountSchema = LinkedNewsletterSchema.extend({
  _count: z.object({ items: z.number() }),
});

export interface UseDraftsOptions {
  streamType: StreamType;
  id: string | undefined;
  enabled?: boolean;
}

export interface UseDraftsReturn {
  drafts: (NewsletterWithCount | LinkedNewsletterWithCount)[];
  isLoading: boolean;
  error: Error | null;
  hasDrafts: boolean;
  deleteDraft: (draftId: string) => void;
  isDeleting: boolean;
  deletingDraftId: string | null;
}

/**
 * Shared hook for managing newsletter drafts for streams or linked streams.
 * Provides drafts query and delete draft mutation.
 *
 * @example
 * ```tsx
 * const {
 *   drafts,
 *   hasDrafts,
 *   deleteDraft,
 *   isDeleting,
 *   deletingDraftId,
 * } = useDrafts({
 *   streamType: "stream",
 *   id: streamId,
 * });
 *
 * // Render drafts list
 * {drafts.map((draft) => (
 *   <DraftItem
 *     key={draft.id}
 *     draft={draft}
 *     onDelete={() => deleteDraft(draft.id)}
 *     isDeleting={deletingDraftId === draft.id}
 *   />
 * ))}
 * ```
 */
export function useDrafts(options: UseDraftsOptions): UseDraftsReturn {
  const { streamType, id, enabled = true } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey =
    streamType === "stream"
      ? ["streams", id, "newsletters", "drafts"]
      : ["linked-stream", id, "newsletters", "drafts"];

  const {
    data: draftsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!id) throw new Error("ID is required");

      if (streamType === "stream") {
        const response = await api.paginated<unknown>(
          `/streams/${id}/newsletters?status=draft`
        );
        // Validate the paginated response structure
        const validated = z
          .object({
            data: z.array(NewsletterWithCountSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          })
          .parse(response);
        return validated;
      } else {
        const response = await api.paginated<unknown>(
          `/linked-streams/${id}/newsletters?status=draft`
        );
        // Validate the paginated response structure
        const validated = z
          .object({
            data: z.array(LinkedNewsletterWithCountSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          })
          .parse(response);
        return validated;
      }
    },
    enabled: enabled && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (draftId: string) => {
      if (streamType === "stream") {
        return api.delete(`/newsletters/${draftId}`);
      } else {
        return api.delete(`/linked-newsletters/${draftId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Draft deleted",
        description: "Your draft has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const drafts = draftsResponse?.data ?? [];
  const hasDrafts = drafts.length > 0;

  return {
    drafts,
    isLoading,
    error: error as Error | null,
    hasDrafts,
    deleteDraft: (draftId: string) => deleteMutation.mutate(draftId),
    isDeleting: deleteMutation.isPending,
    deletingDraftId: deleteMutation.isPending ? (deleteMutation.variables as string) : null,
  };
}

export const draftsQueryKeys = {
  stream: (id: string) => ["streams", id, "newsletters", "drafts"] as const,
  linkedStream: (id: string) => ["linked-stream", id, "newsletters", "drafts"] as const,
};
