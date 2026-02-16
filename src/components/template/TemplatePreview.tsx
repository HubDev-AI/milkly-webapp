import { useMemo } from "react";
import { cn } from "@/lib/Utils";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { compileTemplatePreview, stripScripts } from "@/lib/mkly";
import type { Template } from "../../../milkly-backend/src/types";

interface TemplatePreviewProps {
  template: Template;
  className?: string;
  compact?: boolean;
}

export function TemplatePreview({
  template,
  className,
  compact = false,
}: TemplatePreviewProps) {
  const compiledResult = useMemo(() => {
    try {
      return compileTemplatePreview(template.mklySource);
    } catch {
      return { html: "", css: "", errors: [] };
    }
  }, [template.mklySource]);

  const primaryColor = "#D4A574";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 overflow-hidden",
        className
      )}
    >
      <div
        className="px-4 py-3 border-b border-border/50"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}10 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <FileText
                className="h-4 w-4"
                style={{ color: primaryColor }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{template.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                  mkly
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("bg-white", compact ? "max-h-48 overflow-y-auto" : "min-h-[300px]")}>
        {compiledResult.html ? (
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>${compiledResult.css}</style>
                </head>
                <body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
                  ${stripScripts(compiledResult.html)}
                </body>
              </html>
            `}
            sandbox="allow-same-origin"
            className="w-full h-full border-0"
            style={{ minHeight: compact ? "200px" : "300px" }}
            title="Template Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No preview available
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border/50 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Compiled mkly template</span>
        {compiledResult.errors.length > 0 && (
          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
            {compiledResult.errors.length} error{compiledResult.errors.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface TemplatePreviewCompactProps {
  template: Template;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TemplatePreviewCompact({
  template,
  isSelected,
  onClick,
}: TemplatePreviewCompactProps) {
  const primaryColor = "#D4A574";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border/50 hover:border-border bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <FileText className="h-5 w-5" style={{ color: primaryColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{template.name}</h4>
            {template.isActive ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">
                Active
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>mkly template</span>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
