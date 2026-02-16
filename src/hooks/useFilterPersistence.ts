import { useState, useEffect, useCallback } from "react";
import type { FeedFilter } from "./useFeed";
import type { Category } from "../../../milkly-backend/src/types";

const STORAGE_KEY_PREFIX = "milkly_filter";

interface UseFilterPersistenceOptions {
  streamType: "stream" | "linkedStream";
  streamId: string | undefined;
  defaultFilter?: FeedFilter;
}

interface UseFilterPersistenceReturn {
  activeTab: Category | "all";
  feedFilter: FeedFilter;
  setActiveTab: (tab: Category | "all") => void;
  setFeedFilter: (filter: FeedFilter) => void;
  effectiveFeedFilter: FeedFilter;
}

/**
 * Custom hook for persisting filter state by stream ID and tab.
 *
 * - Stores filter preferences in localStorage per stream and tab
 * - Custom tab always uses "all" filter (no batch IDs)
 * - Restores filter when switching back to a tab
 *
 * Storage keys: `milkly_filter_{streamType}_{streamId}_{tab}`
 */
export function useFilterPersistence({
  streamType,
  streamId,
  defaultFilter = "lastMilk",
}: UseFilterPersistenceOptions): UseFilterPersistenceReturn {
  const [activeTab, setActiveTabState] = useState<Category | "all">("all");
  const [feedFilter, setFeedFilterState] = useState<FeedFilter>(defaultFilter);

  // Build storage key for the current stream and tab
  const getStorageKey = useCallback(
    (tab: Category | "all") => {
      if (!streamId) return null;
      return `${STORAGE_KEY_PREFIX}_${streamType}_${streamId}_${tab}`;
    },
    [streamType, streamId]
  );

  // Load filter from localStorage when tab changes
  const loadFilterForTab = useCallback(
    (tab: Category | "all") => {
      // Custom tab always uses "all" filter
      if (tab === "custom") {
        return "all" as FeedFilter;
      }

      const key = getStorageKey(tab);
      if (!key) return defaultFilter;

      try {
        const stored = localStorage.getItem(key);
        if (stored === "all" || stored === "lastMilk") {
          return stored as FeedFilter;
        }
      } catch {
        // localStorage might be unavailable
      }
      return defaultFilter;
    },
    [getStorageKey, defaultFilter]
  );

  // Save filter to localStorage
  const saveFilterForTab = useCallback(
    (tab: Category | "all", filter: FeedFilter) => {
      // Don't save for custom tab (always uses "all")
      if (tab === "custom") return;

      const key = getStorageKey(tab);
      if (!key) return;

      try {
        localStorage.setItem(key, filter);
      } catch {
        // localStorage might be unavailable
      }
    },
    [getStorageKey]
  );

  // Handle tab change - load saved filter for new tab
  const setActiveTab = useCallback(
    (tab: Category | "all") => {
      // Save current filter before switching
      if (activeTab !== "custom") {
        saveFilterForTab(activeTab, feedFilter);
      }

      // Set new tab
      setActiveTabState(tab);

      // Load filter for new tab
      const newFilter = loadFilterForTab(tab);
      setFeedFilterState(newFilter);
    },
    [activeTab, feedFilter, saveFilterForTab, loadFilterForTab]
  );

  // Handle filter change - save to localStorage
  const setFeedFilter = useCallback(
    (filter: FeedFilter) => {
      setFeedFilterState(filter);
      saveFilterForTab(activeTab, filter);
    },
    [activeTab, saveFilterForTab]
  );

  // Load initial filter for the default tab on mount
  useEffect(() => {
    if (streamId) {
      const initialFilter = loadFilterForTab(activeTab);
      setFeedFilterState(initialFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only run on mount/streamId change
  }, [streamId]);

  // Custom tab always uses "all" filter, regardless of stored value
  const effectiveFeedFilter = activeTab === "custom" ? "all" : feedFilter;

  return {
    activeTab,
    feedFilter,
    setActiveTab,
    setFeedFilter,
    effectiveFeedFilter,
  };
}
