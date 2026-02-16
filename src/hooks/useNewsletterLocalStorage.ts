import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ContentItem, Category } from "../../../milkly-backend/src/types";

export interface NewsletterItemLocal {
  contentItemId: string;
  contentItem?: ContentItem;
  note: string;
  order: number;
  isAiNote?: boolean;
}

export interface LocalDraftData {
  title: string;
  items: NewsletterItemLocal[];
  selectedTemplateId: string | null;
  content: string;
  categoryOrder?: Category[];
  savedAt: number;
}

interface SavedState {
  title: string;
  items: NewsletterItemLocal[];
  templateId: string | null;
}

interface UseNewsletterLocalStorageOptions {
  streamId: string | undefined;
  newsletterId: string | undefined;
  isPublished: boolean;
  autoSave: boolean;
  onToast?: (options: { title: string; description: string }) => void;
}

export const getLocalStorageKey = (streamId: string, newsletterId: string) =>
  `newsletter-draft-${streamId}-${newsletterId}`;

/**
 * Production-grade hook for managing newsletter localStorage persistence.
 *
 * Handles:
 * - Saving work-in-progress to localStorage
 * - Recovery dialog for new newsletters with existing unsaved work
 * - "Unsaved changes" dialog when navigating away (auto-save off)
 * - Dirty state tracking
 * - Coordinating between new vs existing newsletters
 * - Preventing save loops after discard actions
 */
export function useNewsletterLocalStorage({
  streamId,
  newsletterId,
  isPublished,
  autoSave,
  onToast,
}: UseNewsletterLocalStorageOptions) {
  const isNewNewsletter = newsletterId === "new";

  // Current state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [items, setItems] = useState<NewsletterItemLocal[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Recovery dialog state (for new newsletters with existing localStorage data)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [pendingRecoveryData, setPendingRecoveryData] = useState<LocalDraftData | null>(null);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);

  // User's decision in recovery dialog: null = not decided, true = discard, false = recover
  const [userRecoveryDecision, setUserRecoveryDecision] = useState<"discard" | "recover" | null>(null);

  // Last saved state for dirty tracking
  const [lastSavedState, setLastSavedState] = useState<SavedState | null>(null);

  // Ref to skip next save (prevents save loop after discard)
  const skipNextSaveRef = useRef(false);
  // Ref to track if items were just loaded from navigation
  const itemsFromNavigationRef = useRef(false);

  // ============================================================
  // DIRTY STATE TRACKING
  // ============================================================
  const isDirty = useMemo(() => {
    if (!lastSavedState) {
      // For new newsletters, dirty if there's any content
      return title.trim() !== "" || items.length > 0 || content.trim() !== "";
    }
    // Compare with last saved state
    if (title !== lastSavedState.title) return true;
    if (selectedTemplateId !== lastSavedState.templateId) return true;
    if (items.length !== lastSavedState.items.length) return true;
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      const saved = lastSavedState.items[i];
      if (current.contentItemId !== saved.contentItemId) return true;
      if (current.note !== saved.note) return true;
      if (current.order !== saved.order) return true;
    }
    return false;
  }, [title, items, selectedTemplateId, content, lastSavedState]);

  // ============================================================
  // CHECK FOR EXISTING LOCALSTORAGE DATA (NEW NEWSLETTERS)
  // ============================================================
  useEffect(() => {
    if (!streamId || !isNewNewsletter || hasCheckedLocalStorage) return;

    const localKey = getLocalStorageKey(streamId, "new");
    const savedData = localStorage.getItem(localKey);

    if (savedData) {
      try {
        const parsed: LocalDraftData = JSON.parse(savedData);
        if ((parsed.items && parsed.items.length > 0) || parsed.title || parsed.content) {
          setPendingRecoveryData(parsed);
          setShowRecoveryDialog(true);
          setHasLocalStorageData(true);
        }
      } catch {
        localStorage.removeItem(localKey);
      }
    }
    setHasCheckedLocalStorage(true);
  }, [streamId, isNewNewsletter, hasCheckedLocalStorage]);

  // ============================================================
  // LOAD LOCALSTORAGE DATA FOR EXISTING DRAFTS
  // ============================================================
  useEffect(() => {
    if (!streamId || !newsletterId || isNewNewsletter) return;

    const localKey = getLocalStorageKey(streamId, newsletterId);
    const savedData = localStorage.getItem(localKey);

    if (savedData) {
      try {
        const parsed: LocalDraftData = JSON.parse(savedData);
        if ((parsed.items && parsed.items.length > 0) || parsed.title || parsed.content) {
          setTitle(parsed.title || "");
          setItems(parsed.items || []);
          setSelectedTemplateId(parsed.selectedTemplateId ?? null);
          setContent(parsed.content || "");
          onToast?.({
            title: "Restored unsaved changes",
            description: "Your previous work has been recovered.",
          });
        }
      } catch {
        localStorage.removeItem(localKey);
      }
    }
  }, [streamId, newsletterId, isNewNewsletter, onToast]);

  // ============================================================
  // SAVE TO LOCALSTORAGE
  // ============================================================
  useEffect(() => {
    if (!streamId || !newsletterId || isPublished || showRecoveryDialog) return;

    // Skip if we're in the middle of a discard action
    if (skipNextSaveRef.current) {
      // If items were just loaded from navigation, reset the skip flag
      // but don't save yet (the items from navigation aren't user changes yet)
      if (itemsFromNavigationRef.current) {
        skipNextSaveRef.current = false;
        itemsFromNavigationRef.current = false;
      }
      return;
    }

    const hasContent = title.trim() !== "" || items.length > 0 || content.trim() !== "";
    const localKey = getLocalStorageKey(streamId, newsletterId);

    if (!hasContent) {
      localStorage.removeItem(localKey);
      return;
    }

    const dataToSave: LocalDraftData = {
      title,
      items,
      selectedTemplateId,
      content,
      savedAt: Date.now(),
    };
    localStorage.setItem(localKey, JSON.stringify(dataToSave));
  }, [streamId, newsletterId, title, items, selectedTemplateId, content, isPublished, showRecoveryDialog]);

  // ============================================================
  // RECOVERY DIALOG HANDLERS
  // ============================================================
  const handleRecoverPreviousWork = useCallback(() => {
    if (pendingRecoveryData && streamId) {
      setTitle(pendingRecoveryData.title || "");
      setItems(pendingRecoveryData.items || []);
      setSelectedTemplateId(pendingRecoveryData.selectedTemplateId ?? null);
      setContent(pendingRecoveryData.content || "");
      onToast?.({
        title: "Restored unsaved changes",
        description: "Your previous work has been recovered.",
      });
    }
    setPendingRecoveryData(null);
    setShowRecoveryDialog(false);
    setUserRecoveryDecision("recover");
  }, [pendingRecoveryData, streamId, onToast]);

  const handleDiscardAndStartFresh = useCallback(() => {
    if (streamId) {
      localStorage.removeItem(getLocalStorageKey(streamId, "new"));
    }
    // Set skip flag to prevent the items from navigation being saved immediately
    skipNextSaveRef.current = true;
    // Reset state
    setTitle("");
    setItems([]);
    setSelectedTemplateId(null);
    setContent("");
    setPendingRecoveryData(null);
    setShowRecoveryDialog(false);
    setUserRecoveryDecision("discard");
  }, [streamId]);

  // ============================================================
  // LOAD ITEMS FROM NAVIGATION (for new newsletters)
  // ============================================================
  const loadItemsFromNavigation = useCallback((
    feedItems: ContentItem[],
    selectedItemIds: string[]
  ) => {
    // Don't load if recovery dialog is showing or user chose to recover
    if (showRecoveryDialog || userRecoveryDecision === "recover") return;
    // Only load if user discarded or there was no localStorage data
    if (userRecoveryDecision !== "discard" && hasLocalStorageData) return;

    const selectedItems = feedItems
      .filter((item) => selectedItemIds.includes(item.id))
      .map((item, index) => ({
        contentItemId: item.id,
        contentItem: item,
        note: "",
        order: index,
        isAiNote: false,
      }));

    setItems(selectedItems);
    // Mark that items came from navigation (for skip flag reset logic)
    itemsFromNavigationRef.current = true;
  }, [showRecoveryDialog, userRecoveryDecision, hasLocalStorageData]);

  // ============================================================
  // METHODS FOR EXTERNAL USE
  // ============================================================
  const clearLocalStorage = useCallback(() => {
    if (streamId && newsletterId) {
      localStorage.removeItem(getLocalStorageKey(streamId, newsletterId));
    }
  }, [streamId, newsletterId]);

  const updateLastSavedState = useCallback((state: SavedState) => {
    setLastSavedState(state);
  }, []);

  const resetState = useCallback(() => {
    setTitle("");
    setContent("");
    setItems([]);
    setSelectedTemplateId(null);
    setLastSavedState(null);
  }, []);

  // For "Unsaved changes" dialog - clear localStorage on discard
  const discardChangesAndNavigate = useCallback(() => {
    clearLocalStorage();
  }, [clearLocalStorage]);

  return {
    // Current state
    title,
    setTitle,
    content,
    setContent,
    items,
    setItems,
    selectedTemplateId,
    setSelectedTemplateId,

    // Dirty tracking
    isDirty,
    lastSavedState,
    updateLastSavedState,

    // Recovery dialog
    showRecoveryDialog,
    pendingRecoveryData,
    hasCheckedLocalStorage,
    userRecoveryDecision,
    handleRecoverPreviousWork,
    handleDiscardAndStartFresh,

    // Navigation items loading
    loadItemsFromNavigation,

    // Utilities
    clearLocalStorage,
    discardChangesAndNavigate,
    resetState,

    // For unsaved changes hook integration
    shouldShowUnsavedDialog: !autoSave && !isPublished && isDirty,
  };
}
