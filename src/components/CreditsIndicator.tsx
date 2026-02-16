import { useUsage } from "@/hooks/useUsage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface CreditsIndicatorProps {
  type: "aiCredits" | "refreshes";
  compact?: boolean;
}

export function CreditsIndicator({ type, compact = false }: CreditsIndicatorProps) {
  const { aiCredits, refreshes, resetTime, showResetTime, isLoading } = useUsage();

  const data = type === "aiCredits" ? aiCredits : refreshes;
  const label = type === "aiCredits" ? "AI Credits" : "Refreshes";

  if (isLoading) return null;
  if (data.isUnlimited) return null;

  // Calculate percentage for the ring (0-100)
  const percentage = Math.min(100, Math.max(0, (data.remaining / data.limit) * 100));
  
  // Circle config
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-black/20 border border-primary/5 hover:border-primary/20 transition-all cursor-help group">
             {/* Progress Ring */}
             <div className="relative h-4 w-4 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
                   {/* Background Circle */}
                   <circle 
                      className="text-primary/10" 
                      cx="12" cy="12" r={radius} 
                      stroke="currentColor" strokeWidth="3" fill="none" 
                   />
                   {/* Progress Circle */}
                   <circle 
                      cx="12" cy="12" r={radius} 
                      stroke="currentColor" strokeWidth="3" fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-1000 ease-out"
                   />
                </svg>
             </div>
             
             {/* Text Counter */}
             <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground/80 group-hover:text-primary transition-colors">
                {!compact ? (
                   <>
                     <span className={data.remaining < 10 ? "text-red-500" : ""}>{data.remaining}</span>
                     <span className="opacity-40 mx-0.5">/</span>
                     <span className="opacity-40">{data.limit}</span>
                   </>
                ) : (
                   <span>{data.remaining}</span>
                )}
             </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
             <p className="font-bold text-xs">{label}</p>
             <p className="text-xs text-muted-foreground">You have {data.remaining} out of {data.limit} remaining.</p>
             {showResetTime && resetTime ? (
               <p className="text-[10px] uppercase tracking-wider opacity-50 pt-1 border-t border-border/50 mt-1">
                 Resets {resetTime}
               </p>
             ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
