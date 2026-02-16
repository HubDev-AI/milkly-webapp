import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Calendar,
  Trash2,
  Loader2,
} from "lucide-react";

interface Draft {
  id: string;
  title: string;
  createdAt: Date;
  _count: { items: number };
}

interface DraftsSectionProps {
  drafts: Draft[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftClick: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  deletingDraftId?: string | null;
  streamId?: string;
  linkedStreamId?: string;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function DraftsSection({
  drafts,
  isOpen,
  onOpenChange,
  onDraftClick,
  onDeleteDraft,
  deletingDraftId,
  streamId,
  linkedStreamId,
}: DraftsSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);

  const basePath = linkedStreamId
    ? `/linked-streams/${linkedStreamId}/newsletter`
    : `/streams/${streamId}/newsletter`;

  if (drafts.length === 0) {
    return null;
  }

  function handleDeleteClick(draft: Draft) {
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (draftToDelete) {
      onDeleteDraft(draftToDelete.id);
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    }
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete draft?"
        description={`This will permanently delete "${draftToDelete?.title}". This cannot be undone.`}
        onConfirm={confirmDelete}
      />

    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="w-full cream-card px-6 py-5 flex items-center justify-between group cursor-pointer transition-all duration-300 hover:scale-[1.005] active:scale-[0.998]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/15 transition-colors group-hover:bg-primary/15">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-serif text-lg font-bold text-foreground/90 leading-tight">Drafts</h3>
                <span className="text-[10px] font-sans tracking-[0.15em] text-muted-foreground uppercase">
                  {drafts.length} {drafts.length === 1 ? "edition" : "editions"} in progress
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-primary/5">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="cream-card mt-1 px-5 py-4 space-y-1">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 transition-colors group"
              >
                <Link
                  to={`${basePath}/${draft.id}`}
                  className="flex-1 min-w-0"
                  onClick={() => onDraftClick(draft.id)}
                >
                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {draft.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(draft.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {draft._count.items} {draft._count.items === 1 ? "item" : "items"}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(draft)}
                  disabled={deletingDraftId === draft.id}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingDraftId === draft.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
    </>
  );
}
