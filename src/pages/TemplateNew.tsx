import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/AlertDialog";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Layout,
  X,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/Api";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import { queryKeys } from "@/lib/QueryKeys";
import { MilkLoadingOverlay } from "@/components/MilkLoading";
import { UserMenu } from "@/components/UserMenu";
import { MilklyLogo } from "@/components/MilklyLogo";
import { TemplateCreationWizard } from "@/components/template/TemplateCreationWizard";
import { DEFAULT_CUSTOMIZATION } from "@/lib/SharedTemplateConstants";
import type { Template, TemplateCustomization } from "../../../milkly-backend/src/types";

export default function TemplateNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const returnUrl = searchParams.get("returnUrl");
  const assignTo = searchParams.get("assignTo") as "stream" | "linkedStream" | null;
  const streamId = searchParams.get("streamId");

  const [name, setName] = useState("");
  const [generateWithAI, setGenerateWithAI] = useState(true);
  const [customization, setCustomization] = useState<TemplateCustomization>(DEFAULT_CUSTOMIZATION);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const hasUnsavedChanges = useMemo(() => {
    if (name !== "") return true;
    if (generateWithAI !== true) return true;
    if (JSON.stringify(customization) !== JSON.stringify(DEFAULT_CUSTOMIZATION)) return true;
    return false;
  }, [name, generateWithAI, customization]);

  const handleCancelClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      navigate(returnUrl || "/templates");
    }
  }, [hasUnsavedChanges, navigate, returnUrl]);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const template = await api.post<Template>("/templates", {
        name: name || undefined,
        generateWithAI,
        customization: generateWithAI ? customization : undefined,
      });

      if (assignTo && streamId) {
        await api.post(`/templates/${template.id}/apply`, {
          streamType: assignTo,
          streamId,
          setActive: true,
        });
      }

      return template;
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
      navigate(returnUrl || "/templates");
    },
    onError: (error) => {
      toast({
        title: "Failed to create template",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    createMutation.mutate();
  };

  const isCreating = createMutation.isPending;

  return (
    <div className="min-h-screen cream-gradient flex flex-col overflow-hidden pt-6">
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={handleCancelClick}
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 min-h-0 p-8 pt-10">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-10">
          
          {/* Floating Controls Bar (Internal Wireframe Item) */}
          <div className="flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-3xl border border-primary/10 rounded-2xl shadow-xl z-20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group">
                  <Layout className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <h2 className="text-xl font-serif italic font-bold text-foreground leading-tight">Create Blueprint</h2>
                  {hasUnsavedChanges ? (
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      Pending Changes
                    </span>
                  ) : (
                    <span className="text-[10px] text-primary/60 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-primary/40" />
                      Configuration Phase
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleCancelClick}
                className="rounded-lg px-4 h-9 text-sm border border-primary/20 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"
              >
                <X className="h-4 w-4 mr-1.5" />
                Discard
              </Button>
              <Button
                onClick={() => handleSubmit()}
                disabled={isCreating}
                className="h-9 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md transition-all active:scale-95"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                {generateWithAI ? "Generate" : "Build"}
              </Button>
            </div>
          </div>

          <TemplateCreationWizard
            name={name}
            setName={setName}
            generateWithAI={generateWithAI}
            setGenerateWithAI={setGenerateWithAI}
            customization={customization}
            setCustomization={setCustomization}
          />

        </div>
      </main>

      <MilkLoadingOverlay
        isVisible={isCreating}
        message={
          generateWithAI
            ? "Crafting your blueprint concept..."
            : "Initializing manual framework..."
        }
      />

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
                    You have pending changes that will be lost. How would you like to proceed?
                  </AlertDialogDescription>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDiscardDialog(false);
                    navigate(returnUrl || "/templates");
                  }}
                  className="h-12 border border-red-500/20 text-red-600 hover:text-red-700 hover:bg-red-500/10 hover:border-red-500/40 font-bold rounded-xl"
                >
                  Discard Changes
                </Button>
                <AlertDialogCancel asChild>
                  <Button
                    variant="ghost"
                    className="h-12 border border-primary/20 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/30 font-bold rounded-xl"
                  >
                    Keep Editing
                  </Button>
                </AlertDialogCancel>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          </GlassCard>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
