import { Button } from "@/components/ui/Button";
import { FileText, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/Utils";

interface CreateEditionFABProps {
  selectedCount: number;
  onClick: () => void;
  onClear?: () => void;
}

export function CreateEditionFAB({ selectedCount, onClick, onClear }: CreateEditionFABProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-cream-rise-centered flex items-center gap-3">
      <Button
        onClick={onClick}
        className={cn(
          "h-14 px-8 rounded-full shadow-2xl shadow-primary/30 gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 hover:shadow-primary/40 active:scale-95 bg-primary text-primary-foreground border-none group"
        )}
      >
        <div className="relative">
          <FileText className="h-5 w-5 transition-transform group-hover:-rotate-12" />
          <Sparkles className="absolute -top-1 -right-1.5 h-3 w-3 text-amber-300 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
        </div>
        <span>Create Edition</span>
        <span className="flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-primary-foreground/20 rounded-full text-[10px] font-mono">
          {selectedCount}
        </span>
      </Button>
      
      {onClear && (
        <Button
          onClick={onClear}
          size="icon"
          className="h-10 w-10 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-primary/10 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-black text-foreground hover:text-destructive hover:border-destructive/30 transition-all duration-300 hover:scale-110 active:scale-90"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
