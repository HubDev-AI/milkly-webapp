import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { FeedItemCard } from "@/components/feed/FeedItemCard";
import { queryKeys } from "@/lib/QueryKeys";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { useCustomItemDelete } from "@/hooks/useCustomItemDelete";
import { Plus, Loader2, Link as LinkIcon, User, Pencil, RotateCcw, Trash2, Tag } from "lucide-react";
import { ImageInput } from "@/components/ImageInput";
import type { ContentItem, LinkedStreamFeedItem, CreateContentItemInput, UpdateLinkedStreamCustomItemInput, Category } from "../../../milkly-backend/src/types";
import { CATEGORY_CONFIG } from "@/lib/Constants";

interface CustomItemSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  streamId?: string;
  linkedStreamId?: string;
  editItem?: ContentItem | LinkedStreamFeedItem;
  onItemCreated?: (item: ContentItem) => void;
  onItemUpdated?: (item: ContentItem | LinkedStreamFeedItem) => void;
  onItemDeleted?: () => void;
}

export function CustomItemSheet({
  isOpen,
  onOpenChange,
  streamId,
  linkedStreamId,
  editItem,
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
}: CustomItemSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!editItem;
  const isCustomItem = editItem?.isCustomItem ?? true;
  const isEdited = editItem && "isEdited" in editItem ? editItem.isEdited : false;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const streamType = linkedStreamId ? "linkedStream" : "stream";
  const activeId = linkedStreamId || streamId;

  const { deleteSingle, isDeletingSingle } = useCustomItemDelete({
    streamType,
    id: activeId,
    onSuccess: () => {
      onItemDeleted?.();
      handleClose();
    },
  });

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<Category>("custom");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [author, setAuthor] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setTitle(editItem.title);
        setUrl(editItem.url ?? "");
        setDescription(editItem.description ?? "");
        // Use rawImageUrl for editing (preserves media:// refs), fallback to imageUrl
        setImageUrl(editItem.rawImageUrl ?? editItem.imageUrl ?? "");
        setCategory(editItem.category as Category);
        setAuthor(editItem.author ?? "");
        setCustomCategoryName("");
      } else {
        resetForm();
      }
    }
  }, [isOpen, editItem]);

  // Resolve media:// URLs for preview display
  useEffect(() => {
    if (imageUrl.startsWith("media://")) {
      const mediaId = imageUrl.slice(8);
      setImagePreviewUrl(""); // Reset to avoid showing stale preview
      api.get<{ url: string }>(`/media/${mediaId}/url`)
        .then((response) => {
          if (response?.url) {
            setImagePreviewUrl(response.url);
          }
        })
        .catch(() => {
          // Silently fail - will show fallback or no image
          setImagePreviewUrl("");
        });
    } else if (imageUrl) {
      // Regular URL - use directly
      setImagePreviewUrl(imageUrl);
    } else {
      // No image
      setImagePreviewUrl("");
    }
  }, [imageUrl]);

  function resetForm() {
    setTitle("");
    setUrl("");
    setDescription("");
    setImageUrl("");
    setImagePreviewUrl("");
    setCategory("custom");
    setCustomCategoryName("");
    setAuthor("");
  }

  function handleClose() {
    onOpenChange(false);
    resetForm();
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateContentItemInput) => {
      if (linkedStreamId) {
        return api.post<ContentItem>(`/linked-streams/${linkedStreamId}/custom-items`, data);
      }
      return api.post<ContentItem>(`/streams/${streamId}/content-items`, data);
    },
    onSuccess: (item) => {
      toast({
        title: "Custom item created",
        description: "Your custom content item has been added.",
      });
      // Invalidate feed queries
      if (linkedStreamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feed(linkedStreamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feedCustomCheck(linkedStreamId) });
      } else if (streamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feed(streamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feedCustomCheck(streamId) });
      }
      onItemCreated?.(item);
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLinkedStreamCustomItemInput) => {
      // For linked stream items, check if it's a linked stream custom item or a stream item
      if (linkedStreamId && editItem) {
        const feedItem = editItem as LinkedStreamFeedItem;
        // If it has a streamId, it's from a stream - use the stream endpoint
        if (feedItem.streamId) {
          return api.put<ContentItem>(`/streams/${feedItem.streamId}/content-items/${editItem.id}`, data) as any;
        }
        // Otherwise it's a linked stream custom item
        return api.put<LinkedStreamFeedItem>(`/linked-streams/custom-items/${editItem.id}`, data) as any;
      } else if (streamId) {
        return api.put<ContentItem>(`/streams/${streamId}/content-items/${editItem!.id}`, data);
      }
      throw new Error("No linkedStreamId or streamId provided");
    },
    onSuccess: (updatedItem) => {
      toast({
        title: "Item updated",
        description: "Your content item has been updated.",
      });
      // Invalidate feed queries and custom check
      if (linkedStreamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feed(linkedStreamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feedCustomCheck(linkedStreamId) });
      } else if (streamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feed(streamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feedCustomCheck(streamId) });
      }
      onItemUpdated?.(updatedItem as any);
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update item",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const revertMutation = useMutation({
    mutationFn: () => {
      if (!editItem) {
        throw new Error("Cannot revert: editItem not provided");
      }
      // Get the streamId from the item itself or from props
      const itemStreamId = (editItem as LinkedStreamFeedItem).streamId || streamId;
      if (!itemStreamId) {
        throw new Error("Cannot revert: no streamId available");
      }
      return api.post<ContentItem>(`/streams/${itemStreamId}/content-items/${editItem.id}/revert`);
    },
    onSuccess: (revertedItem) => {
      toast({
        title: "Item reverted",
        description: "The item has been restored to its original state.",
      });
      // Invalidate feed queries and custom check
      if (linkedStreamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feed(linkedStreamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.feedCustomCheck(linkedStreamId) });
      } else if (streamId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feed(streamId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.feedCustomCheck(streamId) });
      }
      onItemUpdated?.(revertedItem);
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to revert item",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending || revertMutation.isPending || isDeletingSingle;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the content item.",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode) {
      const data: UpdateLinkedStreamCustomItemInput = {
        title: title.trim(),
        url: url.trim() || null,
        description: description.trim() || null,
        imageUrl: imageUrl.trim() || null,
        category,
        author: author.trim() || null,
      };
      updateMutation.mutate(data);
    } else {
      const data: CreateContentItemInput = {
        title: title.trim(),
        category,
      };

      if (url.trim()) data.url = url.trim();
      if (description.trim()) data.description = description.trim();
      if (imageUrl.trim()) data.imageUrl = imageUrl.trim();
      if (author.trim()) data.author = author.trim();
      if (category === "custom" && customCategoryName.trim()) {
        data.customCategoryName = customCategoryName.trim();
      }

      createMutation.mutate(data);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2.5rem] flex flex-col gap-0 border-t border-primary/10 shadow-2xl bg-cream-gradient p-0 overflow-hidden">
        
        {/* Header */}
        <SheetHeader className="text-left py-6 px-8 border-b border-primary/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                {isEditMode ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
             </div>
             <div>
               <SheetTitle className="font-serif text-2xl font-bold tracking-tight text-foreground/90">
                 {isEditMode ? (isCustomItem ? "Refine Custom Item" : "Edit Content") : "New Custom Item"}
               </SheetTitle>
               <SheetDescription className="text-xs font-sans tracking-wide text-primary/60 font-medium uppercase">
                 {isEditMode ? "Update metadata & details" : "Add external content to your flow"}
               </SheetDescription>
             </div>
          </div>
        </SheetHeader>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">
            
            {/* Left Column: Main Inputs */}
            <div className="space-y-8">
              {/* Primary Details Card */}
              <div className="space-y-3">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase pl-1">Primary Details</span>
                 <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-primary/5 rounded-[1.5rem] p-6 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., The Future of Digital Art"
                        disabled={isPending}
                        className="h-12 bg-white/30 dark:bg-black/30 border-primary/10 rounded-xl focus:bg-white/60 focus:border-primary/30 transition-all font-serif text-lg placeholder:font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1 flex items-center gap-2">
                        <LinkIcon className="h-3 w-3" /> URL Source
                      </Label>
                      <Input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        disabled={isPending || (isEditMode && !isCustomItem)}
                        className="h-10 bg-white/30 dark:bg-black/30 border-primary/10 rounded-lg focus:bg-white/60 font-mono text-xs opacity-80"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1">Editorial Summary</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a brief synopsis or your thoughts..."
                        disabled={isPending}
                        className="min-h-[120px] bg-white/30 dark:bg-black/30 border-primary/10 rounded-xl focus:bg-white/60 focus:border-primary/30 transition-all resize-none text-sm leading-relaxed"
                      />
                    </div>
                 </div>
              </div>

              {/* Metadata Card */}
              <div className="space-y-3">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase pl-1">Classification</span>
                 <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-primary/5 rounded-[1.5rem] p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1 flex items-center gap-2">
                          <Tag className="h-3 w-3" /> Category
                        </Label>
                        <Select
                          value={category}
                          onValueChange={(value) => setCategory(value as Category)}
                          disabled={isPending || (isEditMode && !isCustomItem)}
                        >
                          <SelectTrigger className="h-11 bg-white/30 border-primary/10 rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/90 backdrop-blur-xl border-primary/10 rounded-xl">
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <SelectItem key={key} value={key} className="py-3 cursor-pointer focus:bg-primary/5">
                                  <div className="flex items-center gap-3">
                                    <div className="p-1 rounded-md bg-primary/5 text-primary"><Icon className="h-3.5 w-3.5" /></div>
                                    <span className="font-bold text-sm tracking-tight">{config.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="author" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1 flex items-center gap-2">
                          <User className="h-3 w-3" /> Author
                        </Label>
                        <Input
                          id="author"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Author name"
                          disabled={isPending}
                          className="h-11 bg-white/30 dark:bg-black/30 border-primary/10 rounded-xl"
                        />
                      </div>
                    </div>

                    {!isEditMode && category === "custom" && (
                      <div className="mt-6 pt-6 border-t border-primary/5">
                        <div className="space-y-2">
                          <Label htmlFor="customCategoryName" className="text-xs font-bold uppercase tracking-wider text-primary/70 ml-1">Custom Section Name</Label>
                          <Input
                            id="customCategoryName"
                            value={customCategoryName}
                            onChange={(e) => setCustomCategoryName(e.target.value)}
                            placeholder="e.g., Podcasts, Resources"
                            disabled={isPending}
                            className="h-11 bg-white/30 dark:bg-black/30 border-primary/10 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Right Column: Visuals & Preview */}
            <div className="space-y-8">
               <div className="space-y-3">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase pl-1">Visual Asset</span>
                 <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md border border-primary/5 rounded-[1.5rem] p-6 shadow-sm">
                    <ImageInput
                       value={imageUrl}
                       onChange={setImageUrl}
                       label="Thumbnail URL"
                       disabled={isPending}
                       showPreview={false} // We show our own preview below
                    />
                 </div>
               </div>

               <div className="space-y-3">
                 <span className="text-[10px] font-bold tracking-[0.2em] text-primary/40 uppercase pl-1">Live Preview</span>
                 
                 {/* Card Preview */}
                 <div className="relative">
                     <FeedItemCard 
                       item={{
                         id: "preview-id",
                         title: title || "New Content Item",
                         url: url,
                         description: description || "Your editorial content description will appear here.",
                         imageUrl: imagePreviewUrl || undefined,
                         category: category,
                         author: author,
                         source: editItem?.source || "Custom",
                         publishedAt: editItem?.publishedAt || new Date().toISOString(),
                         isCustomItem: editItem ? editItem.isCustomItem : true,
                         isEdited: false,
                         streamId: streamId || "preview-stream-id",
                         createdAt: (editItem as any)?.createdAt || new Date(),
                         updatedAt: (editItem as any)?.updatedAt || new Date(),
                         metadata: null,
                         batchId: null,
                         fetchedAt: null,
                         originalUrl: null,
                         summary: null
                       } as unknown as ContentItem}
                      isSelected={false}
                      isPreview={true}
                      onToggleSelect={() => {}} 
                    />
                 </div>
               </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <SheetFooter className="p-6 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-t border-primary/5 z-20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             {isEditMode && isCustomItem && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
             )}
             {isEditMode && !isCustomItem && isEdited && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => revertMutation.mutate()}
                  className="text-blue-500/70 hover:text-blue-600 hover:bg-blue-500/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Revert
                </Button>
             )}
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
             <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-xl border-primary/10 hover:bg-primary/5 w-full sm:w-auto"
             >
                Cancel
             </Button>
             <Button
                onClick={handleSubmit}
                disabled={isPending || !title.trim()}
                className="rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 w-full sm:w-auto px-8"
             >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {isEditMode ? "Save Changes" : "Add to Feed"}
             </Button>
          </div>
        </SheetFooter>

        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete custom item?"
          description={
             linkedStreamId && editItem && "streamId" in editItem && editItem.streamId
              ? `This item belongs to the stream "${(editItem as LinkedStreamFeedItem).streamName}".`
              : "This will permanently remove this item."
          }
          onConfirm={() => {
             if (editItem) deleteSingle({ itemId: editItem.id });
             setShowDeleteConfirm(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
