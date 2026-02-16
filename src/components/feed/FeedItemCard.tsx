import { useState, useEffect, memo, useMemo } from "react";
import { cn } from "@/lib/Utils";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { CategoryPill } from "@/components/CategoryPill";
import { ExternalLink, Clock, Pencil, Play, X } from "lucide-react";
import type { ContentItem, LinkedStreamFeedItem } from "../../../milkly-backend/src/types";
import { formatDistanceToNow } from "date-fns";
import { CustomItemSheet } from "../CustomItemSheet";

interface FeedItemCardProps {
  item: ContentItem | LinkedStreamFeedItem;
  isSelected: boolean;
  onToggleSelect?: () => void;
  linkedStreamId?: string;
  streamId?: string;
  onItemUpdated?: (item: LinkedStreamFeedItem | ContentItem) => void;
  onItemDeleted?: () => void;
  isPreview?: boolean;
}

export const FeedItemCard = memo(function FeedItemCard({
  item,
  isSelected,
  onToggleSelect,
  linkedStreamId,
  streamId,
  onItemUpdated,
  onItemDeleted,
  isPreview = false
}: FeedItemCardProps) {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.imageUrl]);

  const isEdited = item.isEdited ?? false;
  const publishedTime = item.publishedAt
    ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })
    : null;

  const hasValidUrl = item.url && (item.url.startsWith("http://") || item.url.startsWith("https://"));
  const showImage = item.imageUrl && !imageError;
  const canEdit = !isPreview && (linkedStreamId || streamId);

  // Video Detection Logic
  const videoId = useMemo(() => {
    if (!item.url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = item.url.match(youtubeRegex);
    return match ? match[1] : null;
  }, [item.url]);

  const isVideo = !!videoId;

  // Hide thumbnail logic for ANY item without a photo (social, custom, etc)
  const shouldHideThumbnail = (!showImage && !isVideo);

  // Check if this is a custom item from a member stream
  const linkedStreamFeedItem = item as LinkedStreamFeedItem;
  const isCustomFromMemberStream = linkedStreamId &&
    linkedStreamFeedItem.isCustomItem &&
    linkedStreamFeedItem.streamName &&
    !linkedStreamFeedItem.isLinkedStreamCustomItem;

  return (
    <>
      <div 
        className={cn(
          "group relative flex flex-col gap-3 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30 backdrop-blur-md border border-primary/5 rounded-[2rem] p-3 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5",
          isSelected && "ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10",
          shouldHideThumbnail && "pb-5 bg-white/50 dark:bg-zinc-900/30", // Slightly different bg for text-only cards
          isPreview && "hover:-translate-y-0 hover:shadow-primary/5 cursor-default"
        )}
      >
        {/* Selection Overlay (Mobile friendly touch target) - Disabled in Preview */}
        {!isPreview && (
          <div 
            className="absolute inset-0 z-0 cursor-pointer" 
            onClick={(e) => {
               // Only toggle if not clicking interactive elements
               if ((e.target as HTMLElement).closest('button, a, input, [role="button"], iframe')) return;
               onToggleSelect?.();
            }}
          />
        )}

        {/* Thumbnail/Video Section */}
        {!shouldHideThumbnail && (
          <div className="relative aspect-video rounded-[1.25rem] overflow-hidden bg-black/5 dark:bg-white/5 border border-primary/5 shadow-inner group-hover:shadow-lg transition-all duration-500 z-10 w-full mb-1">
             {isPlaying && videoId ? (
               <div className="absolute inset-0 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors z-20"
                  >
                    <X className="h-4 w-4" />
                  </button>
               </div>
             ) : (
               <>
                 {showImage ? (
                   <img
                     src={item.imageUrl!}
                     alt=""
                     className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                     onError={() => setImageError(true)}
                     loading="lazy"
                   />
                 ) : null}
                 
                 {isVideo && (
                    <div 
                      className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all duration-500 group/play",
                        !isPreview && "cursor-pointer"
                      )}
                      onClick={(e) => { 
                        if (isPreview) return;
                        e.stopPropagation(); 
                        setIsPlaying(true); 
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center shadow-2xl scale-90 group-hover/play:scale-110 transition-transform duration-300">
                        <Play className="h-5 w-5 fill-primary text-primary ml-1" />
                      </div>
                    </div>
                 )}
               </>
             )}
             
             {!isPlaying && (
               <div className="absolute top-3 left-3 z-10">
                 <CategoryPill category={item.category} size="sm" className="shadow-lg backdrop-blur-xl bg-white/80 dark:bg-black/60 border-none text-[9px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-lg" />
               </div>
             )}

             {/* Checkbox Overlay - Disabled in Preview */}
             {!isPlaying && !isPreview && (
               <div className={cn(
                 "absolute top-3 right-3 z-20 transition-all duration-300 scale-90 group-hover:scale-100",
                 isSelected
                   ? "opacity-100"
                   : "opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
               )}>
                 <Checkbox
                   checked={isSelected}
                   onCheckedChange={() => onToggleSelect?.()}
                   className="h-5 w-5 rounded-[6px] bg-transparent border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                 />
               </div>
             )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col z-10 pointer-events-none">
          <div className="flex-1 pointer-events-auto">
             <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2 w-full">
                  {shouldHideThumbnail && (
                    <div className="flex items-center justify-between w-full mb-1">
                      <CategoryPill category={item.category} size="sm" className="w-fit bg-primary/10 text-primary border-none text-[8px] font-bold uppercase tracking-[0.2em]" />
                      
                      {/* Show Checkbox here if thumbnail is hidden - Disabled in Preview */}
                       {!isPreview && (
                         <div className={cn(
                           "transition-all duration-300 scale-90",
                           isSelected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                         )}>
                           <Checkbox
                             checked={isSelected}
                             onCheckedChange={() => onToggleSelect?.()}
                             className="h-5 w-5 rounded-[6px] bg-transparent border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                           />
                         </div>
                       )}
                    </div>
                  )}
                  <h3 className={cn(
                    "font-sans font-extrabold leading-[1.2] tracking-tight text-foreground group-hover:text-primary transition-colors",
                    shouldHideThumbnail ? "text-xl line-clamp-4" : "text-[1.125rem] line-clamp-2"
                  )}>
                    <a 
                      href={(!isPreview && item.url) || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => (isPreview || !hasValidUrl) && e.preventDefault()}
                      className={cn(
                        "hover:underline decoration-primary/20 subtitle-underline", 
                        (isPreview || !hasValidUrl) && "pointer-events-none cursor-default"
                      )}
                    >
                      {item.title}
                    </a>
                  </h3>
                </div>
             </div>

             <div className="mt-2.5 flex items-center gap-2.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-primary/70">
                  {item.source}
                </span>
                <span className="text-muted-foreground/30 font-light text-[8px]">|</span>
                {publishedTime && (
                  <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
                    <Clock className="h-2.5 w-2.5" />
                    {publishedTime}
                  </span>
                )}
             </div>

             {item.description && (
               <p className="mt-3.5 text-[13px] text-muted-foreground/90 line-clamp-2 md:line-clamp-3 font-sans leading-relaxed tracking-wide">
                 {item.description}
               </p>
             )}
             
             <div className="mt-4 flex flex-wrap gap-1.5">
               {isEdited && (
                  <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/10 text-[8px] font-bold uppercase tracking-wider px-2 h-4.5 rounded-full">
                    Edited
                  </Badge>
               )}
               {isCustomFromMemberStream && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-bold uppercase tracking-wider px-2 h-4.5 rounded-full">
                    {linkedStreamFeedItem.streamName}
                  </Badge>
               )}
             </div>
          </div>

          {/* Action Bar (Refined) - Hidden in Preview */}
          {!isPreview && (
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-primary/5 pointer-events-auto">
               <div className="flex items-center gap-1">
                 <a
                   href={item.url ?? "#"}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={cn(
                     "flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] transition-all py-1.5 px-3 rounded-lg hover:bg-primary/5",
                     hasValidUrl ? "text-primary" : "text-muted-foreground opacity-20 pointer-events-none"
                   )}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (!hasValidUrl) e.preventDefault();
                   }}
                 >
                   <ExternalLink className="h-3 w-3" />
                   Source
                 </a>

                 {canEdit && (
                   <button
                     type="button"
                     className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-foreground transition-all py-1.5 px-3 rounded-lg hover:bg-primary/5"
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

               <div className="flex items-center">
                  {/* Space for additional small action if needed */}
               </div>
            </div>
          )}
        </div>
      </div>

      {canEdit && !isPreview && (
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
    </>
  );
});
