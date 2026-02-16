import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface TemplateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  templateName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function TemplateDeleteDialog({
  open,
  onOpenChange,
  title,
  templateName,
  onConfirm,
  isLoading = false,
}: TemplateDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md p-0 bg-transparent border-none overflow-visible shadow-none">
        <GlassCard className="p-0 border-red-500/20 overflow-hidden shadow-2xl bg-background/80 backdrop-blur-3xl animate-in zoom-in-95 duration-300">
          <div className="px-8 py-10 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_40px_-10px_rgba(239,68,68,0.4)]">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-3xl font-serif italic text-foreground leading-tight">{title}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-sans max-w-xs mx-auto">
                  Are you sure you want to permanently erase <span className="text-foreground font-bold">"{templateName}"</span>? This action is irreversible.
                </AlertDialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm();
                }}
                disabled={isLoading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Erase Blueprint
              </Button>
              
              <AlertDialogCancel asChild>
                <Button
                  variant="ghost"
                  className="h-12 border border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 font-bold rounded-xl"
                  disabled={isLoading}
                >
                  Keep Existing
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        </GlassCard>
      </AlertDialogContent>
    </AlertDialog>
  );
}
