import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { Hash, Link2, Copy, Trash2 } from "lucide-react";
import { compileMkly, stripScripts } from "@/lib/mkly";
import type { TemplateWithStream } from "../../../../milkly-backend/src/types";

export interface TemplateDetailSheetProps {
  template: TemplateWithStream | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (template: TemplateWithStream) => void;
  onDelete: (template: TemplateWithStream) => void;
  onToggleActive: (template: TemplateWithStream) => void;
}

export function TemplateDetailSheet({
  template,
  open,
  onOpenChange,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const compiledPreview = useMemo(() => {
    if (!template) return { html: "", css: "", errors: [] };
    try {
      return compileMkly(template.mklySource);
    } catch {
      return { html: "", css: "", errors: [] };
    }
  }, [template]);

  if (!template) {
    return null;
  }

  const StreamIcon = template.streamType === "stream" ? Hash : Link2;
  const streamLabel = template.streamType === "stream" ? "Stream" : "Linked Stream";

  const handleDelete = () => {
    onDelete(template);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleDuplicate = () => {
    onDuplicate(template);
    onOpenChange(false);
  };

  const handleToggleActive = () => {
    onToggleActive(template);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 pr-8">
              <span className="truncate">{template.name}</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              View and manage template details
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <StreamIcon className="h-3 w-3" />
                {streamLabel}: {template.streamName}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active-toggle" className="text-sm font-medium">
                  Active Template
                </Label>
                <p className="text-xs text-muted-foreground">
                  {template.isActive
                    ? "This template is used for new newsletters"
                    : "Activate to use for new newsletters"}
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={template.isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Template Preview</h3>
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

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Last updated {new Date(template.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
