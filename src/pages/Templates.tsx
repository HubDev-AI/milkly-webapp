import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useDebounce } from "@/hooks";
import { useAllTemplates, type StreamType } from "@/hooks/useAllTemplates";
import { useToast } from "@/hooks/useToast";
import { UI } from "@/lib/Constants";
import { api } from "@/lib/Api";
import { getErrorMessage } from "@/lib/Utils";
import { queryKeys } from "@/lib/QueryKeys";
import { TemplateGridCard } from "@/components/template/TemplateGridCard";
import { TemplateDetailSheet } from "@/components/template/TemplateDetailSheet";
import type { TemplateWithStream } from "../../../milkly-backend/src/types";

type StatusFilter = "all" | "active" | "inactive";

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [streamType, setStreamType] = useState<StreamType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithStream | null>(null);

  const debouncedSearch = useDebounce(search, UI.DEBOUNCE_MS);

  const isActive = useMemo(() => {
    if (statusFilter === "all") return undefined;
    return statusFilter === "active";
  }, [statusFilter]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { templates, pagination, isLoading, error } = useAllTemplates({
    page,
    streamType,
    isActive,
    search: debouncedSearch || undefined,
  });

  // Debug: log any query errors
  if (error) {
    console.error("[Templates] Query error:", error);
  }

  const isFetching = queryClient.isFetching({ queryKey: ["templates"] }) > 0;

  const deleteMutation = useMutation({
    mutationFn: async (template: TemplateWithStream) => {
      const type = template.streamType === "global" ? "stream" : template.streamType;
      await api.delete(`/templates/${template.id}?streamType=${type}`);
    },
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (template.streamId) {
        if (template.streamType === "linkedStream") {
          queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.templates(template.streamId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(template.streamId) });
        }
      }
      toast({ description: "Template deleted" });
    },
    onError: (error) => {
      toast({ description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (template: TemplateWithStream) => {
      if (template.isActive) {
        await api.patch(`/templates/${template.id}/deactivate`);
      } else {
        await api.patch(`/templates/${template.id}/activate`, {
          streamType: template.streamType === "global" ? "stream" : template.streamType,
        });
      }
    },
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (template.streamId) {
        if (template.streamType === "linkedStream") {
          queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.templates(template.streamId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(template.streamId) });
        }
      }
      toast({
        description: template.isActive ? "Template deactivated" : "Template activated",
      });
    },
    onError: (error) => {
      toast({ description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: TemplateWithStream) => {
      await api.post(`/templates/${template.id}/duplicate`, {
        streamType: template.streamType === "global" ? "stream" : template.streamType,
      });
    },
    onSuccess: (_, template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (template.streamId) {
        if (template.streamType === "linkedStream") {
          queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.templates(template.streamId) });
        } else {
          queryClient.invalidateQueries({ queryKey: queryKeys.streams.templates(template.streamId) });
        }
      }
      toast({ description: "Template duplicated" });
    },
    onError: (error) => {
      toast({ description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const handleEdit = useCallback(
    (template: TemplateWithStream) => {
      navigate(`/templates/${template.id}`);
    },
    [navigate]
  );

  const handleDuplicate = useCallback(
    (template: TemplateWithStream) => {
      duplicateMutation.mutate(template);
    },
    [duplicateMutation]
  );

  const handleDelete = useCallback(
    (template: TemplateWithStream) => {
      deleteMutation.mutate(template);
    },
    [deleteMutation]
  );

  const handleToggleActive = useCallback(
    (template: TemplateWithStream) => {
      toggleActiveMutation.mutate(template);
    },
    [toggleActiveMutation]
  );

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStreamTypeChange = (value: StreamType) => {
    setStreamType(value);
    setPage(1);
  };

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen cream-gradient safe-area-top safe-area-bottom selection:bg-primary/20 pt-6">
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

      <main className="relative z-10 px-6 max-w-5xl mx-auto mt-16 md:mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-primary/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Curated Gallery</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
              Newsletter <br />
              <span className="not-italic text-primary">Templates</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md font-serif italic">
              A collection of high-performance blueprints crafted for maximum engagement.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/templates/new")} 
            className="gap-2 h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-105 active:scale-95 group"
          >
            <Plus className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
            <span className="font-semibold tracking-wide">Create Blueprint</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-6 relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-colors duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors duration-300" />
              <Input
                placeholder="Search blueprints..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-11 h-12 bg-white/5 border-primary/20 rounded-2xl focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all duration-300 backdrop-blur-md"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <Select value={streamType} onValueChange={handleStreamTypeChange}>
              <SelectTrigger className="h-12 bg-white/40 border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 backdrop-blur-md transition-all duration-300">
                <SelectValue placeholder="Stream type" />
              </SelectTrigger>
              <SelectContent className="bg-background/90 backdrop-blur-2xl border-primary/20 rounded-2xl">
                <SelectItem value="all">All Streams</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="stream">Streams</SelectItem>
                <SelectItem value="linkedStream">Linked Streams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-3">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-12 bg-white/40 border-primary/10 rounded-2xl focus:ring-4 focus:ring-primary/5 backdrop-blur-md transition-all duration-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background/90 backdrop-blur-2xl border-primary/20 rounded-2xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TemplatesLoadingSkeleton />
        ) : templates.length === 0 ? (
          <EmptyState
            hasFilters={!!debouncedSearch || streamType !== "all" || statusFilter !== "all"}
            onClearFilters={() => {
              setSearch("");
              setStreamType("all");
              setStatusFilter("all");
              setPage(1);
            }}
            onCreateTemplate={() => navigate("/templates/new")}
          />
        ) : (
          <>
            {pagination ? (
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary/5">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground/60">
                    Collection index: <span className="text-primary/80 font-bold">{(page - 1) * (pagination.limit ?? 20) + 1}—{Math.min(page * (pagination.limit ?? 20), pagination.total)}</span> of <span className="text-primary/80 font-bold">{pagination.total}</span> entries
                  </p>
                </div>
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <TemplateGridCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 1 || isFetching}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= pagination.totalPages || isFetching}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <TemplateDetailSheet
        template={selectedTemplate}
        open={!!selectedTemplate}
        onOpenChange={(open) => {
          if (!open) setSelectedTemplate(null);
        }}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}

function TemplatesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="liquid-glass-card h-[400px] p-6 flex flex-col gap-8 opacity-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-24 bg-primary/10" />
              <Skeleton className="h-8 w-3/4 bg-primary/10" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full bg-primary/10" />
          </div>
          
          <div className="flex-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <Skeleton className="w-10 h-10 rounded-full bg-primary/10 border-4 border-transparent" />
                <Skeleton className="w-10 h-10 rounded-full bg-primary/10 border-4 border-transparent" />
              </div>
              <div className="h-4 w-px bg-primary/5 mx-1" />
              <div className="flex gap-1.5">
                <Skeleton className="w-7 h-7 rounded-lg bg-primary/10" />
                <Skeleton className="w-7 h-7 rounded-lg bg-primary/10" />
                <Skeleton className="w-7 h-7 rounded-lg bg-primary/10" />
              </div>
            </div>
            
            <Skeleton className="h-32 w-full rounded-2xl bg-primary/5" />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Skeleton className="h-5 w-24 bg-primary/10" />
            <Skeleton className="h-3 w-32 bg-primary/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateTemplate: () => void;
}

function EmptyState({ hasFilters, onClearFilters, onCreateTemplate }: EmptyStateProps) {
  return (
    <div className="relative max-w-xl mx-auto py-24 px-8 text-center">
      <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl" />
      <div className="relative space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-background/40 backdrop-blur-2xl border border-primary/20 shadow-2xl shadow-primary/10">
          <FileText className="h-10 w-10 text-primary animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-3xl font-serif italic text-foreground leading-tight">
            {hasFilters ? "No matches found in the gallery" : "Your gallery is currently empty"}
          </h3>
          <p className="text-muted-foreground font-serif italic max-w-sm mx-auto">
            {hasFilters 
              ? "We couldn't find any blueprints matching your current filters. Try broader criteria." 
              : "Every great masterpiece starts with a single blueprint. Begin your design journey today."}
          </p>
        </div>

        {hasFilters ? (
          <Button 
            variant="ghost" 
            onClick={onClearFilters}
            className="rounded-full px-8 h-12 border border-primary/10 hover:bg-primary/5 hover:text-primary transition-all duration-300"
          >
            Reset All Filters
          </Button>
        ) : (
          <Button 
            onClick={onCreateTemplate} 
            className="gap-2 h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-105 active:scale-95 group"
          >
            <Plus className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
            <span className="font-semibold tracking-wide">Create First Blueprint</span>
          </Button>
        )}
      </div>
    </div>
  );
}
