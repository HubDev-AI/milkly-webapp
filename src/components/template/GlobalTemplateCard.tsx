import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Globe,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { TemplateWithStream } from "../../../milkly-backend/src/types";
import { compileTemplatePreview, stripScripts } from "@/lib/mkly";

export interface GlobalTemplateCardProps {
  template: TemplateWithStream;
  onApply: () => void;
  isApplying: boolean;
}

export function GlobalTemplateCard({
  template,
  onApply,
  isApplying,
}: GlobalTemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const compiledResult = useMemo(() => {
    try {
      return compileTemplatePreview(template.mklySource);
    } catch {
      return { html: "", css: "", errors: [] };
    }
  }, [template.mklySource]);

  return (
    <div className="cream-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-sm truncate">{template.name}</h4>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0"
              >
                Global
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                mkly template
              </Badge>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            className="h-8 px-3 text-xs gap-1"
          >
            {isApplying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                Apply
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 pt-3 border-t border-border/50 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide preview
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show preview
            </>
          )}
        </button>
      </div>

      {isExpanded && compiledResult.html ? (
        <div className="border-t border-border/50 p-3 bg-muted/20">
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${compiledResult.css}</style></head><body style="margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif;">${stripScripts(compiledResult.html)}</body></html>`}
            sandbox="allow-same-origin"
            className="w-full h-64 border-0 rounded-lg"
            title="Template Preview"
          />
        </div>
      ) : null}
    </div>
  );
}
