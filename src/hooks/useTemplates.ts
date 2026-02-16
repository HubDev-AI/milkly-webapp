import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import { useLimitError } from "@/hooks/useLimitError";
import { z } from "zod";
import type {
  Template,
  LinkedStreamTemplate,
  CreateTemplateInput,
  TemplateCustomization,
} from "../../../milkly-backend/src/types";
import { TemplateSchema, LinkedStreamTemplateSchema } from "../../../milkly-backend/src/types";

export type StreamType = "stream" | "linkedStream";

// Common template interface that both Template and LinkedStreamTemplate share
interface BaseTemplate {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseTemplatesOptions {
  streamType: StreamType;
  id: string | undefined;
  enabled?: boolean;
}

export interface UseTemplatesReturn {
  templates: (Template | LinkedStreamTemplate)[] | undefined;
  isLoading: boolean;
  error: Error | null;
  hasActiveTemplate: boolean;
  hasAnyTemplate: boolean;
  activeTemplate: Template | LinkedStreamTemplate | undefined;
  generateTemplate: (customization?: TemplateCustomization) => void;
  generateTemplateAsync: (customization?: TemplateCustomization) => Promise<Template | LinkedStreamTemplate>;
  isGenerating: boolean;
  generateError: Error | null;
  limitError: ReturnType<typeof useLimitError>["limitError"];
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
}

/**
 * Shared hook for managing templates for streams or linked streams.
 * Provides templates query and generate template mutation.
 *
 * @example
 * ```tsx
 * const {
 *   templates,
 *   hasActiveTemplate,
 *   hasAnyTemplate,
 *   generateTemplate,
 *   isGenerating,
 * } = useTemplates({
 *   streamType: "stream",
 *   id: streamId,
 * });
 *
 * // Check if template exists before creating newsletter
 * if (!hasAnyTemplate) {
 *   generateTemplate();
 * }
 * ```
 */
export function useTemplates(options: UseTemplatesOptions): UseTemplatesReturn {
  const { streamType, id, enabled = true } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
  } = useLimitError();

  const queryKey =
    streamType === "stream"
      ? queryKeys.streams.templates(id!)
      : queryKeys.linkedStreams.templates(id!);

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery<(Template | LinkedStreamTemplate)[]>({
    queryKey,
    queryFn: async () => {
      if (!id) throw new Error("ID is required");

      if (streamType === "stream") {
        const response = await api.get<unknown>(`/streams/${id}/templates`);
        return z.array(TemplateSchema).parse(response);
      } else {
        const response = await api.get<unknown>(`/linked-streams/${id}/templates`);
        return z.array(LinkedStreamTemplateSchema).parse(response);
      }
    },
    enabled: enabled && !!id,
  });

  const generateMutation = useMutation({
    mutationFn: async (customization?: TemplateCustomization) => {
      if (!id) throw new Error("ID is required");

      const payload: CreateTemplateInput = {
        generateWithAI: true,
        customization,
      };

      if (streamType === "stream") {
        return api.post<Template>(`/streams/${id}/templates`, payload);
      } else {
        return api.post<LinkedStreamTemplate>(`/linked-streams/${id}/templates`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Template generated!",
        description: "Your AI-powered template is ready.",
      });
    },
    onError: (error) => {
      const isLimit = handleLimitError(error);
      if (!isLimit) {
        toast({
          title: "Failed to generate template",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  const hasActiveTemplate = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return false;
    return templates.some((t: BaseTemplate) => t.isActive);
  }, [templates]);

  const hasAnyTemplate = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return false;
    return templates.length > 0;
  }, [templates]);

  const activeTemplate = useMemo(() => {
    if (!templates || !Array.isArray(templates)) return undefined;
    return templates.find((t: BaseTemplate) => t.isActive);
  }, [templates]);

  return {
    templates,
    isLoading,
    error: error as Error | null,
    hasActiveTemplate,
    hasAnyTemplate,
    activeTemplate,
    generateTemplate: (customization?: TemplateCustomization) =>
      generateMutation.mutate(customization),
    generateTemplateAsync: (customization?: TemplateCustomization) =>
      generateMutation.mutateAsync(customization),
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error as Error | null,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
  };
}

