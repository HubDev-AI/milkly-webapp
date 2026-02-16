import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { formatDistanceToNow } from "date-fns";

interface UsageData {
  tier: "essential" | "professional" | "mastery";
  freeTierRenewalEnabled: boolean;
  aiCredits: {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
  };
  refreshes: {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
  };
}

interface UsageMetric {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export interface UseUsageReturn {
  tier: "essential" | "professional" | "mastery" | undefined;
  aiCredits: UsageMetric;
  refreshes: UsageMetric;
  resetTime: string | undefined;
  showResetTime: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useUsage(): UseUsageReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.account.usage(),
    queryFn: () => api.get<UsageData>("/account/usage"),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const aiCredits = data?.aiCredits;
  const refreshes = data?.refreshes;

  const aiCreditsRemaining = aiCredits
    ? aiCredits.limit === -1
      ? Infinity
      : aiCredits.limit - aiCredits.used
    : undefined;

  const refreshesRemaining = refreshes
    ? refreshes.limit === -1
      ? Infinity
      : refreshes.limit - refreshes.used
    : undefined;

  const resetTime = aiCredits?.periodEnd
    ? formatDistanceToNow(new Date(aiCredits.periodEnd), { addSuffix: true })
    : undefined;

  // Show reset time for paid tiers, or for free tier when renewal is enabled
  const showResetTime =
    data?.tier !== "essential" || (data?.freeTierRenewalEnabled ?? true);

  return {
    tier: data?.tier,
    aiCredits: {
      used: aiCredits?.used ?? 0,
      limit: aiCredits?.limit ?? 0,
      remaining: aiCreditsRemaining ?? 0,
      isUnlimited: aiCredits?.limit === -1,
    },
    refreshes: {
      used: refreshes?.used ?? 0,
      limit: refreshes?.limit ?? 0,
      remaining: refreshesRemaining ?? 0,
      isUnlimited: refreshes?.limit === -1,
    },
    resetTime,
    showResetTime,
    isLoading,
    error,
    refetch,
  };
}
