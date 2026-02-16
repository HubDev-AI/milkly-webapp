import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { CustomItemSheet } from "./CustomItemSheet";
import type { ContentItem } from "../../../milkly-backend/src/types";
import type { StreamType } from "@/lib/Constants";
import { cn } from "@/lib/Utils";

interface AddCustomItemDialogProps {
  streamId: string;
  streamType: StreamType;
  onItemCreated: (item: ContentItem) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  onTierRestricted?: () => void;
}

export function AddCustomItemDialog({
  streamId,
  streamType,
  onItemCreated,
  children,
  disabled,
  onTierRestricted,
}: AddCustomItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sheetProps = streamType === "linkedStream"
    ? { linkedStreamId: streamId }
    : { streamId };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.stopPropagation();
      e.preventDefault();
      onTierRestricted?.();
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <div onClick={handleClick}>
        {children ?? (
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2 rounded-full bg-white/40 dark:bg-black/20 border-primary/10 hover:border-primary/20 text-[10px] font-bold uppercase tracking-widest transition-all px-4",
              disabled && "opacity-50 grayscale pointer-events-none"
            )} 
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        )}
      </div>
      <CustomItemSheet
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        {...sheetProps}
        onItemCreated={onItemCreated}
      />
    </>
  );
}
