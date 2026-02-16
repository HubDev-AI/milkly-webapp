import { useState, useMemo, memo } from "react";
import { cn } from "@/lib/Utils";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { TemplateDeleteDialog } from "./TemplateDeleteDialog";
import {
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Hash,
  Link2,
} from "lucide-react";
import type { TemplateWithStream } from "../../../../milkly-backend/src/types";
import { compileTemplatePreview, stripScripts } from "@/lib/mkly";

export interface TemplateGridCardProps {
  template: TemplateWithStream;
  onEdit: (template: TemplateWithStream) => void;
  onDuplicate: (template: TemplateWithStream) => void;
  onDelete: (template: TemplateWithStream) => void;
  onToggleActive: (template: TemplateWithStream) => void;
}

export const TemplateGridCard = memo(function TemplateGridCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateGridCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isGlobal = template.streamType === "global" || !template.streamId;
  const StreamIcon = template.streamType === "stream" ? Hash : Link2;

  const compiledResult = useMemo(() => {
    try {
      return compileTemplatePreview(template.mklySource);
    } catch {
      return { html: "", css: "", errors: [] };
    }
  }, [template.mklySource]);

  const handleCardClick = () => {
    onEdit(template);
  };

  const handleDeleteConfirm = () => {
    onDelete(template);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <GlassCard
        className="h-full group cursor-pointer border-primary/5 hover:border-primary/20 transition-all duration-500"
        onClick={handleCardClick}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  template.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-muted-foreground/30"
                )} />
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">
                  {template.isActive ? "Active Blueprint" : "Draft Space"}
                </span>
              </div>
              <h3 className="text-xl font-serif italic text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
                {template.name}
              </h3>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/90 backdrop-blur-2xl border-primary/10 rounded-xl p-1">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}
                  className="focus:bg-primary/10 focus:text-primary cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Blueprint
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(template);
                  }}
                  className="focus:bg-primary/10 focus:text-primary cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleActive(template);
                  }}
                  className="focus:bg-primary/10 focus:text-primary cursor-pointer"
                >
                  {template.isActive ? (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Move to Drafts
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Launch Blueprint
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-primary/5 my-1" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Template Preview */}
          <div className="flex-1">
            {compiledResult.html ? (
              <div className="h-48 w-full rounded-2xl border border-primary/5 overflow-hidden relative group-hover:border-primary/10 transition-colors duration-500">
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${compiledResult.css ?? ""}html,body{margin:0;padding:8px;font-family:system-ui,-apple-system,sans-serif;font-size:6px;overflow:hidden;pointer-events:none;}</style></head><body>${stripScripts(compiledResult.html)}</body></html>`}
                  sandbox="allow-same-origin"
                  className="w-full h-full border-0 pointer-events-none"
                  title={`Preview of ${template.name}`}
                  tabIndex={-1}
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            ) : (
              <div className="h-48 w-full rounded-2xl bg-primary/5 border border-primary/5 p-3 flex flex-col gap-2 relative overflow-hidden group-hover:bg-primary/10 transition-colors duration-500">
                <div className="w-2/3 h-2 rounded-full bg-primary/10" />
                <div className="w-full h-12 rounded-xl bg-primary/5 border border-primary/5 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 blur-[1px]" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-primary/5" />
                  <div className="w-5/6 h-1.5 rounded-full bg-primary/5" />
                  <div className="w-4/6 h-1.5 rounded-full bg-primary/5" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 duration-500 flex items-center justify-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary/40">No Preview</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/5 text-primary border border-primary/10">
                <StreamIcon className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
                {isGlobal ? "Global Blueprint" : template.streamName}
              </span>
            </div>
            <div className="text-[10px] font-serif italic text-muted-foreground/60">
               Last modified {new Date(template.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </GlassCard>

      <TemplateDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Blueprint"
        templateName={template.name}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
});
