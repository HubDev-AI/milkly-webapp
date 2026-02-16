import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import type { Template, UpdateTemplateInput } from "../../../milkly-backend/src/types";

export interface UseTemplateReturn {
  template: Template | undefined;
  isLoading: boolean;
  error: Error | null;
  updateTemplate: (input: UpdateTemplateInput) => void;
  updateTemplateAsync: (input: UpdateTemplateInput) => Promise<Template>;
  isUpdating: boolean;
}

/**
 * Hook for fetching and updating a single template by ID.
 *
 * @example
 * ```tsx
 * const { template, isLoading, updateTemplate } = useTemplate(templateId);
 *
 * if (isLoading) return <div>Loading...</div>;
 *
 * const handleUpdate = async () => {
 *   await updateTemplateAsync({ name: "New Name" });
 * };
 * ```
 */
export function useTemplate(templateId: string | undefined): UseTemplateReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: queryKeys.templates.detail(templateId!),
    queryFn: () => api.get<Template>(`/templates/${templateId}`),
    enabled: !!templateId,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTemplateInput) =>
      api.put<Template>(`/templates/${templateId}`, input),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      queryClient.setQueryData(queryKeys.templates.detail(templateId!), template);
      toast({ description: "Template updated" });
    },
    onError: (error) => {
      toast({ description: getErrorMessage(error), variant: "destructive" });
    },
  });

  return {
    template: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    updateTemplate: updateMutation.mutate,
    updateTemplateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
