import { Input } from "@/components/ui/Input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/Utils";

interface FeedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalResults?: number;
  debouncedValue?: string;
  className?: string;
}

export function FeedSearch({
  value,
  onChange,
  placeholder = "Search content...",
  totalResults,
  debouncedValue,
  className,
}: FeedSearchProps) {
  function handleClear() {
    onChange("");
  }

  return (
    <div className={cn("", className)}>
      <div className="relative group/search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/50 group-focus-within/search:text-primary transition-colors duration-300 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pl-10 pr-10 h-10 rounded-full transition-all duration-200",
            "bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20",
            "focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
            "text-xs font-medium placeholder:text-muted-foreground/50",
            className
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary/50 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200 z-10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {debouncedValue ? (
        <div className="flex items-center gap-3 mt-3 px-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
          <span>
            Searching:{" "}
            <strong className="text-primary tracking-normal font-serif lowercase italic text-xs ml-1">{debouncedValue}</strong>
          </span>
          {totalResults !== undefined ? (
            <>
              <span className="opacity-30">•</span>
              <span>
                {totalResults} {totalResults === 1 ? "result" : "results"}
              </span>
            </>
          ) : null}
          <button
            onClick={handleClear}
            className="text-primary/60 hover:text-primary transition-colors ml-auto"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}
