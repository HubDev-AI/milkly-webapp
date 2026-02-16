import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Image as ImageIcon, Link, FolderOpen, X } from "lucide-react";
import { MediaPicker } from "@/components/media/MediaPicker";
import { useStorageStatus } from "@/hooks";
import { cn } from "@/lib/Utils";
import { api } from "@/lib/Api";
import type { MediaFileWithUrl } from "../../../milkly-backend/src/types";

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function ImageInput({
  value,
  onChange,
  label = "Image",
  placeholder = "https://example.com/image.jpg",
  disabled = false,
  showPreview = true,
  className,
}: ImageInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"url" | "library">("url");
  // Track preview URL separately for media references (the signed URL for display)
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { data: storageStatus } = useStorageStatus();
  const isStorageConfigured = storageStatus?.configured ?? false;

  // Track the current media ID to detect when it changes
  const currentMediaId = value.startsWith("media://") ? value.slice(8) : null;

  // Resolve media:// URLs and switch to library mode when value is a media reference
  useEffect(() => {
    if (currentMediaId) {
      // Switch to library mode when value is a media reference
      if (isStorageConfigured) {
        setInputMode("library");
      }
      // Always fetch the preview URL for the current media ID
      setPreviewUrl(""); // Reset first to avoid showing old preview
      api.get<{ url: string }>(`/media/${currentMediaId}/url`)
        .then((response) => {
          if (response?.url) {
            setPreviewUrl(response.url);
          }
        })
        .catch(() => {
          // Silently fail - will show fallback UI
        });
    } else if (value) {
      // Regular URL - use URL mode
      setInputMode("url");
      setPreviewUrl("");
    } else {
      // No value - reset
      setPreviewUrl("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- value is captured via currentMediaId
  }, [currentMediaId, isStorageConfigured]);

  const handleMediaSelect = (file: MediaFileWithUrl) => {
    // Store media reference for persistence - backend will resolve to fresh URL when loading
    onChange(`media://${file.id}`);
    // Keep the current signed URL for preview only
    setPreviewUrl(file.url);
    setPickerOpen(false);
  };

  // Get the URL to display (either preview URL for media refs, or the value itself)
  const displayUrl = value.startsWith("media://") ? previewUrl : value;

  const handleClear = () => {
    onChange("");
    setPreviewUrl("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-[11px] font-bold tracking-widest text-primary/60 uppercase flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          {label}
        </Label>
      )}

      {isStorageConfigured && (
        <Tabs
          value={inputMode}
          onValueChange={(v) => setInputMode(v as "url" | "library")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-8 bg-primary/5 border border-primary/10 rounded-xl p-0.5">
            <TabsTrigger value="url" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/20 data-[state=active]:shadow-sm">
              <Link className="h-3 w-3" />
              URL
            </TabsTrigger>
            <TabsTrigger value="library" className="text-xs gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/20 data-[state=active]:shadow-sm">
              <FolderOpen className="h-3 w-3" />
              Library
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {inputMode === "url" || !isStorageConfigured ? (
        <Input
          type="url"
          value={value.startsWith("media://") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 focus:border-primary/40 transition-all font-sans text-sm shadow-sm px-4 text-foreground font-medium placeholder:text-muted-foreground/50"
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground bg-white/5 border-primary/30 h-11 rounded-xl hover:bg-primary/5 hover:border-primary/40 hover:text-foreground transition-all font-sans text-sm shadow-sm px-4"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
        >
          <FolderOpen className="h-4 w-4" />
          {currentMediaId ? "Change image..." : "Select from library..."}
        </Button>
      )}

      {showPreview && value && displayUrl && (
        <div className="relative group rounded-lg overflow-hidden border bg-muted/30 p-2 flex items-center justify-center">
          <img
            src={displayUrl}
            alt="Preview"
            className="max-w-full max-h-40 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {showPreview && value && value.startsWith("media://") && !displayUrl && (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Image from library selected</span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto p-1 rounded-full hover:bg-background/80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {isStorageConfigured && (
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleMediaSelect}
          title="Select Image"
        />
      )}
    </div>
  );
}
