import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/hooks/useToast";
import {
  Loader2,
  GripVertical,
  AlertCircle,
  Link2,
  Sparkles,
  Layers,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/Utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Stream } from "../../../milkly-backend/src/types";

interface CreateLinkedStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (createdId?: string) => void;
  /** For edit mode - pass existing linked stream data */
  editData?: {
    id: string;
    name: string;
    description: string | null;
    streamIds: string[];
  };
}

interface LinkedStreamFormData {
  name: string;
  description: string;
  streamIds: string[];
}

export function CreateLinkedStreamDialog({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: CreateLinkedStreamDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditMode = !!editData;

  // Form state
  const [formData, setFormData] = useState<LinkedStreamFormData>({
    name: "",
    description: "",
    streamIds: [],
  });

  // Dragging state for reordering
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Reset form when dialog opens or editData changes
  useEffect(() => {
    if (open) {
      if (editData) {
        setFormData({
          name: editData.name,
          description: editData.description ?? "",
          streamIds: editData.streamIds,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          streamIds: [],
        });
      }
    }
  }, [open, editData]);

  // Fetch user's streams
  const { data: streamsResponse, isLoading: isLoadingStreams } = useQuery({
    queryKey: queryKeys.streams.list({ page: 1, limit: 50 }),
    queryFn: () => api.paginated<Stream>("/streams?limit=50"),
    enabled: open,
  });

  const streams = streamsResponse?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; streamIds: string[] }) =>
      api.post<{ id: string }>("/linked-streams", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() });
      toast({
        title: "Linked stream created",
        description: "Your linked stream has been created successfully.",
      });
      onOpenChange(false);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast({
        title: "Failed to create linked stream",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; streamIds: string[] }) =>
      api.put(`/linked-streams/${editData?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() });
      if (editData?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.detail(editData.id) });
      }
      toast({
        title: "Linked stream updated",
        description: "Your linked stream has been updated successfully.",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to update linked stream",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleStreamToggle = (streamId: string) => {
    setFormData((prev) => {
      const isSelected = prev.streamIds.includes(streamId);
      return {
        ...prev,
        streamIds: isSelected
          ? prev.streamIds.filter((id) => id !== streamId)
          : [...prev.streamIds, streamId],
      };
    });
  };

  const handleDragStart = (streamId: string) => {
    setDraggedId(streamId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = formData.streamIds.indexOf(draggedId);
    const targetIndex = formData.streamIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...formData.streamIds];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    setFormData((prev) => ({
      ...prev,
      streamIds: newOrder,
    }));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a name for your linked stream.",
        variant: "destructive",
      });
      return;
    }

    if (formData.streamIds.length < 2) {
      toast({
        title: "Select at least 2 streams",
        description: "A linked stream requires at least 2 streams to combine.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      streamIds: formData.streamIds,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Linked Stream" : "Create Linked Stream"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update your linked stream settings."
                  : "Combine multiple streams into a single feed."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 px-6 py-4 overflow-y-auto">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              glass
              placeholder="e.g., Weekly Tech Roundup"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              glass
              placeholder="What is this linked stream for?"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isPending}
              rows={2}
            />
          </div>

          {/* Stream selection & Composition */}
          <div className="space-y-6">
            {/* Composition Section */}
            <AnimatePresence>
              {formData.streamIds.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="h-4 w-4 text-primary" />
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">
                      Composition Order
                    </Label>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm">
                    {formData.streamIds.map((streamId, index) => {
                      const stream = streams.find((t) => t.id === streamId);
                      if (!stream) return null;
                      return (
                        <motion.div
                          layout
                          key={stream.id}
                          draggable
                          onDragStart={() => handleDragStart(stream.id)}
                          onDragOver={(e) => handleDragOver(e, stream.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "group flex items-center gap-3 p-3 rounded-xl bg-background border border-primary/10 cursor-move transition-all duration-300 hover:border-primary/40 shadow-sm",
                            draggedId === stream.id && "opacity-30 scale-95"
                          )}
                        >
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-[10px] font-mono font-bold text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                            {index + 1}
                          </div>
                          <span className="flex-1 text-sm font-serif font-medium truncate">
                            {stream.name}
                          </span>
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
                        </motion.div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground text-center italic mt-2 opacity-60">
                      Drag cards to refine the newsletter flow
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selection Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">
                  Select Source Streams <span className="text-red-500">*</span>
                </Label>
              </div>

              {isLoadingStreams ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : streams.length === 0 ? (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/30">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground italic">No streams discovered. Architect some sources first.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {streams.map((stream) => {
                    const isSelected = formData.streamIds.includes(stream.id);
                    return (
                      <div
                        key={stream.id}
                        role="button"
                        aria-pressed={isSelected}
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStreamToggle(stream.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleStreamToggle(stream.id);
                          }
                        }}
                        className={cn(
                          "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border cursor-pointer relative overflow-hidden outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50",
                          isSelected 
                            ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                            : "bg-background/50 border-white/10 hover:border-primary/20 hover:bg-background"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Link2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-serif text-lg leading-none transition-colors",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {stream.name}
                          </p>
                          {stream.description && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate italic">
                              {stream.description}
                            </p>
                          )}
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary animate-in zoom-in-50 duration-300" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>

          <DialogFooter className="gap-2 px-6 pb-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || formData.streamIds.length < 2}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {isEditMode ? "Save Changes" : "Create Linked Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
