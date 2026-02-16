import { useMemo, useCallback, useState } from "react";
import { compileMkly } from "@/lib/mkly";
import { useDebounce } from "@/hooks/useDebounce";

const DEBOUNCE_DELAY_MS = 1000;

export interface UseTemplatePreviewReturn {
  previewHtml: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

/**
 * Hook for managing template preview generation with client-side mkly compilation.
 * When autoRefresh is enabled, compiles mkly source automatically with debouncing.
 * When disabled, only compiles on manual refresh.
 *
 * @param mklySource - The mkly source code to compile, or null to disable compilation
 * @param autoRefresh - If true, auto-compiles on source changes (debounced); if false, only on manual refresh
 * @returns Preview state including HTML, loading state, error, and refresh function
 *
 * @example
 * ```tsx
 * const { previewHtml, isLoading, refresh } = useTemplatePreview(mklySource, true);
 *
 * if (isLoading) return <Spinner />;
 * if (previewHtml) return <div dangerouslySetInnerHTML={{ __html: previewHtml }} />;
 * ```
 */
export function useTemplatePreview(
  mklySource: string | null,
  autoRefresh: boolean = false,
): UseTemplatePreviewReturn {
  const [manualRefreshTrigger, setManualRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const debouncedSource = useDebounce(mklySource, DEBOUNCE_DELAY_MS);

  const sourceToCompile = autoRefresh ? debouncedSource : mklySource;

  const compilationResult = useMemo(() => {
    if (!sourceToCompile) {
      return { html: null, error: null };
    }

    if (!autoRefresh && manualRefreshTrigger === 0) {
      return { html: null, error: null };
    }

    try {
      const result = compileMkly(sourceToCompile);

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors
          .map((e) => `Line ${e.line}: ${e.message}`)
          .join("\n");
        return {
          html: null,
          error: new Error(`Compilation failed:\n${errorMessages}`),
        };
      }

      setLastUpdated(new Date());
      return { html: result.html, error: null };
    } catch (err) {
      return {
        html: null,
        error: err instanceof Error ? err : new Error("Unknown compilation error"),
      };
    }
  }, [sourceToCompile, autoRefresh, manualRefreshTrigger]);

  const refresh = useCallback(() => {
    setManualRefreshTrigger((prev) => prev + 1);
  }, []);

  const isLoading = autoRefresh
    ? (mklySource !== null && debouncedSource !== mklySource)
    : false;

  return {
    previewHtml: compilationResult.html,
    isLoading,
    error: compilationResult.error,
    refresh,
    lastUpdated,
  };
}
