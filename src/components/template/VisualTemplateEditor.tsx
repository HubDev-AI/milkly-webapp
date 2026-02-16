import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { useToast } from "@/hooks/useToast";
import { Loader2, Save, X, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEditorStore } from "@mklyml/editor/store/editor-store";
import { EmbeddedMklyEditor } from "./EmbeddedMklyEditor";
import type { Template } from "../../../milkly-backend/src/types";

interface VisualTemplateEditorProps {
  template: Template;
  onSave?: (template: Template) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface VisualTemplateEditorRef {
  requestClose: () => void;
}

export const VisualTemplateEditor = forwardRef<VisualTemplateEditorRef, VisualTemplateEditorProps>(
  function VisualTemplateEditor({ template, onSave, onCancel, onClose }, ref) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [savedBaseline, setSavedBaseline] = useState(template.mklySource);

  // Seed the editor store with the template source on mount
  useEffect(() => {
    const store = useEditorStore.getState();
    store.setSource(template.mklySource);
    store.setIsNormalized(false);
    store.setNormalizationWarnings([]);
  }, [template.id, template.mklySource]);

  // Track changes via editor store
  const currentSource = useEditorStore((s) => s.source);
  const hasUnsavedChanges = currentSource !== savedBaseline;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateMutation = useMutation({
    mutationFn: (data: { mklySource: string }) =>
      api.put<Template>(`/templates/${template.id}`, data),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["streams", template.streamId, "templates"] });
      setSavedBaseline(useEditorStore.getState().source);
      toast({
        title: "Template updated",
        description: `"${updatedTemplate.name}" has been saved.`,
      });
      onSave?.(updatedTemplate);
    },
    onError: (error) => {
      toast({
        title: "Failed to update template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  function handleSave() {
    updateMutation.mutate({ mklySource: useEditorStore.getState().source });
  }

  function handleDiscard() {
    setShowDiscardDialog(false);
    useEditorStore.getState().setSource(savedBaseline);
    onCancel?.();
    onClose?.();
  }

  function handleCancelClick() {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      onCancel?.();
      onClose?.();
    }
  }

  useImperativeHandle(ref, () => ({
    requestClose: handleCancelClick,
  }));

  function handleSaveAndExit() {
    updateMutation.mutate(
      { mklySource: useEditorStore.getState().source },
      {
        onSuccess: (savedTemplate) => {
          onSave?.(savedTemplate);
          onCancel?.();
          onClose?.();
        },
      }
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Slim header with save/discard */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">{template.name}</h2>
            {hasUnsavedChanges ? (
              <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1 uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                Unsaved
              </span>
            ) : (
              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-wider opacity-60">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelClick}
              className="h-7 px-3 text-xs border border-border/50 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending || !hasUnsavedChanges}
              className="h-7 px-4 bg-primary hover:bg-primary/90 text-white text-xs font-semibold"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Editor fills remaining space */}
        <div className="flex-1 min-h-0">
          <EmbeddedMklyEditor documentId={template.id} />
        </div>
      </div>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="max-w-md p-0 bg-transparent border-none overflow-visible shadow-none">
          <GlassCard className="p-0 border-primary/20 overflow-hidden shadow-2xl bg-background/80 backdrop-blur-3xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-10 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]">
                  <AlertTriangle className="h-7 w-7 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <AlertDialogTitle className="text-3xl font-serif italic text-foreground leading-tight">Unsaved Changes</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground text-sm font-sans max-w-xs mx-auto">
                    You have pending changes that haven't been saved.
                    How would you like to proceed?
                  </AlertDialogDescription>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSaveAndExit}
                  disabled={updateMutation.isPending}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save & Exit
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleDiscard}
                    disabled={updateMutation.isPending}
                    className="h-12 border border-red-500/20 text-red-600 hover:text-red-700 hover:bg-red-500/10 hover:border-red-500/40 font-bold rounded-xl"
                  >
                    Discard
                  </Button>
                  <AlertDialogCancel asChild disabled={updateMutation.isPending}>
                    <Button
                      variant="ghost"
                      className="h-12 border border-primary/20 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/30 font-bold rounded-xl"
                    >
                      Keep Editing
                    </Button>
                  </AlertDialogCancel>
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          </GlassCard>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
