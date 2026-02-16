import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { CreateLinkedStreamDialog } from "@/components/stream/CreateLinkedStreamDialog";
import { AddCustomItemDialog } from "@/components/AddCustomItemDialog";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { useToast } from "@/hooks/useToast";
import { useLimitError } from "@/hooks/useLimitError";
import { useSubscription } from "@/hooks/useSubscription";
import { useDebounce } from "@/hooks/useDebounce";
import { useFeed } from "@/hooks/useFeed";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRefresh } from "@/hooks/useRefresh";
import { useTemplates } from "@/hooks/useTemplates";
import { useDrafts } from "@/hooks/useDrafts";
import { useCustomItems } from "@/hooks/useCustomItems";
import { useCustomItemDelete } from "@/hooks/useCustomItemDelete";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { LinkedStreamTemplateSettings } from "@/components/template/LinkedStreamTemplateSettings";
import { FeedSearch } from "@/components/feed/FeedSearch";
import { CategoryTabs } from "@/components/feed/CategoryTabs";
import { FeedFilter as FeedFilterDropdown } from "@/components/feed/FeedFilter";
import { DraftsSection } from "@/components/feed/DraftsSection";
import { UnifiedFeedLayout } from "@/components/feed/UnifiedFeedLayout";
import { SharedFeedHeader } from "@/components/feed/SharedFeedHeader";
import { FeedContent } from "@/components/feed/FeedContent";
import { FeedItemCard } from "@/components/feed/FeedItemCard";
import { EmptyFeedState } from "@/components/feed/EmptyFeedState";
import { CreateEditionFAB } from "@/components/feed/CreateEditionFAB";
import {
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  Milk,
  Settings2,
  BookOpen,
  Plus,
  ChevronDown,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import type { Stream, ContentItem, Category, SortOption, LinkedStreamFeedItem } from "../../../milkly-backend/src/types";

interface LinkedStream {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  streams: Stream[];
  hasStreamTemplates?: boolean;
  hasStreamCustomItems?: boolean;
}

const BASE_FILTER_TABS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "news", label: "News" },
  { value: "videos", label: "Videos" },
  { value: "social", label: "Social" },
];

const CUSTOM_TAB: { value: Category | "all"; label: string } = { value: "custom", label: "Custom" };

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Clock }[] = [
  { value: "relevancy", label: "Relevant", icon: Star },
  { value: "popularity", label: "Popular", icon: TrendingUp },
  { value: "date", label: "Latest", icon: Clock },
];

const ITEMS_PER_PAGE = 20;

export default function LinkedStreamFeed() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { limitError, showUpgradePrompt, dismissUpgradePrompt, showPromptWithError } = useLimitError();

  // Get referrer from navigation state, default to /linked-streams
  const backTo = (location.state as { from?: string })?.from || "/linked-streams";

  // Use filter persistence hook
  const {
    activeTab: activeFilter,
    feedFilter,
    setActiveTab: setActiveFilter,
    setFeedFilter,
    effectiveFeedFilter,
  } = useFilterPersistence({
    streamType: "linkedStream",
    streamId: id,
    defaultFilter: "lastMilk",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [sortPreference, setSortPreference] = useState<"date" | "relevancy" | "popularity">("relevancy");

  const {
    data: linkedStream,
    isLoading: isLoadingLinkedStream,
    error: linkedStreamError,
  } = useQuery({
    queryKey: ["linked-stream", id],
    queryFn: () => api.get<LinkedStream>(`/linked-streams/${id}`),
    enabled: !!id,
  });

  const { allowedCategories, canUseCustomItems, tierDisplayName } = useSubscription();

  function handleCustomItemTierRestricted() {
    showPromptWithError({
      code: "TIER_RESTRICTION",
      message: "Custom items are restricted for your current plan.",
      limit: "allowCustomItems"
    });
  }

  const {
    hasActiveTemplate,
    hasAnyTemplate,
  } = useTemplates({
    streamType: "linkedStream",
    id,
  });

  const {
    drafts,
    deleteDraft,
    deletingDraftId,
  } = useDrafts({
    streamType: "linkedStream",
    id,
  });

  const { hasCustomItems } = useCustomItems({
    streamType: "linkedStream",
    id,
  });

  // Use custom item delete hook
  const { bulkDelete, getDeletableItems, isDeletingBulk } = useCustomItemDelete({
    streamType: "linkedStream",
    id,
    onSuccess: () => {
      setSelectedItems(new Set());
      setBulkDeleteDialogOpen(false);
    },
  });

  const {
    feedItems,
    totalItems,
    hasMore,
    isLoading: isLoadingFeed,
    isFetchingNextPage,
    error: feedError,
    fetchNextPage,
    refetch: refetchFeed,
  } = useFeed<ContentItem>({
    streamType: "linkedStream",
    id,
    category: activeFilter,
    feedFilter: effectiveFeedFilter,
    search: debouncedSearch,
  });

  const {
    refresh,
    isPending: isRefreshing,
  } = useRefresh({
    streamType: "linkedStream",
    id,
    sortPreference,
    category: activeFilter, // Pass current tab to refresh only that category
    onSuccess: () => {
      setFeedFilter("lastMilk");
    },
  });

  const availableCategories = useMemo(() => {
    if (!linkedStream?.streams) return new Set<Category>();
    const categories = new Set<Category>();
    linkedStream.streams.forEach((stream) => {
      const cats = typeof stream.categories === 'string'
        ? JSON.parse(stream.categories)
        : stream.categories;
      if (Array.isArray(cats)) {
        cats.forEach((cat: Category) => categories.add(cat));
      }
    });
    return categories;
  }, [linkedStream]);

  // Check if any member stream has custom category
  const linkedStreamHasCustomCategory = useMemo(() => {
    return availableCategories.has("custom");
  }, [availableCategories]);

  // Build filter tabs dynamically - add Custom tab if:
  // 1. Any member stream has custom category, OR
  // 2. There are custom items in the linked stream feed
  const filterTabs = useMemo(() => {
    const tabs = [...BASE_FILTER_TABS];
    if (hasCustomItems || linkedStreamHasCustomCategory) {
      tabs.push(CUSTOM_TAB);
    }
    return tabs;
  }, [hasCustomItems, linkedStreamHasCustomCategory]);

  // Custom tab is shown if it's in filterTabs (hasCustomItems or linkedStreamHasCustomCategory)
  const availableTabs = useMemo(() => {
    return filterTabs.filter(
      (tab) =>
        tab.value === "all" ||
        tab.value === "custom" || // Custom tab is always shown if it's in filterTabs
        (availableCategories.has(tab.value as Category) &&
          allowedCategories.includes(tab.value as Category))
    );
  }, [filterTabs, availableCategories, allowedCategories]);

  // Calculate selected custom items for bulk delete
  const selectedCustomItems = useMemo(() => {
    return getDeletableItems(feedItems, selectedItems);
  }, [feedItems, selectedItems, getDeletableItems]);

  const nonCustomSelectedCount = selectedItems.size - selectedCustomItems.length;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/linked-streams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() });
      toast({
        title: "Linked stream deleted",
        description: "Your linked stream has been removed.",
      });
      navigate("/linked-streams", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  function toggleItemSelection(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function handleCreateNewsletter() {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select some content for your newsletter.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/linked-streams/${id}/newsletter/new`, {
      state: { selectedItems: Array.from(selectedItems) },
    });
  }

  function handleCreateEdition() {
    if (selectedItems.size > 0) {
      handleCreateNewsletter();
      return;
    }
    navigate(`/linked-streams/${id}/newsletter/new`, {
      state: { selectedItems: [] },
    });
  }

  function handleCustomItemCreated(_item: ContentItem) {
    // Invalidate ALL feed queries (not just active) to show new custom item in All tab
    queryClient.invalidateQueries({
      queryKey: ["linked-stream", id, "feed"],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({
      queryKey: ["linked-stream", id, "feed", "infinite"],
      refetchType: 'all'
    });
    // Force refetch of custom check to ensure Custom tab appears immediately
    queryClient.refetchQueries({
      queryKey: ["linked-stream", id, "feed", "custom-check"]
    });
    // Switch to Custom tab to show the newly created item
    setActiveFilter("custom");
  }

  function handleDelete() {
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  }

  const milkButtonLabel = activeFilter === "all"
    ? "Milk it"
    : `Milk ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`;

  // Empty state component - depends on context
  // Custom tab is active but no custom items yet
  const showCustomEmptyState = activeFilter === "custom" && !hasCustomItems;

  const emptyState = showCustomEmptyState ? (
    <EmptyFeedState
      icon={<Plus className="h-8 w-8 text-primary" />}
      title="No custom items yet"
      description="Add your own custom content items to include in your newsletters."
      action={
        id ? (
          <AddCustomItemDialog
            streamId={id}
            streamType="linkedStream"
            onItemCreated={handleCustomItemCreated}
            disabled={!canUseCustomItems}
            onTierRestricted={handleCustomItemTierRestricted}
          >
            <Button className="gap-2" disabled={!canUseCustomItems}>
              <Plus className="h-4 w-4" />
              Add Custom Item
            </Button>
          </AddCustomItemDialog>
        ) : null
      }
    />
  ) : (
    <EmptyFeedState
      icon={<Sparkles className="h-8 w-8 text-primary" />}
      title="No content yet"
      description={`Use the "${milkButtonLabel}" button to fetch fresh content.`}
      action={
        <Button onClick={refresh} disabled={isRefreshing} className="gap-2">
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Milk className="h-4 w-4" />
          )}
          {milkButtonLabel}
        </Button>
      }
    />
  );

  if (isLoadingLinkedStream) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient-pro">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (linkedStreamError || !linkedStream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center cream-gradient-pro px-6">
        <p className="text-destructive mb-2">Failed to load linked stream</p>
        <Link to="/linked-streams" className="text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className="gap-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Link to={`/linked-streams/${id}/published`}>
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Published</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View published editions</p>
          </TooltipContent>
        </Tooltip>

        {selectedCustomItems.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={isDeletingBulk}
                className="gap-2 rounded-full text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/15 hover:scale-[1.02] transition-all"
              >
                {isDeletingBulk ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Delete</span>
                ({selectedCustomItems.length})
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete selected custom items</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <LinkedStreamTemplateSettings linkedStreamId={id!} linkedStreamName={linkedStream.name}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </LinkedStreamTemplateSettings>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Template settings</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <AddCustomItemDialog
                streamId={id!}
                streamType="linkedStream"
                onItemCreated={handleCustomItemCreated}
                disabled={!canUseCustomItems}
                onTierRestricted={handleCustomItemTierRestricted}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
                  disabled={!canUseCustomItems}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </AddCustomItemDialog>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add custom item</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateEdition}
              className="gap-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Edition</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create new edition</p>
          </TooltipContent>
        </Tooltip>

        {activeFilter !== "custom" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={refresh}
                    disabled={isRefreshing}
                    className="gap-2 rounded-l-full rounded-r-none bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Milk className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {milkButtonLabel}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {activeFilter === "all"
                      ? "Fetch fresh content"
                      : `Fetch fresh ${activeFilter} content`}
                  </p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        className="rounded-l-none rounded-r-full border-l border-primary-foreground/20 px-2 bg-primary hover:bg-primary/90"
                        disabled={isRefreshing}
                      >
                        {(() => {
                          const CurrentIcon = SORT_OPTIONS.find(o => o.value === sortPreference)?.icon ?? Star;
                          return <CurrentIcon className="h-3.5 w-3.5" />;
                        })()}
                        <ChevronDown className="h-3 w-3 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort: {SORT_OPTIONS.find(o => o.value === sortPreference)?.label ?? "Relevant"}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-[140px] p-1 bg-white dark:bg-black/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-lg">
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = sortPreference === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setSortPreference(option.value)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer ${
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-primary/5 focus:bg-primary/5"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                        {isActive ? <span className="ml-auto text-[10px] font-bold">✓</span> : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px] p-1 bg-white dark:bg-black/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-lg">
          <DropdownMenuItem 
            onClick={() => setEditDialogOpen(true)} 
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-primary/5 focus:bg-primary/5"
          >
            <Edit2 className="h-4 w-4" />
            Edit Linked Stream
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-primary/10" />
          <DropdownMenuItem
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer text-destructive hover:bg-destructive/5 focus:bg-destructive/5 focus:text-destructive"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete Linked Stream
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const headerBottomBar = (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
        <CategoryTabs
          tabs={availableTabs}
          activeTab={activeFilter}
          onTabChange={(value) => setActiveFilter(value as Category | "all")}
        />

        <div className="flex gap-2 shrink-0">
          <FeedFilterDropdown
            type="feedFilter"
            value={activeFilter === "custom" ? "all" : feedFilter}
            onChange={(v) => setFeedFilter(v as FeedFilter)}
            disabled={activeFilter === "custom"}
          />
        </div>
      </div>
      
      <div className="w-full sm:flex-1 min-w-0">
         {(totalItems > 0 || debouncedSearch) && (
            <div className="relative group">
              <FeedSearch
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search combined feed..."
                debouncedValue={debouncedSearch}
                totalResults={totalItems}
                className="w-full dark:bg-black/20 border-primary/5 hover:border-primary/20 focus:border-primary/30 h-9 transition-all"
              />
            </div>
         )}
      </div>
    </div>
  );

  return (
    <UnifiedFeedLayout
      header={
        <SharedFeedHeader
          title={linkedStream.name}
          description={linkedStream.description}
          backTo={backTo}
          badges={{
            tierName: tierDisplayName,
            hasTemplate: hasActiveTemplate || linkedStream?.hasStreamTemplates,
            hasCustom: hasCustomItems || linkedStream?.hasStreamCustomItems
          }}
          isLinkedStream={true}
          memberStreams={linkedStream.streams.map(s => ({ id: s.id, name: s.name }))}
          actions={headerActions}
          bottomBar={headerBottomBar}
        />
      }
    >
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete linked stream?"
        description={
          <div className="space-y-2">
            <span className="block">
              This will permanently delete "{linkedStream.name}". The original
              streams and their content will not be affected.
            </span>
            {(hasCustomItems || hasAnyTemplate) && (
              <span className="block text-destructive font-medium">
                Warning: This linked stream has{" "}
                {hasCustomItems && hasAnyTemplate
                  ? "custom items and templates"
                  : hasCustomItems
                  ? "custom items"
                  : "templates"}{" "}
                that will be permanently deleted.
              </span>
            )}
          </div>
        }
        onConfirm={confirmDelete}
      />

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete custom items?"
        description={
          <div className="space-y-2">
            <span className="block">
              This will permanently delete {selectedCustomItems.length} custom item
              {selectedCustomItems.length === 1 ? "" : "s"}. This action cannot be undone.
            </span>
            {(() => {
              const itemsFromMemberStreams = selectedCustomItems.filter(
                (item) => "streamId" in item && item.streamId
              );
              if (itemsFromMemberStreams.length > 0) {
                return (
                  <span className="block text-amber-500">
                    Note: {itemsFromMemberStreams.length} item
                    {itemsFromMemberStreams.length === 1 ? " belongs" : "s belong"} to member streams and will be removed from all linked streams that include those streams.
                  </span>
                );
              }
              return null;
            })()}
            {nonCustomSelectedCount > 0 && (
              <span className="block text-muted-foreground">
                Note: {nonCustomSelectedCount} non-custom item
                {nonCustomSelectedCount === 1 ? "" : "s"} will not be deleted.
              </span>
            )}
          </div>
        }
        onConfirm={() => {
          bulkDelete(
            selectedCustomItems.map((item) => ({
              itemId: item.id,
              sourceStreamId: "streamId" in item ? (item as LinkedStreamFeedItem).streamId : undefined,
            }))
          );
        }}
      />

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={dismissUpgradePrompt}
        limitError={limitError}
      />

      <CreateLinkedStreamDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editData={{
          id: linkedStream.id,
          name: linkedStream.name,
          description: linkedStream.description,
          streamIds: linkedStream.streams.map((s) => s.id),
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["linked-stream", id] });
        }}
      />

      <DraftsSection
        drafts={drafts}
        isOpen={isDraftsOpen}
        onOpenChange={setIsDraftsOpen}
        onDraftClick={() => {}}
        onDeleteDraft={deleteDraft}
        deletingDraftId={deletingDraftId}
        linkedStreamId={id}
      />

      <FeedContent<LinkedStreamFeedItem>
        items={feedItems as LinkedStreamFeedItem[]}
        totalItems={totalItems}
        isLoading={isLoadingFeed}
        isFetchingNextPage={isFetchingNextPage}
        hasMore={hasMore}
        error={feedError}
        onRetry={refetchFeed}
        onLoadMore={fetchNextPage}
        selectedItems={selectedItems}
        onToggleSelect={toggleItemSelection}
        emptyState={emptyState}
        filterLabel={feedFilter === "lastMilk" ? "(last milk)" : ""}
        itemsPerPage={ITEMS_PER_PAGE}
        renderItem={(item, isSelected, onToggle) => (
          <FeedItemCard
            key={item.id}
            item={item}
            isSelected={isSelected}
            onToggleSelect={onToggle}
            linkedStreamId={id}
            onItemUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["linked-stream", id, "feed"] });
            }}
            onItemDeleted={() => {
              queryClient.resetQueries({ queryKey: ["linked-stream", id, "feed"] });
            }}
          />
        )}
      />

      <CreateEditionFAB
        selectedCount={selectedItems.size}
        onClick={handleCreateNewsletter}
        onClear={() => setSelectedItems(new Set())}
      />
    </UnifiedFeedLayout>
  );
}
