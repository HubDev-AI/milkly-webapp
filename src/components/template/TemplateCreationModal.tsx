import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Sparkles, Loader2, ChevronLeft } from "lucide-react";
import { api } from "@/lib/Api";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import { queryKeys } from "@/lib/QueryKeys";
import { MilkLoadingOverlay } from "@/components/MilkLoading";
import { MilklyLogo } from "@/components/MilklyLogo";
import { TemplateCreationWizard } from "@/components/template/TemplateCreationWizard";
import { DEFAULT_CUSTOMIZATION } from "@/lib/SharedTemplateConstants";
import type { Template, TemplateCustomization } from "../../../../milkly-backend/src/types";

interface TemplateCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignTo?: "stream" | "linkedStream";
  streamId?: string;
  onSuccess?: (template: Template) => void;
}

export function TemplateCreationModal({
  open,
  onOpenChange,
  assignTo,
  streamId,
  onSuccess,
}: TemplateCreationModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [generateWithAI, setGenerateWithAI] = useState(true);
  const [customization, setCustomization] = useState<TemplateCustomization>(DEFAULT_CUSTOMIZATION);

  const resetForm = () => {
    setName("");
    setGenerateWithAI(true);
    setCustomization(DEFAULT_CUSTOMIZATION);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (assignTo && streamId) {
        const endpoint = assignTo === "linkedStream"
          ? `/linked-streams/${streamId}/templates`
          : `/streams/${streamId}/templates`;
        return api.post<Template>(endpoint, {
          name: name || undefined,
          generateWithAI,
          customization: generateWithAI ? customization : undefined,
          setActive: true,
        });
      }

      return api.post<Template>("/templates", {
        name: name || undefined,
        generateWithAI,
        customization: generateWithAI ? customization : undefined,
      });
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (assignTo === "stream" && streamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(streamId) });
      } else if (assignTo === "linkedStream" && streamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.templates(streamId) });
      }
      toast({
        title: "Template created",
        description: generateWithAI
          ? `"${template.name}" has been generated with AI.`
          : `"${template.name}" has been created.`,
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.(template);
    },
    onError: (error) => {
      toast({
        title: "Failed to create template",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !createMutation.isPending) {
      resetForm();
    }
    if (!createMutation.isPending) {
      onOpenChange(newOpen);
    }
  };

  const isCreating = createMutation.isPending;

  return (
    <>
      <MilkLoadingOverlay
        isVisible={isCreating}
        message={generateWithAI ? "Crafting your perfect template..." : "Initializing structure..."}
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 border-none bg-cream-gradient overflow-hidden shadow-2xl rounded-[2.5rem]" hideCloseButton>
          <DialogTitle className="sr-only">New Blueprint</DialogTitle>
          <DialogDescription className="sr-only">Create a new template blueprint</DialogDescription>
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-primary/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl z-20">
            <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => handleOpenChange(false)}
                 className="rounded-full hover:bg-primary/5 h-10 w-10"
               >
                  <ChevronLeft className="h-5 w-5 text-primary/60" />
               </Button>

               <div className="h-8 w-px bg-primary/10 rotate-12 mx-2" />

               <div className="flex items-center gap-3">
                 <MilklyLogo size="sm" />
                 <div className="flex flex-col">
                   <h2 className="font-serif text-xl font-bold tracking-tight text-foreground/90 leading-tight">New Blueprint</h2>
                   <span className="text-[9px] font-sans tracking-[0.2em] text-primary/40 font-black uppercase">Editorial Fusion</span>
                 </div>
               </div>
            </div>

             {/* Actions */}
            <div className="flex items-center gap-3">
               <Button
                 onClick={() => createMutation.mutate()}
                 disabled={isCreating}
                 className="h-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 gap-2 text-[10px] font-black uppercase tracking-widest"
               >
                 {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                 {generateWithAI ? "Generate Architecture" : "Blank Slate"}
               </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-8">
            <TemplateCreationWizard
              name={name}
              setName={setName}
              generateWithAI={generateWithAI}
              setGenerateWithAI={setGenerateWithAI}
              customization={customization}
              setCustomization={setCustomization}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

