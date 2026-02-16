import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import { useLimitError } from "@/hooks/useLimitError";
import type { Template, CreateGlobalTemplateInput } from "../../../milkly-backend/src/types";

export interface UseCreateGlobalTemplateReturn {
  createTemplate: (input: CreateGlobalTemplateInput) => void;
  createTemplateAsync: (input: CreateGlobalTemplateInput) => Promise<Template>;
  isCreating: boolean;
  error: Error | null;
  limitError: ReturnType<typeof useLimitError>["limitError"];
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
}

/**
 * Hook for creating global templates with AI generation
 * Handles loading state for long-running AI generation (10-20 seconds)
 *
 * @example
 * ```tsx
 * const {
 *   createTemplate,
 *   isCreating,
 *   showUpgradePrompt,
 *   dismissUpgradePrompt,
 * } = useCreateGlobalTemplate();
 *
 * // Create with customization
 * createTemplate({
 *   generateWithAI: true,
 *   customization: {
 *     brandName: "Tech Weekly",
 *     tone: "casual",
 *   },
 * });
 * ```
 */
export function useCreateGlobalTemplate(): UseCreateGlobalTemplateReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
  } = useLimitError();

  const mutation = useMutation({
    mutationFn: async (input: CreateGlobalTemplateInput) => {
      return api.post<Template>("/templates", input);
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: "Template created",
        description: `"${template.name || "Global template"}" has been created.`,
      });
    },
    onError: (error) => {
      const isLimit = handleLimitError(error);
      if (!isLimit) {
        toast({
          title: "Failed to create template",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    },
  });

  return {
    createTemplate: mutation.mutate,
    createTemplateAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error as Error | null,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
  };
}
