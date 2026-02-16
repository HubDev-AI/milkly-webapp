import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import type { StreamType } from "@/lib/Constants";
import type { Template, TemplateWithStream } from "../../../milkly-backend/src/types";

interface TemplateInfo {
  id: string;
  name: string;
  mklySource: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  streamId?: string;
  linkedStreamId?: string;
}

interface UseTemplateSettingsActionsProps {
  streamType: StreamType;
  streamId: string;
}

export interface UseTemplateSettingsActionsReturn {
  activateMutation: ReturnType<typeof useMutation<TemplateInfo, Error, TemplateInfo>>;
  deactivateMutation: ReturnType<typeof useMutation<TemplateInfo, Error, TemplateInfo>>;
  deleteMutation: ReturnType<typeof useMutation<void, Error, TemplateInfo>>;
  quickGenerateMutation: ReturnType<typeof useMutation<TemplateInfo, Error, void>>;
  applyGlobalMutation: ReturnType<typeof useMutation<TemplateWithStream, Error, TemplateWithStream>>;
  isLoading: boolean;
}

export function useTemplateSettingsActions({
  streamType,
  streamId,
}: UseTemplateSettingsActionsProps): UseTemplateSettingsActionsReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateTemplateQueries = (template?: TemplateInfo) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });

    if (streamType === "linkedStream") {
      queryClient.invalidateQueries({
        queryKey: queryKeys.linkedStreams.templates(streamId),
      });
      // If template was from a stream, also invalidate stream templates
      if (template?.streamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.streams.templates(template.streamId),
        });
      }
    } else {
      queryClient.invalidateQueries({
        queryKey: queryKeys.streams.templates(streamId),
      });
    }
  };

  const activateMutation = useMutation({
    mutationFn: (template: TemplateInfo) => {
      if (streamType === "linkedStream") {
        // For linked streams, use correct endpoint based on template ownership
        if (template.streamId) {
          return api.patch<TemplateInfo>(`/templates/${template.id}/activate`, {
            streamType: "stream",
          });
        }
        return api.patch<TemplateInfo>(
          `/linked-streams/templates/${template.id}/activate`
        );
      }
      // For regular streams
      return api.patch<TemplateInfo>(`/templates/${template.id}/activate`, {
        streamType: "stream",
      });
    },
    onSuccess: (result, template) => {
      invalidateTemplateQueries(template);
      toast({
        title: "Template activated",
        description: `"${result.name}" is now the active template.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to activate template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (template: TemplateInfo) => {
      if (streamType === "linkedStream" && !template.streamId) {
        // Linked stream's own template
        return api.patch<TemplateInfo>(
          `/linked-streams/templates/${template.id}/deactivate`
        );
      }
      // Stream template or regular stream
      return api.patch<TemplateInfo>(`/templates/${template.id}/deactivate`);
    },
    onSuccess: (result, template) => {
      invalidateTemplateQueries(template);
      toast({
        title: "Template deactivated",
        description: `"${result.name}" is no longer active.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to deactivate template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (template: TemplateInfo) => {
      if (streamType === "linkedStream" && !template.streamId) {
        // Linked stream's own template
        return api.delete<void>(`/linked-streams/templates/${template.id}`);
      }
      // Stream template
      return api.delete<void>(`/templates/${template.id}?streamType=stream`);
    },
    onSuccess: (_data, template) => {
      invalidateTemplateQueries(template);
      toast({
        title: "Template deleted",
        description: "The template has been removed.",
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

  const quickGenerateMutation = useMutation({
    mutationFn: () => {
      const endpoint =
        streamType === "linkedStream"
          ? `/linked-streams/${streamId}/templates`
          : `/streams/${streamId}/templates`;

      return api.post<TemplateInfo>(endpoint, {
        generateWithAI: true,
        setActive: true,
      });
    },
    onSuccess: (template) => {
      invalidateTemplateQueries();
      toast({
        title: "Template generated",
        description: `"${template.name}" is ready and active.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const applyGlobalMutation = useMutation({
    mutationFn: (globalTemplate: TemplateWithStream) => {
      if (streamType === "linkedStream") {
        return api.post<TemplateWithStream>(
          `/templates/${globalTemplate.id}/apply`,
          {
            streamType: "linkedStream",
            streamId,
            setActive: true,
          }
        );
      }
      // For regular streams, create a copy manually
      return (async () => {
        const newTemplate = await api.post<Template>(
          `/streams/${streamId}/templates`,
          {
            name: globalTemplate.name,
            generateWithAI: false,
            setActive: true,
          }
        );
        const updatedTemplate = await api.put<TemplateWithStream>(
          `/templates/${newTemplate.id}`,
          {
            mklySource: globalTemplate.mklySource,
          }
        );
        return updatedTemplate;
      })();
    },
    onSuccess: (template) => {
      invalidateTemplateQueries();
      toast({
        title: "Global template applied",
        description: `"${template.name}" has been applied and activated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const isLoading =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending ||
    quickGenerateMutation.isPending ||
    applyGlobalMutation.isPending;

  return {
    activateMutation,
    deactivateMutation,
    deleteMutation,
    quickGenerateMutation,
    applyGlobalMutation,
    isLoading,
  };
}
