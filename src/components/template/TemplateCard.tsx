import { useState, useMemo } from "react";
import { cn } from "@/lib/Utils";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  FileText,
} from "lucide-react";
import { compileMkly, stripScripts } from "@/lib/mkly";

export interface TemplateCardData {
  id: string;
  name: string;
  mklySource: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  streamId?: string;
  linkedStreamId?: string;
}

interface TemplateCardProps {
  template: TemplateCardData;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  isActivating?: boolean;
  isDeactivating?: boolean;
  isDeleting?: boolean;
  showFromStreamBadge?: boolean;
}

export function TemplateCard({
  template,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  isActivating = false,
  isDeactivating = false,
  isDeleting = false,
  showFromStreamBadge = false,
}: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const compiledPreview = useMemo(() => {
    try {
      return compileMkly(template.mklySource);
    } catch {
      return { html: "", css: "", errors: [] };
    }
  }, [template.mklySource]);

  const primaryColor = "#D4A574";
  const accentColor = "#4A3728";

  return (
    <>
      <div className="group relative overflow-hidden rounded-[2rem] bg-white/10 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
        {/* Specular Highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20"
              style={{
                backgroundColor: `${primaryColor}15`,
              }}
            >
              <FileText
                className="h-6 w-6 transition-transform duration-500 group-hover:rotate-12"
                style={{ color: primaryColor }}
              />
            </div>

            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h4 className="font-serif italic font-black text-lg tracking-tight truncate">{template.name}</h4>
                {template.isActive && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-glow-green">
                    Operational
                  </div>
                )}
                {showFromStreamBadge && template.streamId && (
                  <div className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                    Inherited
                  </div>
                )}
              </div>
              
              {/* Refined metadata row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: primaryColor }} />
                  <div className="w-2.5 h-2.5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: accentColor }} />
                </div>

                <div className="h-3 w-px bg-primary/10" />

                <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">
                  mkly template
                </span>
              </div>
            </div>

            {/* Premium action cluster */}
            <div className="flex flex-col gap-2">
              <Button
                variant={template.isActive ? "secondary" : "default"}
                size="sm"
                onClick={template.isActive ? onDeactivate : onActivate}
                disabled={isActivating || isDeactivating}
               className={cn(
                  "h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  template.isActive ? "bg-white/10 border-white/20 hover:bg-white/20" : "shadow-lg shadow-primary/20"
               )}
              >
                {isActivating || isDeactivating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : template.isActive ? (
                  "Deactivate"
                ) : (
                  "Activate"
                )}
              </Button>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-9 w-9 p-0 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="h-9 w-9 p-0 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive transition-all"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-5 pt-4 border-t border-primary/5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 hover:text-primary transition-all duration-300"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Collapse Architecture
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Manifest Blueprint
              </>
            )}
          </button>
        </div>

        {/* Expanded preview with deep glass background */}
        {isExpanded && (
          <div className="border-t border-primary/10 p-5 bg-white/5 backdrop-blur-3xl animate-in slide-in-from-top-2 duration-500">
            <div className="bg-white rounded-xl border border-primary/10 overflow-hidden shadow-lg max-h-96">
              {compiledPreview.html ? (
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <style>${compiledPreview.css}</style>
                      </head>
                      <body style="margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
                        ${stripScripts(compiledPreview.html)}
                      </body>
                    </html>
                  `}
                  sandbox="allow-same-origin"
                  className="w-full h-full min-h-[300px] border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No preview available
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete template?"
        description={`This will permanently delete "${template.name}". This cannot be undone.`}
        onConfirm={() => {
          onDelete();
          setShowDeleteDialog(false);
        }}
      />
    </>
  );
}
