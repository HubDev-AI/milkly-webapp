import { memo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { MoreVertical, Star, Trash2, Copy, ExternalLink, StarOff, Crop, Check } from "lucide-react";
import { cn } from "@/lib/Utils";
import { GlassCard } from "@/components/ui/GlassCard";
import type { MediaFileWithUrl } from "../../../../milkly-backend/src/types";

interface MediaGridProps {
  files: MediaFileWithUrl[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSetAsLogo: (id: string) => void;
  onEdit?: (file: MediaFileWithUrl) => void;
}

export const MediaGrid = memo(function MediaGrid({
  files,
  selectedIds,
  onSelect,
  onDelete,
  onSetAsLogo,
  onEdit,
}: MediaGridProps) {
  const canEdit = useCallback((file: MediaFileWithUrl) => {
    return !file.mimeType.includes("svg") && !file.mimeType.includes("gif");
  }, []);

  const copyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file) => (
        <GlassCard
          key={file.id}
          className={cn(
            "group relative aspect-square overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/20 hover:border-primary/30 liquid-glass-shine",
            selectedIds.has(file.id) && "ring-2 ring-primary border-primary/50 shadow-primary/20"
          )}
          onClick={() => onSelect(file.id)}
        >
          <img
            src={file.url}
            alt={file.filename}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Selection overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-primary/20 backdrop-blur-[1px] transition-opacity duration-300 z-10",
              selectedIds.has(file.id) ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          />

          {/* Selection Checkmark */}
          <div className="absolute top-3 left-3 z-20">
             <div 
                className={cn(
                    "w-6 h-6 rounded-full border border-white/30 backdrop-blur-md flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm hover:scale-110",
                    selectedIds.has(file.id) 
                        ? "bg-primary text-white border-primary" 
                        : "bg-black/20 text-transparent hover:bg-black/40"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(file.id);
                }}
             >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
             </div>
          </div>

          {/* Logo badge */}
          {file.isLogo && (
            <div className="absolute top-2 right-10">
              <div className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Logo
              </div>
            </div>
          )}

          {/* Actions menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-black/20 hover:bg-primary/20 backdrop-blur-md border border-white/10 hover:border-primary/30 text-white hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && canEdit(file) && (
                  <DropdownMenuItem onClick={() => onEdit(file)}>
                    <Crop className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => copyToClipboard(file.url)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(file.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                {file.isLogo ? (
                  <DropdownMenuItem onClick={() => onSetAsLogo(file.id)}>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove as logo
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onSetAsLogo(file.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    Set as logo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete(file.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filename */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
            <p className="text-xs text-white font-medium truncate tracking-wide">{file.filename}</p>
          </div>
          
          {/* Bottom Active Line Animation */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-700 ease-in-out z-30" />
        </GlassCard>
      ))}
    </div>
  );
});
