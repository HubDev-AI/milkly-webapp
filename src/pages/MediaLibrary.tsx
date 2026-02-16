import { useState } from "react";
import { Link } from "react-router-dom";
import { UserMenu } from "@/components/UserMenu";
import { MilklyLogo } from "@/components/MilklyLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Checkbox } from "@/components/ui/Checkbox";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  ArrowLeft,
  Grid3X3,
  List,
  Search,
  Trash2,
  ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Cloud,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/Utils";
import { UploadDropzone } from "@/components/media/UploadDropzone";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaList } from "@/components/media/MediaList";
import { ImageEditor } from "@/components/media/ImageEditor";
import {
  useMediaList,
  useMediaUsage,
  useUploadMedia,
  useDeleteMedia,
  useDeleteMediaBulk,
  useSetAsLogo,
} from "@/hooks";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/Utils";
import type { MediaFileWithUrl } from "../../../milkly-backend/src/types";

type ViewMode = "grid" | "list";

export default function MediaLibrary() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFileWithUrl | null>(null);

  const { toast } = useToast();

  const { data: mediaResponse, isLoading } = useMediaList({
    page,
    search: search.trim() || undefined,
  });

  const { data: usageData } = useMediaUsage();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const deleteBulkMutation = useDeleteMediaBulk();
  const setAsLogoMutation = useSetAsLogo();

  const files = mediaResponse?.files ?? [];
  const pagination = mediaResponse?.pagination;

  const handleUpload = async (file: File) => {
    try {
      await uploadMutation.mutateAsync(file);
      toast({ title: "File uploaded successfully" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({ title: "File deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteBulkMutation.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast({ title: `${selectedIds.size} files deleted` });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
  };

  const handleSetAsLogo = async (id: string) => {
    try {
      await setAsLogoMutation.mutateAsync(id);
      toast({ title: "Logo updated" });
    } catch (error) {
      toast({
        title: "Failed to set logo",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const confirmDelete = (id?: string) => {
    if (id) {
      setFileToDelete(id);
    } else {
      setFileToDelete(null);
    }
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      await handleDelete(fileToDelete);
    } else {
      await handleBulkDelete();
    }
    setDeleteConfirmOpen(false);
    setFileToDelete(null);
  };

  const usedMB = usageData ? (usageData.usedBytes / 1024 / 1024).toFixed(1) : "0";
  const maxMB = usageData && usageData.maxBytes > 0 ? (usageData.maxBytes / 1024 / 1024).toFixed(0) : "∞";
  const usagePercent = usageData?.percentage ?? 0;

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="px-6 max-w-5xl mx-auto space-y-8 relative z-10 mt-16 md:mt-24">
        {/* Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Asset Vault</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
            Media <br />
            <span className="not-italic text-primary">Library</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md font-serif italic">
            Upload, organize, and manage your visual assets.
          </p>
        </div>

        {/* Storage Usage */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 rounded-2xl p-6 border border-primary/10 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Cloud className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-serif text-lg font-medium text-foreground">Storage Status</h3>
                    <p className="text-xs text-muted-foreground">Manage your cloud capacity</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-serif font-medium text-primary">{usedMB} <span className="text-sm text-muted-foreground font-sans">MB</span></span>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">of {maxMB} MB Used</div>
            </div>
          </div>
          
          <div className="relative h-2 bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                    "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                    usagePercent > 90 ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                )}
            />
          </div>
          
          {usagePercent >= 90 && (
            <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-xs text-destructive mt-3 flex items-center gap-2 font-medium"
            >
              <HardDrive className="h-3 w-3" />
              You're running low on storage. <Link to="/subscription" className="underline hover:text-destructive/80">Upgrade your plan</Link>
            </motion.p>
          )}
        </motion.div>

        {/* Upload Area */}
        <UploadDropzone
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
          maxSize={10 * 1024 * 1024}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selection Actions */}
        {files.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Checkbox
              checked={files.length > 0 && selectedIds.size === files.length}
              onCheckedChange={selectAll}
              disabled={files.length === 0}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set(files.map((f) => f.id)))}
              disabled={selectedIds.size === files.length}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
            >
              Unselect All
            </Button>
            <div className="flex-1" />
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete()}
                  disabled={deleteBulkMutation.isPending}
                >
                  {deleteBulkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        )}

        {/* File List/Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium">No files yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload images to get started
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <MediaGrid
            files={files}
            selectedIds={selectedIds}
            onSelect={toggleSelection}
            onDelete={confirmDelete}
            onSetAsLogo={handleSetAsLogo}
            onEdit={setEditingFile}
          />
        ) : (
          <MediaList
            files={files}
            selectedIds={selectedIds}
            onSelect={toggleSelection}
            onDelete={confirmDelete}
            onSetAsLogo={handleSetAsLogo}
            onEdit={setEditingFile}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${fileToDelete ? "file" : "files"}?`}
        description={
          fileToDelete
            ? "This file will be permanently deleted. This action cannot be undone."
            : `${selectedIds.size} files will be permanently deleted. This action cannot be undone.`
        }
        onConfirm={handleConfirmDelete}
      />

      {/* Image Editor */}
      {editingFile && (
        <ImageEditor
          file={editingFile}
          open={!!editingFile}
          onOpenChange={(open) => !open && setEditingFile(null)}
          onSaved={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}
