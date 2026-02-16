import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { MilkLoadingOverlay } from "@/components/MilkLoading";
import { MilklyLogo } from "@/components/MilklyLogo";
import { VisualTemplateEditor, type VisualTemplateEditorRef } from "@/components/template/VisualTemplateEditor";
import type { Template } from "../../../../milkly-backend/src/types";

interface TemplateEditModalProps {
  templateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (template: Template) => void;
}

export function TemplateEditModal({
  templateId,
  open,
  onOpenChange,
  onSave,
}: TemplateEditModalProps) {
  const editorRef = useRef<VisualTemplateEditorRef>(null);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.templates.detail(templateId ?? ""),
    queryFn: () => api.get<Template>(`/templates/${templateId}`),
    enabled: !!templateId && open,
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBackClick = () => {
    editorRef.current?.requestClose();
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && editorRef.current) {
      editorRef.current.requestClose();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <>
      <MilkLoadingOverlay isVisible={isLoading} message="Accessing blueprint repository..." />
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 gap-0 border-none bg-cream-gradient overflow-hidden shadow-2xl rounded-[2.5rem]" hideCloseButton>
          <DialogTitle className="sr-only">{template?.name || "Edit Template"}</DialogTitle>
          <DialogDescription className="sr-only">Edit your template blueprint</DialogDescription>

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-primary/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl z-20">
            <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={handleBackClick}
                 className="rounded-full hover:bg-primary/5 h-10 w-10"
               >
                  <ChevronLeft className="h-5 w-5 text-primary/60" />
               </Button>

               <div className="h-8 w-px bg-primary/10 rotate-12 mx-2" />

               <div className="flex items-center gap-3">
                 <MilklyLogo size="sm" />
                 <div className="flex flex-col">
                   <h2 className="font-serif text-xl font-bold tracking-tight text-foreground/90 leading-tight">
                     {template?.name || "Refining Architecture"}
                   </h2>
                   <span className="text-[9px] font-sans tracking-[0.2em] text-primary/40 font-black uppercase">Blueprint Adjustment</span>
                 </div>
               </div>
            </div>
          </div>

          {error || !template ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="font-serif text-2xl font-bold mb-2">Repository Error</h2>
              <p className="text-sm text-primary/60 max-w-sm">
                The requested architecture could not be materialized. It may have been decommissioned.
              </p>
              <Button onClick={handleClose} variant="outline" className="mt-6 rounded-full px-8">
                Return to Nexus
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <VisualTemplateEditor
                ref={editorRef}
                template={template}
                onSave={(savedTemplate) => {
                  onSave?.(savedTemplate);
                }}
                onCancel={handleClose}
                onClose={handleClose}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
