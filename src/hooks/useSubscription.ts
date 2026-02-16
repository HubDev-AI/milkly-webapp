import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import type { AvailableCategoriesResponse, TierName, Category } from "../../../milkly-backend/src/types";

// ============================================================================
// Types
// ============================================================================

export interface Subscription {
  id: string;
  tier: TierName;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Usage {
  milkCount: number;
  generateCount: number;
  publishCount: number;
  emailCount: number;
  streamCount: number;
  periodStart: string;
  periodEnd: string;
}

export interface Limits {
  maxStreams: number;
  maxTemplatesPerStream: number;
  milkPerWeek: number;
  generatesPerWeek: number;
  publishPerWeek: number;
  emailsPerWeek: number;
  maxEmailSubscribers: number;
  maxNewsletterItems: number;
  linkedStreams: boolean;
  allowCustomItems: boolean;
}

export interface SubscriptionData {
  subscription: Subscription;
  usage: Usage;
  limits: Limits;
  features: string[];
}

// ============================================================================
// Hook
// ============================================================================

interface UseSubscriptionOptions {
  enabled?: boolean;
}

interface UseSubscriptionReturn {
  // Data
  subscription: Subscription | undefined;
  usage: Usage | undefined;
  limits: Limits | undefined;
  features: string[];
  tier: TierName;
  allowedCategories: Category[];
  allCategories: Category[];

  // Loading states
  isLoading: boolean;
  isLoadingCategories: boolean;

  // Derived states
  isProfessional: boolean;
  isMastery: boolean;
  isEssential: boolean;
  tierDisplayName: string;
  canUseLinkedStreams: boolean;
  canUseCustomItems: boolean;

  // Limit checks
  hasExceededMilkLimit: boolean;
  hasExceededGenerateLimit: boolean;
  hasExceededPublishLimit: boolean;
  hasExceededEmailLimit: boolean;
  hasExceededStreamLimit: boolean;

  // Category helpers
  isCategoryAllowed: (category: Category) => boolean;

  // Actions
  invalidateAll: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

export function useSubscription(options: UseSubscriptionOptions = {}): UseSubscriptionReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  // Main subscription query
  const {
    data: subscriptionData,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.subscription.all,
    queryFn: () => api.get<SubscriptionData>("/subscription"),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Available categories query
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
  } = useQuery({
    queryKey: queryKeys.streams.availableCategories(),
    queryFn: () => api.get<AvailableCategoriesResponse>("/streams/available-categories"),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Extract data
  const subscription = subscriptionData?.subscription;
  const usage = subscriptionData?.usage;
  const limits = subscriptionData?.limits;
  const features = subscriptionData?.features ?? [];

  // Tier info
  const tier: TierName = subscription?.tier ?? "essential";
  const isEssential = tier === "essential";
  const isProfessional = tier === "professional";
  const isMastery = tier === "mastery";

  const TIER_DISPLAY_NAMES: Record<TierName, string> = {
    essential: "Essential",
    professional: "Professional",
    mastery: "Mastery",
  };
  const tierDisplayName = TIER_DISPLAY_NAMES[tier];

  // Feature checks
  const canUseLinkedStreams = isProfessional || isMastery;
  const canUseCustomItems = true; // Custom items available to all tiers

  // Categories
  const allowedCategories = useMemo(
    () => categoriesData?.allowedCategories ?? ["news"],
    [categoriesData?.allowedCategories]
  );
  const allCategories = useMemo(
    () => categoriesData?.allCategories ?? ["news", "videos", "social", "custom"],
    [categoriesData?.allCategories]
  );

  // Category helper
  const isCategoryAllowed = useCallback(
    (category: Category) => allowedCategories.includes(category),
    [allowedCategories]
  );

  // Limit checks (returns true if limit exceeded)
  const checkLimitExceeded = (current: number | undefined, max: number | undefined): boolean => {
    if (current === undefined || max === undefined) return false;
    if (max === -1) return false; // Unlimited
    return current >= max;
  };

  const hasExceededMilkLimit = checkLimitExceeded(usage?.milkCount, limits?.milkPerWeek);
  const hasExceededGenerateLimit = checkLimitExceeded(usage?.generateCount, limits?.generatesPerWeek);
  const hasExceededPublishLimit = checkLimitExceeded(usage?.publishCount, limits?.publishPerWeek);
  const hasExceededEmailLimit = checkLimitExceeded(usage?.emailCount, limits?.emailsPerWeek);
  const hasExceededStreamLimit = checkLimitExceeded(usage?.streamCount, limits?.maxStreams);

  // Actions
  const invalidateAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.details() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.availableCategories() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() }),
    ]);
  }, [queryClient]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.subscription.all }),
      queryClient.refetchQueries({ queryKey: queryKeys.streams.availableCategories() }),
    ]);
  }, [queryClient]);

  return {
    // Data
    subscription,
    usage,
    limits,
    features,
    tier,
    allowedCategories,
    allCategories,

    // Loading states
    isLoading,
    isLoadingCategories,

    // Derived states
    isProfessional,
    isMastery,
    isEssential,
    tierDisplayName,
    canUseLinkedStreams,
    canUseCustomItems,

    // Limit checks
    hasExceededMilkLimit,
    hasExceededGenerateLimit,
    hasExceededPublishLimit,
    hasExceededEmailLimit,
    hasExceededStreamLimit,

    // Category helpers
    isCategoryAllowed,

    // Actions
    invalidateAll,
    refetchAll,
  };
}
