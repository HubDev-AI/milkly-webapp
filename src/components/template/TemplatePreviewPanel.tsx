import { useEffect, useState, useCallback } from "react";
import { Lock, Sparkles, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/Utils";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { NewsletterPreview } from "@/components/newsletter/NewsletterPreview";
import { MilkLoadingOverlay } from "@/components/MilkLoading";
import { useTemplatePreview } from "@/hooks/useTemplatePreview";
import { useSubscription } from "@/hooks/useSubscription";

interface TemplatePreviewPanelProps {
  mklySource: string | null;
  className?: string;
}

export function TemplatePreviewPanel({
  mklySource,
  className,
}: TemplatePreviewPanelProps) {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { isEssential } = useSubscription();
  const { previewHtml, isLoading, error, refresh, lastUpdated } =
    useTemplatePreview(mklySource, autoRefresh && !isEssential);
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  const updateRelativeTime = useCallback(() => {
    if (lastUpdated) {
      setRelativeTime(formatDistanceToNow(lastUpdated, { addSuffix: true }));
    }
  }, [lastUpdated]);

  useEffect(() => {
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);
    return () => clearInterval(interval);
  }, [updateRelativeTime]);

  if (isEssential) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex flex-col gap-4 pb-6 border-b border-primary/5 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/40">Visual Manifestation</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <UpgradeRequiredState />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col gap-6 pb-6 border-b border-primary/5 mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">Visual Manifestation</h3>
            </div>
            {relativeTime ? (
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40 ml-3.5">
                Last synchronized: {relativeTime}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isLoading || !mklySource}
            className="rounded-full h-10 px-6 border border-primary/30 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all duration-300 gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Sync</span>
          </Button>
        </div>
        <div className="flex items-center gap-3 ml-3.5 bg-primary/5 self-start px-4 py-2 rounded-full border border-primary/5">
          <Checkbox
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={(checked) => setAutoRefresh(checked === true)}
            className="border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="auto-refresh" className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/60 cursor-pointer">
            Fluid synchronization <span className="text-[9px] opacity-70 italic ml-1">(Consumes Credits)</span>
          </Label>
        </div>
      </div>

      <MilkLoadingOverlay isVisible={isLoading} message="Generating preview..." />

      <div className="flex-1 min-h-0 overflow-y-auto pb-12">
        {!mklySource ? (
          <EmptyState message="Configure your template to see a preview" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : previewHtml ? (
          <NewsletterPreview htmlContent={previewHtml} disableLinks />
        ) : (
          <EmptyState message="Click Refresh Preview to generate" />
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
      <div className="absolute inset-0 bg-primary/5 rounded-[4rem] blur-3xl opacity-20" />
      <div className="relative space-y-6">
        <div className="p-3 mx-auto w-fit">
          <div className="w-20 h-20 rounded-3xl bg-background/40 backdrop-blur-2xl border border-primary/20 shadow-2xl flex items-center justify-center mx-auto transition-transform duration-1000 hover:rotate-12">
          <Sparkles className="h-10 w-10 text-primary/40 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
            <h4 className="text-2xl font-serif italic text-foreground tracking-tight">Curation Pending</h4>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/40 max-w-[200px] mx-auto">{message}</p>
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-destructive/5 border border-destructive/20 flex items-center justify-center mx-auto text-destructive/40 text-4xl font-serif italic">
          !
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-2xl font-serif italic text-foreground tracking-tight">Signal Interrupted</h4>
            <p className="text-xs font-mono uppercase tracking-widest text-destructive/60 max-w-[240px] mx-auto">{message}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="rounded-full h-10 px-8 border border-destructive/10 text-destructive hover:bg-destructive/5"
          >
            Re-establish Signal
          </Button>
        </div>
      </div>
    </div>
  );
}

function UpgradeRequiredState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
       <div className="absolute inset-x-12 inset-y-12 bg-primary/10 rounded-[4rem] blur-[100px] animate-pulse" />
       <div className="relative space-y-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-background/40 backdrop-blur-3xl border border-primary/10 shadow-2xl shadow-primary/10">
          <Lock className="h-12 w-12 text-primary" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary/40 font-bold italic">Exclusive Gallery</span>
            <h3 className="text-3xl font-serif italic text-foreground leading-tight">Professional Perception</h3>
          </div>
          <p className="text-muted-foreground font-serif italic max-w-[260px] mx-auto">
            AI-powered manifested rendering is exclusively available for our distinguished Professional members.
          </p>
        </div>

        <Button
          onClick={() => window.location.href = "/pricing"}
          className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all duration-500 hover:scale-105 active:scale-95 group font-semibold gap-3"
        >
          <Sparkles className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12 shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          Ascend to Professional
        </Button>
      </div>
    </div>
  );
}
