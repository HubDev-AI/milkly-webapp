import { useState, useEffect, memo } from "react";
import { cn } from "@/lib/Utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { CategoryPill } from "@/components/CategoryPill";
import { ExternalLink, Clock, Pencil, PenLine, Layers } from "lucide-react";
import type { ContentItem, LinkedStreamFeedItem } from "../../../milkly-backend/src/types";
import { formatDistanceToNow } from "date-fns";
import { CustomItemSheet } from "./CustomItemSheet";

interface ContentCardProps {
  item: ContentItem | LinkedStreamFeedItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  linkedStreamId?: string;
  streamId?: string;
  onItemUpdated?: (item: LinkedStreamFeedItem | ContentItem) => void;
  onItemDeleted?: () => void;
}

export const ContentCard = memo(function ContentCard({ item, isSelected, onToggleSelect, linkedStreamId, streamId, onItemUpdated, onItemDeleted }: ContentCardProps) {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image error when image URL changes
  useEffect(() => {
    setImageError(false);
  }, [item.imageUrl]);

  const isEdited = item.isEdited ?? false;
  const publishedTime = item.publishedAt
    ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
    : null;

  const hasValidUrl = item.url && (item.url.startsWith("http://") || item.url.startsWith("https://"));
  const showImage = item.imageUrl && !imageError;
  // Allow editing if linkedStreamId or streamId is provided
  const canEdit = linkedStreamId || streamId;

  // Check if this is a custom item from a member stream (shown in linked stream feed)
  // LinkedStreamFeedItem has streamName field when item comes from a member stream
  const linkedStreamFeedItem = item as LinkedStreamFeedItem;
  const isCustomFromMemberStream = linkedStreamId &&
    linkedStreamFeedItem.isCustomItem &&
    linkedStreamFeedItem.streamName &&
    !linkedStreamFeedItem.isLinkedStreamCustomItem;

  return (
    <Card
      className={cn(
        "cream-card overflow-hidden transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <CardContent className="p-0 relative">
        {/* Checkbox - fixed position top right */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="h-5 w-5"
          />
        </div>

        <div className="flex h-[120px] md:h-[152px]">
          {/* Image */}
          {showImage ? (
            <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 m-3 md:m-4 rounded-lg overflow-hidden border border-border">
              <img
                src={item.imageUrl!}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            </div>
          ) : null}

          {/* Content */}
          <div className="flex-1 p-3 md:p-4 pr-10 md:pr-12 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CategoryPill category={item.category} size="sm" />
                {isEdited && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0"
                  >
                    <PenLine className="h-2.5 w-2.5 mr-0.5" />
                    Edited
                  </Badge>
                )}
                {isCustomFromMemberStream && (
                  <Badge
                    variant="outline"
                    className="bg-purple-500/15 text-purple-300 border-purple-500/40 text-[9px] px-1 py-0 font-normal"
                  >
                    <Layers className="h-2 w-2 mr-0.5" />
                    {linkedStreamFeedItem.streamName}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {item.source}
                </span>
              </div>

              <h3 className="font-medium text-sm md:text-base leading-snug line-clamp-2">
                {item.title}
              </h3>

              {item.description ? (
                <p className="text-xs text-muted-foreground truncate hidden md:block mt-1">
                  {item.description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {publishedTime ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {publishedTime}
                </span>
              ) : null}

              <a
                href={item.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-1 text-xs hover:underline",
                  hasValidUrl ? "text-primary" : "text-muted-foreground pointer-events-none"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasValidUrl) e.preventDefault();
                }}
              >
                <ExternalLink className="h-3 w-3" />
                View
              </a>

              {canEdit && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {canEdit && (
        <CustomItemSheet
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          linkedStreamId={linkedStreamId}
          streamId={streamId}
          editItem={item}
          onItemUpdated={onItemUpdated}
          onItemDeleted={onItemDeleted}
        />
      )}
    </Card>
  );
});
