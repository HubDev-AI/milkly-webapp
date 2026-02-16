import { useState, useCallback, useMemo } from "react";

export interface ModalConfig {
  /** Unique identifier for this modal */
  id: string;
  /** Condition that must be true for this modal to be shown */
  shouldShow: boolean;
  /** Whether this modal's condition has been evaluated (for async checks) */
  ready?: boolean;
}

interface UseModalQueueOptions {
  /** List of modals in priority order (first = highest priority) */
  modals: ModalConfig[];
}

interface UseModalQueueReturn {
  /** The ID of the currently active modal, or null if none */
  activeModalId: string | null;
  /** Check if a specific modal is currently active */
  isModalActive: (id: string) => boolean;
  /** Dismiss the current modal and move to the next one */
  dismissModal: () => void;
  /** Dismiss a specific modal by ID */
  dismissModalById: (id: string) => void;
  /** Check if queue is ready (all modals have been evaluated) */
  isReady: boolean;
}

/**
 * Hook for managing a queue of modals that should be shown sequentially.
 *
 * Modals are shown in priority order - the first modal in the list that has
 * shouldShow=true will be displayed. When dismissed, the next eligible modal
 * is shown.
 *
 * @example
 * ```tsx
 * const { activeModalId, dismissModal } = useModalQueue({
 *   modals: [
 *     { id: "recovery", shouldShow: hasUnsavedWork, ready: hasCheckedStorage },
 *     { id: "template", shouldShow: !hasTemplate, ready: templatesLoaded },
 *   ],
 * });
 *
 * return (
 *   <>
 *     <RecoveryDialog open={activeModalId === "recovery"} onClose={dismissModal} />
 *     <TemplateDialog open={activeModalId === "template"} onClose={dismissModal} />
 *   </>
 * );
 * ```
 */
export function useModalQueue({ modals }: UseModalQueueOptions): UseModalQueueReturn {
  // Track which modals have been dismissed in this session
  const [dismissedModals, setDismissedModals] = useState<Set<string>>(new Set());

  // Check if all modals are ready (have been evaluated)
  const isReady = useMemo(() => {
    return modals.every((modal) => modal.ready !== false);
  }, [modals]);

  // Find the first modal that should be shown and hasn't been dismissed
  const activeModalId = useMemo(() => {
    if (!isReady) return null;

    for (const modal of modals) {
      if (modal.shouldShow && !dismissedModals.has(modal.id)) {
        return modal.id;
      }
    }
    return null;
  }, [modals, dismissedModals, isReady]);

  // Dismiss the currently active modal
  const dismissModal = useCallback(() => {
    if (activeModalId) {
      setDismissedModals((prev) => new Set([...prev, activeModalId]));
    }
  }, [activeModalId]);

  // Dismiss a specific modal by ID
  const dismissModalById = useCallback((id: string) => {
    setDismissedModals((prev) => new Set([...prev, id]));
  }, []);

  // Check if a specific modal is active
  const isModalActive = useCallback(
    (id: string) => activeModalId === id,
    [activeModalId]
  );

  return {
    activeModalId,
    isModalActive,
    dismissModal,
    dismissModalById,
    isReady,
  };
}
