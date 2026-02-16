import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CATEGORY_CONFIG } from "@/lib/Constants";
import {
  GripVertical,
  Trash2,
  Sparkles,
  Video,
  ExternalLink,
} from "lucide-react";
import type { ContentItem, Category } from "../../../milkly-backend/src/types";
import { cn } from "@/lib/Utils";
import { useState, useEffect, useMemo, memo, type ReactNode } from "react";

interface NewsletterItemCardProps {
  id: string;
  contentItem: ContentItem | undefined;
  note: string;
  isAiNote?: boolean;
  onNoteChange: (note: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  categoryBadge?: ReactNode;
  disableDrag?: boolean;
}

export const NewsletterItemCard = memo(function NewsletterItemCard({
  id,
  contentItem,
  note,
  isAiNote,
  onNoteChange,
  onRemove,
  disabled,
  categoryBadge,
  disableDrag,
}: NewsletterItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disableDrag });

  const style: React.CSSProperties = useMemo(() => ({
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? transition : undefined,
    zIndex: isDragging ? 50 : undefined,
  }), [transform, transition, isDragging]);

  const category = contentItem?.category ?? "news";
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  // Render layout based on category
  const renderLayout = () => {
    const commonProps = {
      contentItem,
      config,
      Icon,
      note,
      isAiNote,
      onNoteChange,
      onRemove,
      disabled,
      dragHandleProps: disableDrag ? null : { ...attributes, ...listeners },
      categoryBadge,
    };

    switch (category) {
      case "videos":
        return <VideoItemLayout {...commonProps} />;
      case "social":
        return <SocialItemLayout {...commonProps} />;
      case "custom":
        return <CustomItemLayout {...commonProps} />;
      case "news":
      default:
        return <NewsItemLayout {...commonProps} />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden transition-colors",
        "bg-card/50 border-border hover:border-primary/30",
        isDragging && "opacity-50 shadow-xl ring-2 ring-primary/50 z-50"
      )}
    >
      <CardContent className="p-0">
        {renderLayout()}
      </CardContent>
    </Card>
  );
});

interface ItemLayoutProps {
  contentItem: ContentItem | undefined;
  config: typeof CATEGORY_CONFIG[Category];
  Icon: typeof CATEGORY_CONFIG[Category]["icon"];
  note: string;
  isAiNote?: boolean;
  onNoteChange: (note: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  dragHandleProps: Record<string, unknown> | null;
  categoryBadge?: ReactNode;
}

// News-specific layout: Article card with source badge
function NewsItemLayout({
  contentItem,
  config,
  Icon,
  note,
  isAiNote,
  onNoteChange,
  onRemove,
  disabled,
  dragHandleProps,
  categoryBadge,
}: ItemLayoutProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [contentItem?.imageUrl]);

  const showImage = contentItem?.imageUrl && !imageError;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            className="touch-none p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          {/* Header with badge and actions */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {categoryBadge ?? (
              <Badge
                variant="outline"
                className={cn("text-xs gap-1", config.badgeClass)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {contentItem?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={contentItem.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex gap-3">
            {showImage && (
              <img
                src={contentItem.imageUrl!}
                alt=""
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-secondary"
                onError={() => setImageError(true)}
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                {contentItem?.title ?? "Untitled"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-secondary rounded-full">
                  {contentItem?.source ?? "Unknown"}
                </span>
                {contentItem?.author && (
                  <span>by {contentItem.author}</span>
                )}
              </div>
              {contentItem?.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {contentItem.description}
                </p>
              )}
            </div>
          </div>

          {/* Note input */}
          <NoteInput
            note={note}
            isAiNote={isAiNote}
            onNoteChange={onNoteChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// Video-specific layout: Thumbnail + title + channel
function VideoItemLayout({
  contentItem,
  config,
  Icon,
  note,
  isAiNote,
  onNoteChange,
  onRemove,
  disabled,
  dragHandleProps,
  categoryBadge,
}: ItemLayoutProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [contentItem?.imageUrl]);

  const showImage = contentItem?.imageUrl && !imageError;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            className="touch-none p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          {/* Header with badge and actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {categoryBadge ?? (
              <Badge
                variant="outline"
                className={cn("text-xs gap-1", config.badgeClass)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {contentItem?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={contentItem.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Video thumbnail and info */}
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              {showImage ? (
                <img
                  src={contentItem.imageUrl!}
                  alt=""
                  className="w-32 h-20 rounded-lg object-cover bg-secondary"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-20 rounded-lg bg-secondary flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {/* Play indicator */}
              {showImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                {contentItem?.title ?? "Untitled"}
              </h4>
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className={config.textColor}>{contentItem?.source ?? "Unknown"}</span>
                </div>
                {contentItem?.author && (
                  <div className="mt-0.5">{contentItem.author}</div>
                )}
              </div>
            </div>
          </div>

          {/* Note input */}
          <NoteInput
            note={note}
            isAiNote={isAiNote}
            onNoteChange={onNoteChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// Social-specific layout: Quote/post style with author
function SocialItemLayout({
  contentItem,
  config,
  Icon,
  note,
  isAiNote,
  onNoteChange,
  onRemove,
  disabled,
  dragHandleProps,
  categoryBadge,
}: ItemLayoutProps) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            className="touch-none p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          {/* Header with badge and actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {categoryBadge ?? (
              <Badge
                variant="outline"
                className={cn("text-xs gap-1", config.badgeClass)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {contentItem?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={contentItem.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Social post style */}
          <div className={cn("border-l-2 pl-4", config.borderColor)}>
            {/* Author info */}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium", config.bgColor)}>
                {(contentItem?.author ?? "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {contentItem?.author ?? "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  @{(contentItem?.author ?? "user").toLowerCase().replace(/\s+/g, "")}
                </div>
              </div>
            </div>

            {/* Post content */}
            <p className="text-sm text-foreground/80 leading-relaxed">
              {contentItem?.title ?? "Untitled post"}
            </p>
            {contentItem?.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {contentItem.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{contentItem?.source ?? "Unknown platform"}</span>
            </div>
          </div>

          {/* Note input */}
          <NoteInput
            note={note}
            isAiNote={isAiNote}
            onNoteChange={onNoteChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// Custom item layout: Similar to news but with custom badge
function CustomItemLayout({
  contentItem,
  config,
  Icon,
  note,
  isAiNote,
  onNoteChange,
  onRemove,
  disabled,
  dragHandleProps,
  categoryBadge,
}: ItemLayoutProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [contentItem?.imageUrl]);

  const showImage = contentItem?.imageUrl && !imageError;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {dragHandleProps ? (
          <button
            {...dragHandleProps}
            className="touch-none p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}

        <div className="flex-1 min-w-0">
          {/* Header with badge and actions */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {categoryBadge ?? (
              <Badge
                variant="outline"
                className={cn("text-xs gap-1", config.badgeClass)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {contentItem?.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a href={contentItem.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex gap-3">
            {showImage && (
              <img
                src={contentItem.imageUrl!}
                alt=""
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-secondary"
                onError={() => setImageError(true)}
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                {contentItem?.title ?? "Untitled"}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-secondary rounded-full">
                  {contentItem?.source ?? "Custom"}
                </span>
                {contentItem?.author && (
                  <span>by {contentItem.author}</span>
                )}
              </div>
              {contentItem?.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {contentItem.description}
                </p>
              )}
            </div>
          </div>

          {/* Note input */}
          <NoteInput
            note={note}
            isAiNote={isAiNote}
            onNoteChange={onNoteChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// Shared note input component
function NoteInput({
  note,
  isAiNote,
  onNoteChange,
  disabled,
}: {
  note: string;
  isAiNote?: boolean;
  onNoteChange: (note: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Curator Note</span>
        {isAiNote && note && (
          <span className="flex items-center gap-1 text-xs text-amber-500/80">
            <Sparkles className="h-3 w-3" />
            AI-generated
          </span>
        )}
      </div>
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add a note about why this item is noteworthy..."
        className={cn(
          "min-h-[60px] bg-secondary/50 border-border text-sm resize-none",
          "placeholder:text-muted-foreground focus:border-border",
          isAiNote && note && "border-amber-500/30"
        )}
        disabled={disabled}
      />
    </div>
  );
}
