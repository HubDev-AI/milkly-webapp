import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Filter, CalendarClock } from "lucide-react";
import { cn } from "@/lib/Utils";

interface FeedFilterProps {
  type: "feedFilter" | "batchFilter";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  batches?: { batchId: string; fetchedAt: string }[];
}

function formatBatchDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function FeedFilter({
  type,
  value,
  onChange,
  disabled = false,
  batches,
}: FeedFilterProps) {
  if (type === "feedFilter") {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn(
          "w-auto min-w-[130px] h-10 rounded-full transition-all duration-200",
          "bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20",
          "text-[10px] font-bold uppercase tracking-wider text-primary/80",
          "hover:bg-primary/5 hover:border-primary/30",
          disabled && "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-2 px-3">
            <Filter className="h-3.5 w-3.5 text-primary/60" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl">
          <SelectItem value="all">All Items</SelectItem>
          {!disabled ? <SelectItem value="lastMilk">Last Milk</SelectItem> : null}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn(
        "w-auto min-w-[150px] h-10 rounded-full transition-all duration-200",
        "bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20",
        "text-[10px] font-bold uppercase tracking-wider text-primary/80",
        "hover:bg-primary/5 hover:border-primary/30",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <div className="flex items-center gap-2 px-3">
          <CalendarClock className="h-3.5 w-3.5 text-primary/60" />
          <SelectValue placeholder="All batches" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl">
        <SelectItem value="all">All batches</SelectItem>
        {batches?.map((batch) => (
          <SelectItem key={batch.batchId} value={batch.batchId} className="text-[11px]">
            {formatBatchDate(batch.fetchedAt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
