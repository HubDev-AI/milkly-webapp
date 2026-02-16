import { useState, useEffect, useCallback } from "react";

interface UseUnsavedChangesOptions {
  isDirty: boolean;
  enabled?: boolean;
  onLeave: () => void;
}

interface UseUnsavedChangesReturn {
  showLeaveDialog: boolean;
  handleBackClick: () => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

/**
 * Hook for handling unsaved changes warnings.
 * - Shows browser's native "Leave site?" dialog on tab close/reload
 * - Provides state and handlers for in-app navigation confirmation dialog
 *
 * @param isDirty - Whether there are unsaved changes
 * @param enabled - Whether to enable the warnings (default: true)
 * @param onLeave - Callback to execute when user confirms leaving
 */
export function useUnsavedChanges({
  isDirty,
  enabled = true,
  onLeave,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const shouldWarn = isDirty && enabled;

  // Warn before closing tab/browser
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    if (shouldWarn) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarn]);

  // Handler for back button click - shows dialog if dirty
  const handleBackClick = useCallback(() => {
    if (shouldWarn) {
      setShowLeaveDialog(true);
    } else {
      onLeave();
    }
  }, [shouldWarn, onLeave]);

  // Confirm leaving - execute navigation
  const confirmLeave = useCallback(() => {
    setShowLeaveDialog(false);
    onLeave();
  }, [onLeave]);

  // Cancel leaving - stay on page
  const cancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
  }, []);

  return {
    showLeaveDialog,
    handleBackClick,
    confirmLeave,
    cancelLeave,
  };
}
