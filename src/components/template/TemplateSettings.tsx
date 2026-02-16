import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TemplateCreationModal } from "@/components/template/TemplateCreationModal";
import { TemplateEditModal } from "@/components/template/TemplateEditModal";
import { TemplateCard } from "@/components/template/TemplateCard";
import { MilkLoadingOverlay } from "@/components/MilkLoading";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import {
  Sparkles,
  Loader2,
  Check,
  FileText,
  Plus,
  Globe,
  Settings2,
} from "lucide-react";
import type { Template, TemplateWithStream } from "../../../milkly-backend/src/types";

interface TemplateSettingsProps {
  streamId: string;
  streamName: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplateSettings({
  streamId,
  streamName,
  children,
  open,
  onOpenChange,
}: TemplateSettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Fetch templates for stream
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: queryKeys.streams.templates(streamId),
    queryFn: () => api.get<Template[]>(`/streams/${streamId}/templates`),
    enabled: isOpen,
  });

  // Fetch global templates
  const { data: globalTemplates, isLoading: isLoadingGlobalTemplates } = useQuery({
    queryKey: queryKeys.templates.list({ streamType: "global" }),
    queryFn: () => api.paginated<TemplateWithStream>("/templates?streamType=global"),
    enabled: isOpen,
  });

  // Activate template mutation
  const activateMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.patch<Template>(`/templates/${templateId}/activate`, { streamType: "stream" }),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(streamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: "Template activated",
        description: `"${template.name}" is now the active template.`,
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

  // Deactivate template mutation
  const deactivateMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.patch<Template>(`/templates/${templateId}/deactivate`),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(streamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: "Template deactivated",
        description: `"${template.name}" is no longer active.`,
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

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => api.delete(`/templates/${templateId}?streamType=stream`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(streamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
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

  // Quick generate template with AI
  const quickGenerateMutation = useMutation({
    mutationFn: () =>
      api.post<Template>(`/streams/${streamId}/templates`, {
        generateWithAI: true,
        setActive: true,
      }),
    onSuccess: (template) => {
      queryClient.refetchQueries({ queryKey: queryKeys.streams.templates(streamId) });
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

  // Apply global template mutation (creates a copy for this stream)
  const applyGlobalMutation = useMutation({
    mutationFn: async (globalTemplate: TemplateWithStream) => {
      // First create a basic template for this stream
      const newTemplate = await api.post<Template>(`/streams/${streamId}/templates`, {
        name: globalTemplate.name,
        generateWithAI: false,
        setActive: true,
      });

      // Then update it with the global template's mkly source
      const updatedTemplate = await api.put<Template>(`/templates/${newTemplate.id}`, {
        mklySource: globalTemplate.mklySource,
      });

      return updatedTemplate;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(streamId) });
      toast({
        title: "Template applied",
        description: `"${template.name}" has been copied and activated.`,
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

  const activeTemplate = templates?.find((t) => t.isActive);

  const handleCreateTemplate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  return (
    <>
      <MilkLoadingOverlay
        isVisible={quickGenerateMutation.isPending}
        message="Crafting your template with AI..."
      />
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-2 text-[10px] uppercase font-bold tracking-wider rounded-lg">
            <Settings2 className="h-3.5 w-3.5" />
            Templates
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2.5rem] flex flex-col gap-0 border-t border-primary/10 shadow-2xl bg-cream-gradient p-0 overflow-hidden">
        
        {/* Header */}
        <SheetHeader className="text-left py-6 px-8 border-b border-primary/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <FileText className="h-5 w-5 text-primary" />
             </div>
             <div>
               <SheetTitle className="font-serif text-2xl font-bold tracking-tight text-foreground/90">
                 Newsletter Templates
               </SheetTitle>
               <SheetDescription className="text-xs font-sans tracking-wide text-primary/60 font-medium uppercase">
                 Manage blueprints for <strong>{streamName}</strong>
               </SheetDescription>
             </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
           <div className="max-w-4xl mx-auto space-y-10">
              
              {/* Actions Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Smart Gen Card */}
                 {(!templates || templates.length === 0) && (
                   <div 
                     className="group relative overflow-hidden rounded-[2rem] p-6 cursor-pointer border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300"
                     onClick={() => !quickGenerateMutation.isPending && quickGenerateMutation.mutate()}
                   >
                     <div className="flex items-start justify-between">
                        <div className="space-y-2 relative z-10">
                           <h4 className="font-serif text-lg font-bold text-amber-800 dark:text-amber-200">Smart Generate</h4>
                           <p className="text-xs text-amber-700/70 dark:text-amber-300/70 leading-relaxed max-w-[200px]">
                              Let our AI architect the perfect structure for your content instantly.
                           </p>
                           <Button size="sm" className="mt-2 rounded-full bg-amber-500 hover:bg-amber-600 border-none text-white shadow-lg shadow-amber-500/20">
                              {quickGenerateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2"/> : <Sparkles className="h-3 w-3 mr-2 fill-white/20"/>}
                              Generate Now
                           </Button>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="h-6 w-6 text-amber-600" />
                        </div>
                     </div>
                   </div>
                 )}

                 {/* Custom Create Card */}
                 <div 
                   className="group relative overflow-hidden rounded-[2rem] p-6 cursor-pointer border border-primary/10 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-lg"
                   onClick={handleCreateTemplate}
                 >
                    <div className="flex items-start justify-between">
                       <div className="space-y-2">
                          <h4 className="font-serif text-lg font-bold text-foreground">Custom Blueprint</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                             Design your own template structure from a blank canvas.
                          </p>
                          <Button size="sm" variant="outline" className="mt-2 rounded-full border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:text-primary">
                             <Plus className="h-3 w-3 mr-2"/> Craft Manually
                          </Button>
                       </div>
                       <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                         <Plus className="h-6 w-6 text-primary" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Your Templates List */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 pl-2">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase">Your Blueprints</span>
                    <div className="h-px bg-primary/5 flex-1" />
                 </div>

                 {isLoadingTemplates ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[1, 2, 3].map((i) => (
                       <div key={i} className="h-40 rounded-[2rem] bg-black/5 animate-pulse" />
                     ))}
                   </div>
                 ) : templates && templates.length > 0 ? (
                   <div className="space-y-4">
                     {templates.map((template) => (
                       <TemplateCard
                         key={template.id}
                         template={template}
                         onActivate={() => activateMutation.mutate(template.id)}
                         onDeactivate={() => deactivateMutation.mutate(template.id)}
                         onDelete={() => deleteMutation.mutate(template.id)}
                         onEdit={() => setEditingTemplateId(template.id)}
                         isActivating={
                           activateMutation.isPending &&
                           activateMutation.variables === template.id
                         }
                         isDeactivating={
                           deactivateMutation.isPending &&
                           deactivateMutation.variables === template.id
                         }
                         isDeleting={
                           deleteMutation.isPending &&
                           deleteMutation.variables === template.id
                         }
                       />
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-10 opacity-50">
                     <p className="text-xs font-serif italic">No custom templates yet.</p>
                   </div>
                 )}
              </div>

              {/* Global Templates Section */}
              {isLoadingGlobalTemplates ? (
                <div className="space-y-4">
                   <div className="h-px bg-primary/5 w-full" />
                   <div className="h-32 rounded-[2rem] bg-black/5 animate-pulse" />
                </div>
              ) : globalTemplates?.data && globalTemplates.data.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pl-2 mt-8">
                     <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase">Global Library</span>
                     <div className="h-px bg-primary/5 flex-1" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {globalTemplates.data.map((template) => (
                      <Card key={template.id} className="group rounded-[1.5rem] bg-white/30 dark:bg-black/10 backdrop-blur-md border border-primary/5 hover:border-primary/20 transition-all duration-300">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-primary/10"
                            >
                              <Globe
                                className="h-5 w-5 text-primary"
                              />
                            </div>
                            <div>
                              <p className="font-serif font-bold text-foreground text-sm group-hover:text-primary transition-colors">{template.name}</p>
                              <Badge variant="secondary" className="bg-white/50 dark:bg-black/50 border-0 text-[10px] px-2 py-0.5 mt-1 backdrop-blur-sm">
                                System
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applyGlobalMutation.mutate(template)}
                            disabled={applyGlobalMutation.isPending}
                            className="rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all text-xs"
                          >
                            {applyGlobalMutation.isPending && applyGlobalMutation.variables?.id === template.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Import"
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
           </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-t border-primary/5 z-20 flex justify-center">
          {activeTemplate ? (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-full px-4">
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Active: {activeTemplate.name}</span>
            </div>
          ) : (
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
               No active template selected
            </div>
          )}
        </div>

        <TemplateCreationModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          assignTo="stream"
          streamId={streamId}
        />

        <TemplateEditModal
          templateId={editingTemplateId}
          open={!!editingTemplateId}
          onOpenChange={(open) => !open && setEditingTemplateId(null)}
        />
      </SheetContent>
    </Sheet>
    </>
  );
}

