import { useState, useCallback, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { isLimitError, getLimitErrorData, type LimitError } from "@/lib/Api";

/**
 * Format a credit-based error message with remaining credits info
 */
function formatCreditMessage(error: LimitError): string {
  if (error.limit === "aiCredits" && error.cost !== undefined) {
    const remaining =
      error.max !== undefined && error.current !== undefined
        ? error.max - error.current
        : 0;
    return `This requires ${error.cost} credits. You have ${remaining} remaining.`;
  }
  return error.message;
}

/**
 * Format the reset time as a human-readable string
 */
function formatResetTime(resetAt: string): string {
  const resetDate = new Date(resetAt);
  return formatDistanceToNow(resetDate, { addSuffix: true });
}

interface UseLimitErrorReturn {
  /** Whether the current error is a limit error */
  isLimitError: boolean;
  /** The parsed limit error data, or null if not a limit error */
  limitError: LimitError | null;
  /** Whether to show the upgrade prompt modal */
  showUpgradePrompt: boolean;
  /** Function to dismiss the upgrade prompt */
  dismissUpgradePrompt: () => void;
  /** Function to check an error and show prompt if it's a limit error */
  handleError: (error: unknown) => boolean;
  /** Function to manually show the upgrade prompt with error data */
  showPromptWithError: (error: LimitError) => void;
  /** Reset the error state */
  reset: () => void;
  /** The credit cost for this operation, if applicable */
  creditCost: number | undefined;
  /** ISO date string when limits reset */
  resetAt: string | undefined;
  /** Human-readable formatted reset time */
  formattedResetTime: string | undefined;
  /** Formatted credit message with remaining credits */
  formattedCreditMessage: string | undefined;
}

/**
 * Hook to detect and handle limit errors from API responses.
 * Works well with React Query error states.
 *
 * @example
 * ```tsx
 * const { limitError, showUpgradePrompt, dismissUpgradePrompt, handleError } = useLimitError();
 *
 * const mutation = useMutation({
 *   mutationFn: createStream,
 *   onError: handleError,
 * });
 *
 * return (
 *   <>
 *     <UpgradePrompt
 *       open={showUpgradePrompt}
 *       onClose={dismissUpgradePrompt}
 *       limitError={limitError}
 *     />
 *     ...
 *   </>
 * );
 * ```
 */
export function useLimitError(): UseLimitErrorReturn {
  const [limitError, setLimitError] = useState<LimitError | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const dismissUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
  }, []);

  const handleError = useCallback((error: unknown): boolean => {
    const errorData = getLimitErrorData(error);
    if (errorData) {
      setLimitError(errorData);
      setShowUpgradePrompt(true);
      return true;
    }
    return false;
  }, []);

  const showPromptWithError = useCallback((error: LimitError) => {
    setLimitError(error);
    setShowUpgradePrompt(true);
  }, []);

  const reset = useCallback(() => {
    setLimitError(null);
    setShowUpgradePrompt(false);
  }, []);

  const isLimitErrorState = useMemo(() => limitError !== null, [limitError]);

  const creditCost = limitError?.cost;
  const resetAt = limitError?.resetAt;
  const formattedResetTime = useMemo(
    () => (resetAt ? formatResetTime(resetAt) : undefined),
    [resetAt]
  );
  const formattedCreditMessage = useMemo(
    () => (limitError ? formatCreditMessage(limitError) : undefined),
    [limitError]
  );

  return {
    isLimitError: isLimitErrorState,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError,
    showPromptWithError,
    reset,
    creditCost,
    resetAt,
    formattedResetTime,
    formattedCreditMessage,
  };
}

/**
 * Helper to check a React Query error and extract limit error data
 */
export function checkQueryError(error: unknown): LimitError | null {
  if (isLimitError(error)) {
    return getLimitErrorData(error);
  }
  return null;
}
