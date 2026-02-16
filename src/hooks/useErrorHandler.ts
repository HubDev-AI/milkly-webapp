import { useCallback } from "react";
import { useToast } from "./useToast";
import { useLimitError } from "./useLimitError";
import { classifyError, ERROR_MESSAGES, getErrorMessage, type ErrorType } from "@/lib/errors";

interface HandleErrorOptions {
  /** Custom title for the toast (overrides default) */
  title?: string;
  /** Custom description for the toast (overrides default) */
  description?: string;
  /** Skip automatic toast - return classified error for manual handling */
  silent?: boolean;
  /** Override default message for specific error types */
  messages?: Partial<Record<ErrorType, { title?: string; description?: string }>>;
  /** Callback after error is handled */
  onError?: (type: ErrorType) => void;
}

interface UseErrorHandlerReturn {
  /**
   * Handle an error with automatic toast and limit error detection
   * @param error - The error to handle
   * @param options - Optional customization
   * @returns The classified error type
   */
  handleError: (error: unknown, options?: HandleErrorOptions) => ErrorType;

  /**
   * Handle a Better Auth result.error object
   * Converts Better Auth error format to standard handling
   * @param resultError - The error object from Better Auth result.error
   * @param fallbackMessage - Message to use if error has no message
   * @returns The classified error type
   */
  handleAuthError: (
    resultError: { status?: number; code?: string; message?: string } | null | undefined,
    fallbackMessage?: string,
    options?: HandleErrorOptions
  ) => ErrorType | null;

  // Expose limit error state for UpgradePrompt integration
  limitError: ReturnType<typeof useLimitError>["limitError"];
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
}

/**
 * Unified error handling hook for API errors
 *
 * Handles:
 * - Rate limiting (429) with user-friendly message
 * - Tier/subscription limits (delegates to useLimitError + UpgradePrompt)
 * - Auth errors (401, 403)
 * - Not found (404)
 * - Server errors (5xx)
 * - Network errors
 * - Better Auth error format
 *
 * @example
 * ```tsx
 * const { handleError, showUpgradePrompt, dismissUpgradePrompt, limitError } = useErrorHandler();
 *
 * const mutation = useMutation({
 *   mutationFn: createStream,
 *   onError: (error) => handleError(error),
 * });
 *
 * // For Better Auth:
 * const result = await authClient.signIn.emailOtp({ email, otp });
 * if (result.error) {
 *   handleAuthError(result.error, "Sign in failed");
 *   return;
 * }
 *
 * return (
 *   <UpgradePrompt
 *     open={showUpgradePrompt}
 *     onClose={dismissUpgradePrompt}
 *     limitError={limitError}
 *   />
 * );
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const { toast } = useToast();
  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
  } = useLimitError();

  const handleError = useCallback(
    (error: unknown, options?: HandleErrorOptions): ErrorType => {
      const classified = classifyError(error);

      // Delegate limit errors to useLimitError (shows UpgradePrompt)
      if (classified.type === "LIMIT_EXCEEDED") {
        handleLimitError(error);
        options?.onError?.(classified.type);
        return classified.type;
      }

      // Silent mode - just classify, don't show toast
      if (options?.silent) {
        options?.onError?.(classified.type);
        return classified.type;
      }

      // Get toast content
      const defaultMessages = ERROR_MESSAGES[classified.type];
      const customMessages = options?.messages?.[classified.type];

      const title = options?.title ?? customMessages?.title ?? defaultMessages.title;
      const description =
        options?.description ??
        customMessages?.description ??
        // Use actual error message for unknown errors, default for known types
        (classified.type === "UNKNOWN" ? getErrorMessage(error) : defaultMessages.description);

      toast({
        title,
        description,
        variant: "destructive",
      });

      options?.onError?.(classified.type);
      return classified.type;
    },
    [toast, handleLimitError]
  );

  const handleAuthError = useCallback(
    (
      resultError: { status?: number; code?: string; message?: string } | null | undefined,
      fallbackMessage = "An error occurred",
      options?: HandleErrorOptions
    ): ErrorType | null => {
      if (!resultError) return null;

      // Convert Better Auth error to standard Error for classification
      const error = new Error(resultError.message ?? fallbackMessage);
      // Attach status for classification
      (error as Error & { status?: number }).status = resultError.status;

      // Use the standard handler
      return handleError(
        {
          ...resultError,
          message: resultError.message ?? fallbackMessage,
        },
        options
      );
    },
    [handleError]
  );

  return {
    handleError,
    handleAuthError,
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
  };
}
