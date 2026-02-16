import { memo, useCallback } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { MoreVertical, Star, Trash2, Copy, ExternalLink, StarOff, Crop } from "lucide-react";
import { cn } from "@/lib/Utils";
import type { MediaFileWithUrl } from "../../../../milkly-backend/src/types";

interface MediaListProps {
  files: MediaFileWithUrl[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSetAsLogo: (id: string) => void;
  onEdit?: (file: MediaFileWithUrl) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export const MediaList = memo(function MediaList({
  files,
  selectedIds,
  onSelect,
  onDelete,
  onSetAsLogo,
  onEdit,
}: MediaListProps) {
  const copyToClipboard = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
  }, []);

  const canEdit = useCallback((file: MediaFileWithUrl) => {
    return !file.mimeType.includes("svg") && !file.mimeType.includes("gif");
  }, []);

  return (
    <div className="border rounded-lg divide-y">
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors",
            selectedIds.has(file.id) && "bg-primary/5"
          )}
        >
          <Checkbox
            checked={selectedIds.has(file.id)}
            onCheckedChange={() => onSelect(file.id)}
          />

          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={file.url}
              alt={file.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{file.filename}</p>
              {file.isLogo && (
                <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Logo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.sizeBytes)} • {formatDate(file.createdAt)}
              {file.width && file.height && ` • ${file.width}×${file.height}`}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      ))}
    </div>
  );
});
