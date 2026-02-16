import { type ReactNode, memo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { FeedItemCard } from "./FeedItemCard";
import { FeedLoadingSkeleton } from "./FeedLoadingSkeleton";
import { ChevronDown, Loader2 } from "lucide-react";
import type { ContentItem } from "../../../../milkly-backend/src/types";

interface FeedItemWrapperProps<T extends ContentItem> {
  item: T;
  isSelected: boolean;
  onToggleSelect: (itemId: string) => void;
}

const FeedItemWrapper = memo(function FeedItemWrapper<T extends ContentItem>({
  item,
  isSelected,
  onToggleSelect,
}: FeedItemWrapperProps<T>) {
  const handleToggleSelect = useCallback(() => {
    onToggleSelect(item.id);
  }, [onToggleSelect, item.id]);

  return (
    <FeedItemCard
      item={item}
      isSelected={isSelected}
      onToggleSelect={handleToggleSelect}
    />
  );
}) as <T extends ContentItem>(props: FeedItemWrapperProps<T>) => JSX.Element;

interface FeedContentProps<T extends ContentItem> {
  items: T[];
  totalItems: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  error: Error | null;
  onRetry: () => void;
  onLoadMore: () => void;
  selectedItems: Set<string>;
  onToggleSelect: (itemId: string) => void;
  renderItem?: (item: T, isSelected: boolean, onToggle: () => void) => ReactNode;
  emptyState?: ReactNode;
  filterLabel?: string;
  itemsPerPage?: number;
}

export function FeedContent<T extends ContentItem>({
  items,
  totalItems,
  isLoading,
  isFetchingNextPage,
  hasMore,
  error,
  onRetry,
  onLoadMore,
  selectedItems,
  onToggleSelect,
  renderItem,
  emptyState,
  filterLabel,
  itemsPerPage = 20,
}: FeedContentProps<T>) {
  if (isLoading && !isFetchingNextPage) {
    return <FeedLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load content</p>
        <Button variant="link" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {totalItems > 0 ? (
        <div className="flex items-center gap-4 mb-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="h-px bg-primary/20 flex-1" />
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-foreground/60">
            {filterLabel ? filterLabel.replace(/[()]/g, '') : 'All Items'} • {items.length} / {totalItems}
          </span>
          <div className="h-px bg-primary/20 flex-1" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
        {items.map((item) => {
          const isSelected = selectedItems.has(item.id);

          if (renderItem) {
            const onToggle = () => onToggleSelect(item.id);
            return renderItem(item, isSelected, onToggle);
          }

          return (
            <FeedItemWrapper
              key={item.id}
              item={item}
              isSelected={isSelected}
              onToggleSelect={onToggleSelect}
            />
          );
        })}
      </div>

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load More
          </Button>
        </div>
      ) : totalItems > itemsPerPage ? (
        <p className="text-center text-sm text-muted-foreground mt-6">
          You've reached the end
        </p>
      ) : null}
    </>
  );
}
