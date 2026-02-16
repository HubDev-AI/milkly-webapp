import { useMemo, useState, useCallback, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Checkbox } from "@/components/ui/Checkbox";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { NewsletterPreview, EmptyNewsletterPreview } from "@/components/newsletter/NewsletterPreview";
import { NewsletterBlockEditor } from "@/components/newsletter/NewsletterBlockEditor";
import { TemplateCreationModal } from "@/components/template/TemplateCreationModal";
import { MilkLoading, MilkLoadingOverlay } from "@/components/MilkLoading";
import { NewsletterItemCard } from "@/components/newsletter/NewsletterItemCard";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Eye,
  Save,
  Wand2,
  FileText,
  Settings2,
  ExternalLink,
  AlertTriangle,
  Trash2,
  Users,
  Pencil,
  Plus,
  Link2,
} from "lucide-react";
import { CATEGORY_CONFIG, getPublicNewsletterUrl } from "@/lib/Constants";
import { useAuth } from "@/lib/AuthClient";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CreditsIndicator } from "@/components/CreditsIndicator";
import { cn } from "@/lib/Utils";
import type { NewsletterEditorReturn } from "@/hooks/useNewsletterEditor";

type StreamType = "stream" | "linkedStream";

interface NewsletterEditorUIProps {
  editor: NewsletterEditorReturn;
  streamType: StreamType;
  parentId: string;
  newsletterId: string;
  templateSettingsSlot: ReactNode;
  addCustomItemSlot: ReactNode;
}

export function NewsletterEditorUI({
  editor,
  streamType,
  parentId,
  newsletterId,
  templateSettingsSlot,
  addCustomItemSlot,
}: NewsletterEditorUIProps) {
  const {
    title,
    setTitle,
    content,
    setContent,
    items,
    activeTab,
    setActiveTab,
    autoSave,
    setAutoSave,
    showDeleteDialog,
    setShowDeleteDialog,
    showPublishConfirmDialog,
    setShowPublishConfirmDialog,
    isNewNewsletter,
    isPublished,
    isDirty,
    isSubmitting,
    isGenerating,
    isLoading,
    hasTemplates,
    hasActiveTemplate,
    maxNewsletterItems,
    hasExceededItemsLimit,
    hasExceededGenerationLimit,
    allItemIds,
    parentData,
    templates,
    showRecoveryDialog,
    showTemplatePrompt,
    showLeaveDialog,
    pendingRecoveryData,
    dismissModal,
    updateItemNote,
    removeItem,
    handleDragEnd,
    handleSave,
    handlePublish,
    handleRecoverPreviousWork,
    handleDiscard,
    handleBackClick,
    confirmLeave,
    cancelLeave,
    saveAndLeave,
    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    generateTemplateMutation,
    generateNotesMutation,
    generatePreviewMutation,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    showPromptWithError,
    sensors,
    usage,
    limits,
  } = editor;

  const { user } = useAuth();
  const [showTemplateCreationModal, setShowTemplateCreationModal] = useState(false);

  const publicUrl = user ? getPublicNewsletterUrl(user.id, newsletterId) : null;

  const handleCopyLink = useCallback(() => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
  }, [publicUrl]);

  const handleCreateTemplateClick = useCallback(() => {
    dismissModal();
    setShowTemplateCreationModal(true);
  }, [dismissModal]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const subscribersPath = streamType === "stream"
    ? `/streams/${parentId}/newsletter/${newsletterId}/subscribers`
    : `/linked-streams/${parentId}/newsletter/${newsletterId}/subscribers`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cream-gradient text-foreground">
      <AlertDialog open={showLeaveDialog} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              {isNewNewsletter
                ? "You have unsaved changes. Do you want to leave without saving?"
                : "You have unsaved changes to this draft."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col gap-2">
            {!isNewNewsletter ? (
              <AlertDialogAction onClick={saveAndLeave} className="w-full">
                Save & leave
              </AlertDialogAction>
            ) : null}
            <AlertDialogAction
              onClick={cancelLeave}
              className={cn(
                "w-full",
                !isNewNewsletter && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Continue editing
            </AlertDialogAction>
            <AlertDialogCancel onClick={confirmLeave} className="w-full mt-0">
              Discard changes
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete edition?"
        description="This will permanently delete this newsletter edition. This cannot be undone."
        onConfirm={() => {
          deleteMutation.mutate();
          setShowDeleteDialog(false);
        }}
      />

      <AlertDialog open={showPublishConfirmDialog} onOpenChange={setShowPublishConfirmDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Publish Newsletter?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your newsletter will be published and visible to your audience. You can send it to subscribers later from the published newsletters page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                handlePublish();
                setShowPublishConfirmDialog(false);
              }}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              Publish
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRecoveryDialog} onOpenChange={(open) => !open && dismissModal()}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved work found</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes
              {pendingRecoveryData?.title ? ` from "${pendingRecoveryData.title}"` : " from a previous session"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col gap-2">
            <AlertDialogAction onClick={handleDiscard} className="w-full">
              Create new edition
            </AlertDialogAction>
            <AlertDialogCancel onClick={handleRecoverPreviousWork} className="w-full mt-0">
              Continue previous work
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTemplatePrompt} onOpenChange={(open) => !open && dismissModal()}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Create a Template?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              An AI-powered template helps you generate beautiful newsletters automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleCreateTemplateClick}
              className="w-full gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Create Template
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">
              Maybe Later
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateCreationModal
        open={showTemplateCreationModal}
        onOpenChange={setShowTemplateCreationModal}
        assignTo={streamType}
        streamId={parentId}
      />

      <MilkLoadingOverlay
        isVisible={isGenerating}
        message={
          generateTemplateMutation.isPending
            ? "Crafting your template with AI..."
            : generateNotesMutation.isPending
              ? "Generating curator notes..."
              : "Regenerating newsletter content..."
        }
      />

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={dismissUpgradePrompt}
        limitError={limitError}
      />

      <header className="sticky top-0 z-40 border-b border-border/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/40">
        <div className="flex items-center justify-between px-6 h-16 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-8 w-[1px] bg-border/20 mx-2" />
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight leading-none text-foreground/90">
                {isPublished ? "Published Edition" : isNewNewsletter ? "New Edition" : "Edit Edition"}
              </h1>
              {isPublished && (
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Read-only Mode</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPublished && publicUrl && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                  onClick={handleCopyLink}
                  title="Copy public link"
                >
                  <Link2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                  onClick={() => window.open(publicUrl, "_blank")}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </>
            )}
            {parentData && !isPublished ? templateSettingsSlot : null}
          </div>
        </div>

        <div className="px-6 pb-4 max-w-5xl mx-auto w-full">
          {isPublished ? (
             <div className="w-full h-12 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm">
              <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Preview Mode</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "editor" | "preview")} className="w-full">
              <TabsList className="w-full h-14 bg-black/5 dark:bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                <TabsTrigger 
                  value="edit" 
                  className="flex-1 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="font-medium">Details & Content</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="editor" 
                  className="flex-1 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300" 
                  disabled={!content}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  <span className="font-medium">Visual Editor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex-1 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all duration-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="font-medium">Live Preview</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto pb-32">
        {activeTab === "preview" || isPublished ? (
          content ? (
            <div className="bg-white dark:bg-black rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/20">
              <NewsletterPreview htmlContent={content} title={title} />
            </div>
          ) : (
            <EmptyNewsletterPreview />
          )
        ) : activeTab === "editor" ? (
          content ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-xl border border-border/20 min-h-[600px]">
              <NewsletterBlockEditor
                initialHtml={content}
                onHtmlChange={(html) => setContent(html)}
                readOnly={isPublished}
                className="min-h-[600px]"
              />
            </div>
          ) : (
            <div className="text-center py-24 px-6 rounded-3xl border-2 border-dashed border-border/40 bg-white/30 dark:bg-black/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Pencil className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-2">Editor Empty</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Generate a preview first to activate the visual editor and refine your newsletter.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Metadata & AI */}
            <div className="lg:col-span-5 space-y-8">
              {/* Title Section */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-xs font-mono uppercase tracking-wider text-muted-foreground ml-1">
                  Edition Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The Weekly Pulse #42"
                  disabled={isSubmitting}
                  className="h-16 text-3xl md:text-3xl font-serif px-4 border border-border/20 bg-white/50 dark:bg-black/20 placeholder:text-muted-foreground/30 focus-visible:ring-0 rounded-xl focus:border-primary transition-all"
                />
              </div>

              {/* Template Section */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground ml-1">Template Style</Label>
                  {!hasTemplates ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateTemplateMutation.mutate()}
                      disabled={isGenerating}
                      className="text-xs gap-1.5 h-7 text-primary hover:text-primary/80 hover:bg-primary/5"
                    >
                      <Sparkles className="h-3 w-3" />
                      Create Auto-Template
                    </Button>
                  ) : null}
                </div>

                {hasActiveTemplate ? (
                  <div className="space-y-3">
                    {templates.filter((t) => t.isActive).map((template) => (
                      <div
                        key={template.id}
                        className="group relative text-left p-3 rounded-xl bg-gradient-to-br from-primary to-orange-600 text-white shadow-lg shadow-primary/25 ring-2 ring-primary/20 w-full"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{template.name}</span>
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider mt-1 block text-white/80">
                          Active Template
                        </span>
                      </div>
                    ))}
                  </div>
                ) : hasTemplates ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>Please activate a template in settings to ensure proper formatting.</p>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-border/40 bg-white/20 dark:bg-black/10">
                    <Wand2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No templates found.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => generateTemplateMutation.mutate()}>
                      Generate with AI
                    </Button>
                  </div>
                )}
              </div>

               {/* AI Action Card */}
              {!isPublished && items.length > 0 && hasActiveTemplate && (
                <div className="rounded-3xl p-1 bg-gradient-to-br from-white/80 to-white/40 dark:from-zinc-900/80 dark:to-zinc-900/40 border border-white/20 dark:border-white/5 shadow-2xl shadow-black/5 backdrop-blur-xl">
                  <div className="rounded-[20px] p-5 bg-white/50 dark:bg-black/20">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-medium">Magic Studio</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">AI Powered</span>
                            {hasExceededGenerationLimit && usage && limits && (
                              <span className="text-[10px] font-bold text-amber-500">Limit Reached</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <CreditsIndicator type="aiCredits" compact />
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          if (hasExceededGenerationLimit && usage && limits) {
                            showPromptWithError({ code: "LIMIT_EXCEEDED", message: "Weekly limit reached.", limit: "generatesPerWeek", current: usage.generateCount, max: limits.generatesPerWeek, upgradeUrl: "/pricing" });
                          } else {
                            generateNotesMutation.mutate();
                          }
                        }}
                        disabled={isGenerating || items.length === 0}
                        className="w-full justify-start h-12 rounded-xl bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-zinc-700 text-foreground border border-border/50 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                         {generateNotesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-3 text-indigo-500" /> : <Pencil className="h-4 w-4 mr-3 text-indigo-500" />}
                         <div className="text-left">
                           <div className="font-medium text-sm">Auto-Write Notes</div>
                           <div className="text-[10px] text-muted-foreground">Summarize items with AI</div>
                         </div>
                      </Button>

                      <Button
                         onClick={() => {
                          if (hasExceededItemsLimit && limits) {
                            showPromptWithError({ code: "LIMIT_EXCEEDED", message: "Too many items.", limit: "maxNewsletterItems", current: items.length, max: maxNewsletterItems, upgradeUrl: "/pricing" });
                          } else if (hasExceededGenerationLimit && usage && limits) {
                             showPromptWithError({ code: "LIMIT_EXCEEDED", message: "Weekly limit reached.", limit: "generatesPerWeek", current: usage.generateCount, max: limits.generatesPerWeek, upgradeUrl: "/pricing" });
                          } else {
                            generatePreviewMutation.mutate();
                          }
                        }}
                        disabled={isGenerating || items.length === 0}
                        className="w-full justify-start h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                         {generatePreviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Wand2 className="h-4 w-4 mr-3" />}
                         <div className="text-left">
                           <div className="font-medium text-sm">{content ? "Regenerate Edition" : "Generate Edition"}</div>
                           <div className="text-[10px] opacity-80">Assemble layout & content</div>
                         </div>
                      </Button>
                    </div>

                     {isGenerating && (
                      <div className="mt-4 pt-4 border-t border-border/10">
                        <MilkLoading
                          message={generateNotesMutation.isPending ? "Analyzing content..." : "Assembling newsletter..."}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: User Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold font-serif shadow-inner">
                     {items.length}
                   </span>
                   <h2 className="font-serif text-xl font-medium">Selected Items</h2>
                   {hasExceededItemsLimit && (
                    <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                      Limit Exceeded ({maxNewsletterItems})
                    </span>
                   )}
                 </div>
                 {!isPublished && (!hasExceededItemsLimit || maxNewsletterItems === -1) ? addCustomItemSlot : null}
              </div>

               {items.length === 0 ? (
                <div className="text-center py-20 px-8 rounded-3xl border-2 border-dashed border-border/30 bg-white/40 dark:bg-black/20 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 group">
                    <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-1">Your canvas is empty</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                    Add custom items or go back to the feed to select content for this edition.
                  </p>
                  <Button variant="outline" onClick={handleBackClick}>
                    Return to Feed
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={allItemIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 pb-20">
                      {sortedItems.map((item) => {
                        const category = item.contentItem?.category ?? "news";
                        const config = CATEGORY_CONFIG[category];
                        return (
                          <NewsletterItemCard
                            key={item.contentItemId}
                            id={item.contentItemId}
                            contentItem={item.contentItem}
                            note={item.note}
                            isAiNote={item.isAiNote}
                            onNoteChange={(note) => updateItemNote(item.contentItemId, note)}
                            onRemove={() => removeItem(item.contentItemId)}
                            disabled={isSubmitting}
                            categoryBadge={
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-opacity-10", config.textColor.replace('text-', 'bg-'))}>
                                {config.label}
                              </span>
                            }
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomActionBar className="liquid-glass-blur border-t border-white/10 dark:border-white/5">
        {isPublished ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = subscribersPath;
              }}
              className="flex-1 h-12 rounded-xl border-border/50 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-900 hover:text-foreground transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Subscribers
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              disabled={!publicUrl}
              className="flex-1 h-12 rounded-xl border-border/50 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-900 hover:text-foreground transition-all"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              onClick={() => publicUrl && window.open(publicUrl, "_blank")}
              disabled={!publicUrl}
              className="flex-1 h-12 rounded-xl border-border/50 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-900 hover:text-foreground transition-all"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Tab
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
              className="h-12 w-12 rounded-xl p-0"
            >
               {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mr-4 pl-2">
              <Checkbox
                id="autosave"
                checked={autoSave}
                onCheckedChange={(checked) => setAutoSave(checked === true)}
                className="h-5 w-5 rounded-md border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <Label htmlFor="autosave" className="text-xs font-medium text-muted-foreground cursor-pointer uppercase tracking-wider">
                Auto-save
              </Label>
            </div>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSubmitting || (!isDirty && !isNewNewsletter)}
              className="flex-1 h-12 rounded-xl border-border/50 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-zinc-900 hover:text-foreground transition-all"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={() => setShowPublishConfirmDialog(true)}
              disabled={isSubmitting || !hasActiveTemplate || !content}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold tracking-wide"
              title={!hasActiveTemplate ? "Activate a template first" : !content ? "Generate a preview first" : undefined}
            >
              {publishMutation.isPending || (createMutation.isPending && isNewNewsletter) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish Edition
            </Button>
          </>
        )}
      </BottomActionBar>
    </div>
  );
}
