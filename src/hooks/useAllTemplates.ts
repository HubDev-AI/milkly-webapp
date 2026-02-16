import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import { z } from "zod";
import type { TemplateWithStream, PaginationMeta } from "../../../milkly-backend/src/types";
import { TemplateWithStreamSchema, PaginationMetaSchema } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream" | "all" | "global";

export interface UseAllTemplatesOptions {
  page?: number;
  limit?: number;
  streamType?: StreamType;
  isActive?: boolean;
  search?: string;
  enabled?: boolean;
}

interface AllTemplatesResponse {
  data: TemplateWithStream[];
  pagination: PaginationMeta;
}

const AllTemplatesResponseSchema = z.object({
  data: z.array(TemplateWithStreamSchema),
  pagination: PaginationMetaSchema,
});

export interface UseAllTemplatesReturn {
  templates: TemplateWithStream[];
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  error: Error | null;
  deleteTemplate: (id: string, streamType: "stream" | "linkedStream") => Promise<void>;
  duplicateTemplate: (id: string, streamType: "stream" | "linkedStream") => Promise<void>;
  toggleActive: (id: string, streamType: "stream" | "linkedStream", isActive: boolean) => Promise<void>;
  refetch: () => void;
}

function buildQueryUrl(options: UseAllTemplatesOptions): string {
  const params = new URLSearchParams();

  if (options.page !== undefined && options.page > 1) {
    params.set("page", options.page.toString());
  }
  if (options.limit !== undefined) {
    params.set("limit", options.limit.toString());
  }
  if (options.streamType && options.streamType !== "all") {
    params.set("streamType", options.streamType);
  }
  if (options.isActive !== undefined) {
    params.set("isActive", options.isActive.toString());
  }
  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  const queryString = params.toString();
  return `/templates${queryString ? `?${queryString}` : ""}`;
}

/**
 * Hook for managing all templates across streams and linked streams.
 * Provides paginated templates list with filtering and mutations.
 *
 * @example
 * ```tsx
 * const {
 *   templates,
 *   pagination,
 *   isLoading,
 *   deleteTemplate,
 *   duplicateTemplate,
 *   toggleActive,
 *   refetch,
 * } = useAllTemplates({
 *   page: 1,
 *   limit: 20,
 *   streamType: "all",
 *   search: debouncedSearch,
 * });
 * ```
 */
export function useAllTemplates(options: UseAllTemplatesOptions = {}): UseAllTemplatesReturn {
  const {
    page = 1,
    limit = 20,
    streamType = "all",
    isActive,
    search,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = queryKeys.templates.list({
    page,
    limit,
    streamType,
    isActive,
    search,
  });

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<AllTemplatesResponse>({
    queryKey,
    queryFn: async () => {
      const url = buildQueryUrl({ page, limit, streamType, isActive, search });
      // Use paginated to get full response (data + pagination)
      const response = await api.paginated<TemplateWithStream>(url);
      // Validate the response
      return AllTemplatesResponseSchema.parse(response);
    },
    enabled,
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, streamType: st }: { id: string; streamType: "stream" | "linkedStream" }) => {
      if (st === "stream") {
        await api.delete(`/templates/${id}`);
      } else {
        await api.delete(`/linked-streams/templates/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Duplicate template mutation
  const duplicateMutation = useMutation({
    mutationFn: async ({ id, streamType: st }: { id: string; streamType: "stream" | "linkedStream" }) => {
      // Find the template to duplicate
      const template = data?.data.find((t) => t.id === id);
      if (!template) {
        throw new Error("Template not found");
      }

      // Create a copy with a new name
      const newName = `${template.name} (Copy)`;

      if (st === "stream") {
        await api.post(`/streams/${template.streamId}/templates`, {
          name: newName,
          generateWithAI: false,
        });
      } else {
        await api.post(`/linked-streams/${template.streamId}/templates`, {
          name: newName,
          generateWithAI: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: "Template duplicated",
        description: "A copy of the template has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to duplicate template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      id,
      streamType: st,
      isActive: active,
    }: {
      id: string;
      streamType: "stream" | "linkedStream";
      isActive: boolean;
    }) => {
      const action = active ? "activate" : "deactivate";

      if (st === "stream") {
        await api.patch(`/templates/${id}/${action}`, { streamType: "stream" });
      } else {
        await api.patch(`/linked-streams/templates/${id}/${action}`);
      }
    },
    onSuccess: (_, { isActive: active }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: active ? "Template activated" : "Template deactivated",
        description: active
          ? "This template is now the active template for its stream."
          : "This template is no longer active.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  return {
    templates: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error: error as Error | null,
    deleteTemplate: async (id: string, st: "stream" | "linkedStream") => {
      await deleteMutation.mutateAsync({ id, streamType: st });
    },
    duplicateTemplate: async (id: string, st: "stream" | "linkedStream") => {
      await duplicateMutation.mutateAsync({ id, streamType: st });
    },
    toggleActive: async (id: string, st: "stream" | "linkedStream", active: boolean) => {
      await toggleActiveMutation.mutateAsync({ id, streamType: st, isActive: active });
    },
    refetch,
  };
}
