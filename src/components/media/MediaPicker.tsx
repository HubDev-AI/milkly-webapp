import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, ImageIcon, Check } from "lucide-react";
import { UploadDropzone } from "./UploadDropzone";
import {
  useMediaList,
  useUploadMedia,
} from "@/hooks";
import { useToast } from "@/hooks/useToast";
import { cn, getErrorMessage } from "@/lib/Utils";
import type { MediaFileWithUrl } from "../../../../milkly-backend/src/types";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFileWithUrl) => void;
  title?: string;
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Select Image",
}: MediaPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { toast } = useToast();

  const { data: mediaResponse, isLoading } = useMediaList({
    page: 1,
    search: search.trim() || undefined,
    enabled: open,
  });

  const uploadMutation = useUploadMedia();

  const files = mediaResponse?.files ?? [];

  const handleUpload = async (file: File) => {
    try {
      const uploaded = await uploadMutation.mutateAsync(file);
      setSelectedId(uploaded.id);
      toast({ title: "File uploaded successfully" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSelect = () => {
    const selected = files.find((f) => f.id === selectedId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelectedId(null);
      setSearch("");
    }
  };

  const handleFileClick = (file: MediaFileWithUrl) => {
    if (selectedId === file.id) {
      onSelect(file);
      onOpenChange(false);
      setSelectedId(null);
      setSearch("");
    } else {
      setSelectedId(file.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <UploadDropzone
            onUpload={handleUpload}
            isUploading={uploadMutation.isPending}
            compact
          />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No images found" : "No images uploaded yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {files.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
                      selectedId === file.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent"
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedId === file.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!selectedId}>
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
