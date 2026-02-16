import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import {
  Loader2,
  RotateCw,
  Save,
  Ratio,
  Pencil,
  ZoomIn,
  X
} from "lucide-react";
import { useEditMedia, useUpdateMedia } from "@/hooks";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import type { MediaFileWithUrl } from "../../../../milkly-backend/src/types";

type AspectRatioOption = "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

const ASPECT_RATIOS: Record<AspectRatioOption, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

interface ImageEditorProps {
  file: MediaFileWithUrl;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (file: MediaFileWithUrl) => void;
}

export function ImageEditor({ file, open, onOpenChange, onSaved }: ImageEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [aspectRatioOption, setAspectRatioOption] = useState<AspectRatioOption | null>(null);
  const [filename, setFilename] = useState(file.filename);

  const { toast } = useToast();
  const editMutation = useEditMedia();
  const updateMutation = useUpdateMedia();

  const aspect = aspectRatioOption ? ASPECT_RATIOS[aspectRatioOption] : undefined;

  // Sync filename when file changes
  useEffect(() => {
    setFilename(file.filename);
  }, [file.filename]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle rotation button click (90 degree increments)
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = async () => {
    // Allow save if there's rotation OR if there's a crop (when aspect ratio is selected)
    if (!croppedAreaPixels && rotation === 0) return;

    try {
      const result = await editMutation.mutateAsync({
        id: file.id,
        operations: {
          // Only apply crop if aspect ratio is selected AND we have crop pixels
          ...(croppedAreaPixels && aspectRatioOption ? {
            crop: {
              x: Math.round(croppedAreaPixels.x),
              y: Math.round(croppedAreaPixels.y),
              width: Math.round(croppedAreaPixels.width),
              height: Math.round(croppedAreaPixels.height),
            },
          } : {}),
          rotate: rotation > 0 ? rotation : undefined,
          saveAsNew,
        },
      });

      // Update filename if changed
      const trimmedFilename = filename.trim();
      if (!saveAsNew && trimmedFilename && trimmedFilename !== file.filename) {
        await updateMutation.mutateAsync({
          id: result.id,
          data: { filename: trimmedFilename },
        });
      }

      toast({
        title: saveAsNew ? "Copy saved" : "Image saved",
        description: saveAsNew
          ? "A new copy has been created with your edits"
          : "Your changes have been saved",
      });

      onSaved?.(result);
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setSaveAsNew(false);
    setAspectRatioOption(null);
    setFilename(file.filename);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-white/10 bg-background/60 backdrop-blur-2xl shadow-none min-h-[600px]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <DialogHeader className="px-8 pt-8 pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] font-mono opacity-70">Editorial</span>
                <span className="text-muted-foreground/30">/</span>
                <DialogTitle className="font-serif text-2xl font-medium tracking-tight">Image Studio</DialogTitle>
              </div>
              <DialogDescription className="text-sm italic text-muted-foreground/70">
                Precision orchestration of your visual assets.
              </DialogDescription>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleOpenChange(false)}
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 relative z-[200]"
            >
                <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative z-10 px-8 pb-8 gap-8">
          {/* Canvas Area */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 bg-slate-950/40 rounded-3xl overflow-hidden border border-white/5 relative group">
            <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none z-20" />
            <Cropper
              image={file.url}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: {
                  backgroundColor: "transparent",
                },
                cropAreaStyle: {
                  boxShadow: aspectRatioOption ? "0 0 0 9999em rgba(0, 0, 0, 0.7)" : "none",
                  border: aspectRatioOption ? "2px solid rgba(var(--primary), 0.5)" : "none",
                }
              }}
              showGrid={!!aspectRatioOption}
            />
          </div>

          {/* Control Panel */}
          <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto pl-5 pr-5 py-4 custom-scrollbar relative z-20">
            <div className="space-y-6">
              {/* Aspect Ratio Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ratio className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Composition</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={aspectRatioOption || ""}
                  onValueChange={(value) => {
                    // Empty string means user clicked the active button to deselect
                    if (!value || value === "") {
                      setAspectRatioOption(null);
                    } else {
                      setAspectRatioOption(value as AspectRatioOption);
                    }
                  }}
                  className="grid grid-cols-3 gap-2"
                >
                  {Object.keys(ASPECT_RATIOS).map((ratio) => (
                    <ToggleGroupItem 
                      key={ratio} 
                      value={ratio}
                      disabled={ratio === "free"}
                      className="text-[10px] h-9 border-white/5 bg-white/5 hover:bg-primary/10 data-[state=on]:bg-primary data-[state=on]:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 rounded-lg font-mono uppercase tracking-tighter"
                    >
                      {ratio}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Zoom Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Zoom</span>
                  </div>
                  <span className="text-xs font-mono text-primary font-bold">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.01}
                  onValueChange={([value]) => setZoom(value)}
                  className="py-2 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative]:bg-primary/20"
                />
              </div>

              {/* Rotation Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Orientation</span>
                </div>
                <Button
                  type="button"
                  variant="glass"
                  onClick={handleRotate}
                  className="w-full justify-between group rounded-xl border-white/10 h-10 px-4"
                >
                  <span className="text-xs font-medium">Rotate 90°</span>
                  <div className="flex items-center gap-2">
                    {rotation > 0 && (
                      <span className="text-[10px] font-mono opacity-50">{rotation}°</span>
                    )}
                    <RotateCw className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-500" />
                  </div>
                </Button>
              </div>

              {/* Meta Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                    <Label htmlFor="filename" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                        <Pencil className="h-3 w-3" />
                        Filename
                    </Label>
                    <div className="relative group">
                        <Input
                            id="filename"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="Enter filename"
                            disabled={saveAsNew}
                            className="bg-white/5 border-white/10 focus:border-primary/50 transition-all duration-300 rounded-xl pl-3 pr-8 h-10 text-sm italic font-serif"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                            <Pencil className="h-3 w-3 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 group transition-all duration-300">
                  <div className="space-y-0.5">
                    <Label htmlFor="save-as-new" className="text-xs font-medium cursor-pointer">Save as new</Label>
                    <p className="text-[10px] text-muted-foreground leading-tight max-w-[120px]">Keep original version as backup</p>
                  </div>
                  <Switch
                    id="save-as-new"
                    checked={saveAsNew}
                    onCheckedChange={setSaveAsNew}
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/5 relative z-20">
              <Button
                onClick={handleSave}
                disabled={editMutation.isPending || updateMutation.isPending || (!croppedAreaPixels && rotation === 0)}
                variant="glass-premium"
                className="w-full h-12 text-sm gap-3 group relative overflow-hidden"
              >
                {(editMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="tracking-widest uppercase text-[10px] font-bold">Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="tracking-widest uppercase text-[10px] font-bold">
                        {saveAsNew ? "Preserve as Copy" : "Commit Changes"}
                    </span>
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                    onOpenChange(false);
                    resetState();
                }} 
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                disabled={editMutation.isPending || updateMutation.isPending}
              >
                Discard Edits
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
