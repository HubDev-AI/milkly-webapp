import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
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
import { useFeed, type FeedFilter } from "@/hooks/useFeed";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRefresh } from "@/hooks/useRefresh";
import { useTemplates } from "@/hooks/useTemplates";
import { useDrafts } from "@/hooks/useDrafts";
import { useCustomItems } from "@/hooks/useCustomItems";
import { useCustomItemDelete } from "@/hooks/useCustomItemDelete";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CreditsIndicator } from "@/components/CreditsIndicator";
import { TemplateSettings } from "@/components/template/TemplateSettings";
import { FeedSearch } from "@/components/feed/FeedSearch";
import { CategoryTabs } from "@/components/feed/CategoryTabs";
import { FeedFilter as FeedFilterDropdown } from "@/components/feed/FeedFilter";
import { DraftsSection } from "@/components/feed/DraftsSection";
import { FeedContent } from "@/components/feed/FeedContent";
import { UnifiedFeedLayout } from "@/components/feed/UnifiedFeedLayout";
import { SharedFeedHeader } from "@/components/feed/SharedFeedHeader";
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
  ChevronDown,
  Plus,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react";
import type { Stream, ContentItem, Category, SortOption } from "../../../milkly-backend/src/types";

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

export default function StreamFeed() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { limitError, showUpgradePrompt, dismissUpgradePrompt, showPromptWithError } = useLimitError();

  // Use filter persistence hook
  const {
    activeTab: activeFilter,
    feedFilter,
    setActiveTab: setActiveFilter,
    setFeedFilter,
    effectiveFeedFilter,
  } = useFilterPersistence({
    streamType: "stream",
    streamId: id,
    defaultFilter: "lastMilk",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Fetch stream details
  const {
    data: stream,
    isLoading: isLoadingStream,
    error: streamError,
  } = useQuery({
    queryKey: ["streams", id],
    queryFn: () => api.get<Stream>(`/streams/${id}`),
    enabled: !!id,
  });

  // Use centralized subscription hook for tier data
  const { allowedCategories, canUseCustomItems, tierDisplayName, isEssential } = useSubscription();

  function handleCustomItemTierRestricted() {
    showPromptWithError({
      code: "TIER_RESTRICTION",
      message: "Custom items are restricted for your current plan.",
      limit: "allowCustomItems"
    });
  }

  // Check if this is a custom-only stream (no milking available)
  const isCustomOnlyStream = useMemo(() => {
    if (!stream) return false;
    return stream.categories.length === 1 && stream.categories[0] === "custom";
  }, [stream]);

  // Use shared templates hook
  const {
    hasActiveTemplate,
    hasAnyTemplate,
  } = useTemplates({
    streamType: "stream",
    id,
  });

  // Use shared drafts hook
  const {
    drafts,
    deleteDraft,
    deletingDraftId,
  } = useDrafts({
    streamType: "stream",
    id,
  });

  // Use shared custom items hook
  const { hasCustomItems } = useCustomItems({
    streamType: "stream",
    id,
  });

  // Use custom item delete hook
  const { bulkDelete, getDeletableItems, isDeletingBulk } = useCustomItemDelete({
    streamType: "stream",
    id,
    onSuccess: () => {
      setSelectedItems(new Set());
      setBulkDeleteDialogOpen(false);
    },
  });

  // Use shared feed hook
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
    streamType: "stream",
    id,
    category: activeFilter,
    feedFilter: effectiveFeedFilter,
    search: debouncedSearch,
  });

  // Use shared refresh hook
  const {
    refresh,
    isPending: isRefreshing,
  } = useRefresh({
    streamType: "stream",
    id,
    sortPreference: stream?.sortPreference ?? "relevancy",
    category: activeFilter, // Pass current tab to refresh only that category
    onSuccess: () => {
      setFeedFilter("lastMilk");
    },
  });

  // Check if custom category is part of the stream
  const streamHasCustomCategory = useMemo(() => {
    return stream?.categories.includes("custom") ?? false;
  }, [stream?.categories]);

  // Build filter tabs dynamically - add Custom tab if:
  // 1. Custom category is part of the stream categories, OR
  // 2. There are custom items in the feed
  const filterTabs = useMemo(() => {
    const tabs = [...BASE_FILTER_TABS];
    if (hasCustomItems || streamHasCustomCategory) {
      tabs.push(CUSTOM_TAB);
    }
    return tabs;
  }, [hasCustomItems, streamHasCustomCategory]);

  // Filter tabs by stream categories and allowed categories
  // Custom tab is shown if it's in filterTabs (hasCustomItems or streamHasCustomCategory)
  const availableTabs = useMemo(() => {
    return filterTabs.filter(
      (tab) =>
        tab.value === "all" ||
        tab.value === "custom" || // Custom tab is always shown if it's in filterTabs
        (stream?.categories.includes(tab.value as Category) &&
          allowedCategories.includes(tab.value as Category))
    );
  }, [filterTabs, stream?.categories, allowedCategories]);

  // Calculate selected custom items for bulk delete
  const selectedCustomItems = useMemo(() => {
    return getDeletableItems(feedItems, selectedItems);
  }, [feedItems, selectedItems, getDeletableItems]);

  const nonCustomSelectedCount = selectedItems.size - selectedCustomItems.length;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/streams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.all });
      toast({
        title: "Stream deleted",
        description: "Your stream has been removed.",
      });
      navigate("/", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update sort preference mutation
  const updateSortMutation = useMutation({
    mutationFn: (sortPreference: SortOption) =>
      api.patch<Stream>(`/streams/${id}`, { sortPreference }),
    onSuccess: (updatedStream) => {
      if (id) {
        queryClient.setQueryData(queryKeys.streams.detail(id), updatedStream);
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.detail(id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.all });
      const sortLabel = SORT_OPTIONS.find(o => o.value === updatedStream.sortPreference)?.label ?? updatedStream.sortPreference;
      toast({
        title: "Sort order updated",
        description: `Content will be sorted by "${sortLabel}" when milking.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update sort order",
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

    navigate(`/streams/${id}/newsletter/new`, {
      state: { selectedItems: Array.from(selectedItems) },
    });
  }

  function handleCreateEdition() {
    if (selectedItems.size > 0) {
      handleCreateNewsletter();
      return;
    }
    navigate(`/streams/${id}/newsletter/new`, {
      state: { selectedItems: [] },
    });
  }

  function handleCustomItemCreated(_item: ContentItem) {
    // Invalidate ALL feed queries (not just active) to show new custom item in All tab
    queryClient.invalidateQueries({
      queryKey: ["streams", id, "feed"],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({
      queryKey: ["streams", id, "feed", "infinite"],
      refetchType: 'all'
    });
    // Force refetch of custom check to ensure Custom tab appears immediately
    queryClient.refetchQueries({
      queryKey: ["streams", id, "feed", "custom-check"]
    });
    // Switch to Custom tab to show the newly created item
    setActiveFilter("custom");
  }

  const milkButtonLabel = activeFilter === "all"
    ? "Milk it"
    : `Milk ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`;

  // Empty state component - depends on context
  // Custom-only stream (no milking available) or Custom tab with no items
  const showCustomEmptyState = isCustomOnlyStream || (activeFilter === "custom" && !hasCustomItems);

  const emptyState = showCustomEmptyState ? (
    <EmptyFeedState
      icon={<Plus className="h-8 w-8 text-primary" />}
      title="No custom items yet"
      description={isCustomOnlyStream
        ? "This stream is for custom content only. Add your own items manually."
        : "Add your own custom content items to include in your newsletters."
      }
      action={
        id ? (
          <AddCustomItemDialog
            streamId={id}
            streamType="stream"
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

  if (isLoadingStream) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient-pro">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (streamError || !stream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center cream-gradient-pro px-6">
        <p className="text-destructive mb-2">Failed to load stream</p>
        <Link to="/" className="text-primary hover:underline">
          Go back home
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
              <Link to={`/streams/${id}/published`}>
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
              <TemplateSettings streamId={id!} streamName={stream.name}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-primary/20 text-foreground hover:text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TemplateSettings>
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
                streamType="stream"
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

        {!isCustomOnlyStream && activeFilter !== "custom" && (
          <div className="flex items-center gap-2">
            <CreditsIndicator type="refreshes" />
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
                  <p>Fetch fresh content</p>
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
                        disabled={updateSortMutation.isPending}
                      >
                        {updateSortMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          (() => {
                            const CurrentIcon = SORT_OPTIONS.find(o => o.value === stream.sortPreference)?.icon ?? Star;
                            return <CurrentIcon className="h-3.5 w-3.5" />;
                          })()
                        )}
                        <ChevronDown className="h-3 w-3 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sort: {SORT_OPTIONS.find(o => o.value === stream.sortPreference)?.label ?? "Relevant"}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-[140px] p-1 bg-white dark:bg-black/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-lg">
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = stream.sortPreference === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => updateSortMutation.mutate(option.value)}
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
        <DropdownMenuContent align="end" className="min-w-[160px] p-1 bg-white dark:bg-black/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-lg">
          <DropdownMenuItem 
            onClick={() => navigate(`/streams/${id}/edit`)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-primary/5 focus:bg-primary/5"
          >
            <Edit2 className="h-4 w-4" />
            Edit Stream
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-primary/10" />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer text-destructive hover:bg-destructive/5 focus:bg-destructive/5 focus:text-destructive"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete Stream
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
            value={isCustomOnlyStream || activeFilter === "custom" ? "all" : feedFilter}
            onChange={(v) => setFeedFilter(v as FeedFilter)}
            disabled={isCustomOnlyStream || activeFilter === "custom"}
          />
        </div>
      </div>
      
      <div className="w-full sm:flex-1 min-w-0">
         {(totalItems > 0 || debouncedSearch) && (
            <div className="relative group">
              <FeedSearch
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search..."
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
          title={stream.name}
          description={stream.description}
          backTo="/"
          badges={{
            tierName: isEssential ? null : tierDisplayName,
            hasTemplate: hasActiveTemplate || hasAnyTemplate,
            hasCustom: hasCustomItems
          }}
          actions={headerActions}
          bottomBar={headerBottomBar}
        />
      }
    >
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete stream?"
        description={
          <div className="space-y-2">
            <p>
              This will permanently delete "{stream.name}" and all its content.
            </p>
            {(hasCustomItems || hasAnyTemplate) && (
              <p className="text-destructive font-medium">
                Warning: This stream has {hasCustomItems && hasAnyTemplate ? "custom items and templates" : hasCustomItems ? "custom items" : "templates"} that will be permanently deleted.
              </p>
            )}
          </div>
        }
        onConfirm={() => {
          deleteMutation.mutate();
          setDeleteDialogOpen(false);
        }}
      />

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete custom items?"
        description={
          <div className="space-y-2">
            <p>
              This will permanently delete {selectedCustomItems.length} custom item
              {selectedCustomItems.length === 1 ? "" : "s"}. This action cannot be undone.
            </p>
            {nonCustomSelectedCount > 0 && (
              <p className="text-muted-foreground">
                Note: {nonCustomSelectedCount} non-custom item
                {nonCustomSelectedCount === 1 ? "" : "s"} will not be deleted.
              </p>
            )}
          </div>
        }
        onConfirm={() => {
          bulkDelete(
            selectedCustomItems.map((item) => ({
              itemId: item.id,
            }))
          );
        }}
      />

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={dismissUpgradePrompt}
        limitError={limitError}
      />

      <DraftsSection
        drafts={drafts}
        isOpen={isDraftsOpen}
        onOpenChange={setIsDraftsOpen}
        onDraftClick={() => {}}
        onDeleteDraft={deleteDraft}
        deletingDraftId={deletingDraftId}
        streamId={id ?? ""}
      />

      <FeedContent<ContentItem>
        items={feedItems}
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
            streamId={id}
            onItemUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["streams", id, "feed"] });
            }}
            onItemDeleted={() => {
              queryClient.resetQueries({ queryKey: ["streams", id, "feed"] });
            }}
          />
        )}
      />

      {/* FAB - Create Edition */}
      <CreateEditionFAB
        selectedCount={selectedItems.size}
        onClick={handleCreateNewsletter}
        onClear={() => setSelectedItems(new Set())}
      />
    </UnifiedFeedLayout>
  );
}
