import { useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { api } from "@/lib/Api";
import { queryKeys as globalQueryKeys } from "@/lib/QueryKeys";
import { useToast } from "@/hooks/useToast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useSubscription } from "@/hooks/useSubscription";
import { useModalQueue } from "@/hooks/useModalQueue";
import { type NewsletterItemLocal, type LocalDraftData } from "@/hooks/useNewsletterLocalStorage";
import { useLimitError } from "@/hooks/useLimitError";
import type { LimitError } from "@/lib/Api";
import type {
  Newsletter,
  ContentItem,
  CreateNewsletterInput,
  UpdateNewsletterInput,
  CreateNewsletterItemInput,
  Category,
} from "../../../milkly-backend/src/types";

// Debug logger - only logs in development or when VITE_DEBUG_TEMPLATES is enabled
const DEBUG_TEMPLATES = import.meta.env.DEV || import.meta.env.VITE_DEBUG_TEMPLATES === "true";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_TEMPLATES) {
    console.log(...args);
  }
};

interface GeneratedNote {
  itemId: string;
  note: string;
}

export interface NewsletterEditorConfig {
  parentType: "stream" | "linked-stream";
  parentId: string;
  newsletterId: string;
  endpoints: {
    parent: string;
    templates: string;
    newsletter: string;
    feed: string;
    createNewsletter: string;
    generateTemplate: string;
    generateNotes: string;
    generatePreview: string;
  };
  queryKeys: {
    parent: string[];
    templates: string[];
    newsletter: string[];
    newsletters: string[];
    newslettersDrafts: string[];
    feed: string[];
  };
  getStorageKey: (parentId: string, newsletterId: string) => string;
  navigationPath: string;
  extractItemId?: (item: any) => string;
}

export interface NewsletterEditorReturn {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  items: NewsletterItemLocal[];
  setItems: Dispatch<SetStateAction<NewsletterItemLocal[]>>;
  activeTab: "edit" | "editor" | "preview";
  setActiveTab: (tab: "edit" | "editor" | "preview") => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  viewMode: "grouped" | "flat";
  setViewMode: (mode: "grouped" | "flat") => void;
  categoryOrder: Category[];
  setCategoryOrder: Dispatch<SetStateAction<Category[]>>;
  activeDragCategory: Category | null;
  autoSave: boolean;
  setAutoSave: (save: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  showPublishConfirmDialog: boolean;
  setShowPublishConfirmDialog: (show: boolean) => void;

  isNewNewsletter: boolean;
  isPublished: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isGenerating: boolean;
  isLoading: boolean;
  hasTemplates: boolean;
  hasActiveTemplate: boolean;
  activeTemplate: any;
  maxNewsletterItems: number;
  hasExceededItemsLimit: boolean;
  hasExceededGenerationLimit: boolean;
  itemsByCategory: Record<Category, NewsletterItemLocal[]>;
  allItemIds: string[];

  parentData: any;
  templates: any[];
  existingNewsletter: any;

  showRecoveryDialog: boolean;
  showTemplatePrompt: boolean;
  showLeaveDialog: boolean;
  pendingRecoveryData: LocalDraftData | null;
  dismissModal: () => void;

  updateItemNote: (contentItemId: string, note: string) => void;
  removeItem: (contentItemId: string) => void;
  handleCustomItemCreated: (item: ContentItem) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleCategoryDragStart: (event: DragStartEvent) => void;
  handleCategoryDragEnd: (event: DragEndEvent) => void;
  handleSave: () => void;
  handlePublish: () => void;
  handleRecoverPreviousWork: () => void;
  handleDiscard: () => void;
  handleBackClick: () => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
  saveAndLeave: () => void;

  createMutation: UseMutationResult<any, Error, CreateNewsletterInput, unknown>;
  updateMutation: UseMutationResult<any, Error, UpdateNewsletterInput & { isAutoSave?: boolean }, unknown>;
  publishMutation: UseMutationResult<any, Error, void, unknown>;
  deleteMutation: UseMutationResult<any, Error, void, unknown>;
  generateTemplateMutation: UseMutationResult<any, Error, void, unknown>;
  generateNotesMutation: UseMutationResult<any, Error, void, unknown>;
  generatePreviewMutation: UseMutationResult<any, Error, void, unknown>;
  regenerateMutation: UseMutationResult<any, Error, void, unknown>;

  limitError: LimitError | null;
  showUpgradePrompt: boolean;
  dismissUpgradePrompt: () => void;
  showPromptWithError: (error: LimitError) => void;

  sensors: any;

  usage: any;
  limits: any;
}

export function useNewsletterEditor(config: NewsletterEditorConfig): NewsletterEditorReturn {
  const { parentId, newsletterId, endpoints, queryKeys, getStorageKey, navigationPath, extractItemId } = config;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isNewNewsletter = newsletterId === "new";
  const selectedItemIds = useMemo(
    () => (location.state as { selectedItems?: string[] })?.selectedItems ?? [],
    [location.state]
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [items, setItems] = useState<NewsletterItemLocal[]>([]);
  const [activeTab, setActiveTab] = useState<"edit" | "editor" | "preview">("edit");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [categoryOrder, setCategoryOrder] = useState<Category[]>(["news", "videos", "social", "custom", "none"]);
  const [activeDragCategory, setActiveDragCategory] = useState<Category | null>(null);

  const [previewItemIds, setPreviewItemIds] = useState<string[]>([]);

  const [autoSave, setAutoSave] = useState(true);
  const [lastSavedState, setLastSavedState] = useState<{ title: string; items: NewsletterItemLocal[]; templateId: string | null; content: string } | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishConfirmDialog, setShowPublishConfirmDialog] = useState(false);
  const [publishAfterCreate, setPublishAfterCreate] = useState(false);
  const [pendingRecoveryData, setPendingRecoveryData] = useState<LocalDraftData | null>(null);
  const [userChoseDiscard, setUserChoseDiscard] = useState<boolean | null>(null);
  const [skipLocalStorageSave, setSkipLocalStorageSave] = useState(newsletterId === "new");
  const [hasPopulatedFromExisting, setHasPopulatedFromExisting] = useState(false);
  const [hasReorderedItems, setHasReorderedItems] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: parentData } = useQuery({
    queryKey: queryKeys.parent,
    queryFn: () => api.get<any>(endpoints.parent),
    enabled: !!parentId,
  });

  const { data: templates } = useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => api.get<any[]>(endpoints.templates),
    enabled: !!parentId,
  });

  const { data: existingNewsletter, isLoading: isLoadingNewsletter } = useQuery({
    queryKey: queryKeys.newsletter,
    queryFn: () => api.get<any>(endpoints.newsletter),
    enabled: !isNewNewsletter && !!newsletterId,
  });

  const {
    hasExceededGenerateLimit: hasExceededGenerationLimit,
    usage,
    limits,
  } = useSubscription();

  const maxNewsletterItems = limits?.maxNewsletterItems ?? -1;
  const hasExceededItemsLimit = useMemo(() => {
    if (maxNewsletterItems === -1) return false;
    return items.length > maxNewsletterItems;
  }, [items.length, maxNewsletterItems]);

  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
    showPromptWithError,
  } = useLimitError();

  const isPublished = existingNewsletter?.status === "published";

  useEffect(() => {
    if (isPublished) {
      setActiveTab("preview");
    }
  }, [isPublished]);

  const { data: feedData, isLoading: isLoadingFeed } = useQuery({
    queryKey: queryKeys.feed,
    queryFn: () => api.get<{ items: ContentItem[]; total: number }>(`${endpoints.feed}?limit=100`),
    enabled: isNewNewsletter && selectedItemIds.length > 0,
  });

  const feedItems = feedData?.items;

  // Helper to clear localStorage draft data
  const clearDraft = useCallback((id: string = newsletterId) => {
    if (parentId && id) {
      localStorage.removeItem(getStorageKey(parentId, id));
    }
  }, [parentId, newsletterId, getStorageKey]);

  useEffect(() => {
    if (existingNewsletter && !hasPopulatedFromExisting) {
      setTitle(existingNewsletter.title);
      setContent(existingNewsletter.content);
      setSelectedTemplateId(existingNewsletter.templateId);
      setItems(
        existingNewsletter.items
          .filter((item: any) => extractItemId ? extractItemId(item) : item.contentItemId)
          .map((item: any) => ({
            contentItemId: extractItemId ? extractItemId(item) : item.contentItemId!,
            contentItem: item.contentItem ?? item.content ?? undefined,
            note: item.note ?? "",
            order: item.order,
            isAiNote: false,
          }))
      );
      setHasPopulatedFromExisting(true);
    }
  }, [existingNewsletter, hasPopulatedFromExisting, extractItemId]);

  useEffect(() => {
    if (!content) return;

    const currentItemIds = items.map((i) => i.contentItemId);

    if (previewItemIds.length === 0) {
      setPreviewItemIds(currentItemIds);
      return;
    }

    const itemsChanged =
      currentItemIds.length !== previewItemIds.length ||
      !currentItemIds.every((id, index) => previewItemIds[index] === id);

    if (itemsChanged) {
      setContent("");
      setPreviewItemIds([]);
    }
  }, [items, previewItemIds, content]);

  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(false);

  useEffect(() => {
    if (!parentId || !isNewNewsletter || hasCheckedLocalStorage) return;
    const localKey = getStorageKey(parentId, "new");
    const savedData = localStorage.getItem(localKey);
    if (savedData) {
      try {
        const parsed: LocalDraftData = JSON.parse(savedData);
        if ((parsed.items && parsed.items.length > 0) || parsed.title || parsed.content) {
          setPendingRecoveryData(parsed);
          setHasLocalStorageData(true);
        }
      } catch {
        localStorage.removeItem(localKey);
      }
    }
    setHasCheckedLocalStorage(true);
  }, [parentId, isNewNewsletter, hasCheckedLocalStorage, getStorageKey]);

  const { isModalActive, dismissModal } = useModalQueue({
    modals: [
      {
        id: "recovery",
        shouldShow: isNewNewsletter && hasLocalStorageData,
        ready: hasCheckedLocalStorage,
      },
      {
        id: "template",
        shouldShow: isNewNewsletter && templates !== undefined && templates.length === 0,
        ready: templates !== undefined,
      },
    ],
  });

  const showRecoveryDialog = isModalActive("recovery");
  const showTemplatePrompt = isModalActive("template");

  useEffect(() => {
    if (!isNewNewsletter || !feedItems || selectedItemIds.length === 0) return;
    if (showRecoveryDialog) return;
    if (userChoseDiscard === false) return;
    if (userChoseDiscard === true || !hasLocalStorageData) {
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
    }
  }, [isNewNewsletter, feedItems, selectedItemIds, showRecoveryDialog, userChoseDiscard, hasLocalStorageData]);

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const activeTemplate = templates.find((t: any) => t.isActive);
      if (activeTemplate) {
        setSelectedTemplateId(activeTemplate.id);
      }
    }
  }, [templates, selectedTemplateId]);

  // Clean up any stale localStorage data for existing drafts (they use DB auto-save instead)
  useEffect(() => {
    if (!parentId || !newsletterId || isNewNewsletter || isLoadingNewsletter) return;
    const localKey = getStorageKey(parentId, newsletterId);
    localStorage.removeItem(localKey);
  }, [parentId, newsletterId, isNewNewsletter, isLoadingNewsletter, getStorageKey]);

  function handleRecoverPreviousWork() {
    if (pendingRecoveryData && parentId) {
      setTitle(pendingRecoveryData.title || "");
      setItems(pendingRecoveryData.items || []);
      setSelectedTemplateId(pendingRecoveryData.selectedTemplateId ?? null);
      setContent(pendingRecoveryData.content || "");
      if (pendingRecoveryData.categoryOrder) {
        setCategoryOrder(pendingRecoveryData.categoryOrder);
      }
      toast({
        title: "Restored unsaved changes",
        description: "Your previous work has been recovered.",
      });
    }
    setPendingRecoveryData(null);
    dismissModal();
    setUserChoseDiscard(false);
  }

  function handleDiscard() {
    clearDraft("new");
    setSkipLocalStorageSave(true);
    setTitle("");
    setItems([]);
    setSelectedTemplateId(null);
    setContent("");
    setPendingRecoveryData(null);
    dismissModal();
    setUserChoseDiscard(true);
  }

  const isDirty = useMemo(() => {
    if (!lastSavedState) {
      return title.trim() !== "" || items.length > 0 || content.trim() !== "";
    }
    if (title !== lastSavedState.title) return true;
    if (content !== lastSavedState.content) return true;
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

  // localStorage save — only for new unsaved editions (existing drafts use DB auto-save)
  useEffect(() => {
    if (!parentId || !isNewNewsletter || isPublished || showRecoveryDialog) return;

    if (skipLocalStorageSave) {
      const hasUserChanges = title.trim() !== "" || content.trim() !== "" ||
        items.some(item => item.note.trim() !== "") || hasReorderedItems;
      if (!hasUserChanges) {
        return;
      }
      setSkipLocalStorageSave(false);
    }

    const hasContent = title.trim() !== "" || items.length > 0 || content.trim() !== "";
    if (!hasContent) {
      clearDraft("new");
      return;
    }

    const localKey = getStorageKey(parentId, "new");
    const dataToSave: LocalDraftData = {
      title,
      items,
      selectedTemplateId,
      content,
      categoryOrder,
      savedAt: Date.now(),
    };
    localStorage.setItem(localKey, JSON.stringify(dataToSave));
  }, [parentId, title, items, selectedTemplateId, content, categoryOrder, isPublished, showRecoveryDialog, skipLocalStorageSave, isNewNewsletter, getStorageKey, hasReorderedItems, clearDraft]);

  const {
    showLeaveDialog,
    handleBackClick,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty,
    enabled: !isPublished,
    onLeave: () => {
      if (isNewNewsletter) {
        clearDraft("new");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.newslettersDrafts });

      const backPath = isPublished ? `${navigationPath}/published` : navigationPath;
      navigate(backPath);
    },
  });

  useEffect(() => {
    if (existingNewsletter) {
      setLastSavedState({
        title: existingNewsletter.title,
        content: existingNewsletter.content ?? "",
        items: existingNewsletter.items
          .filter((item: any) => extractItemId ? extractItemId(item) : item.contentItemId)
          .map((item: any) => ({
            contentItemId: extractItemId ? extractItemId(item) : item.contentItemId!,
            contentItem: item.contentItem ?? item.content ?? undefined,
            note: item.note ?? "",
            order: item.order,
            isAiNote: false,
          })),
        templateId: existingNewsletter.templateId,
      });
    }
  }, [existingNewsletter, extractItemId]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateNewsletterInput & { isAutoSave?: boolean }) =>
      api.put<Newsletter>(`/newsletters/${newsletterId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newslettersDrafts });
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletter });
      setLastSavedState({
        title,
        content,
        items,
        templateId: selectedTemplateId,
      });
      clearDraft();
      if (!variables.isAutoSave) {
        toast({
          title: "Edition saved",
          description: "Your changes have been saved.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to save edition",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const saveAndLeave = useCallback(async () => {
    if (isNewNewsletter || isPublished) return;
    const itemsData: CreateNewsletterItemInput[] = items.map((item, index) => ({
      contentItemId: item.contentItemId,
      note: item.note || undefined,
      order: index,
    }));
    try {
      await updateMutation.mutateAsync({
        title: title.trim() || "Untitled Draft",
        content,
        templateId: selectedTemplateId,
        items: itemsData,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.newslettersDrafts });
      navigate(navigationPath);
    } catch {
      toast({ description: "Failed to save. Please try again.", variant: "destructive" });
    }
  }, [isNewNewsletter, isPublished, items, updateMutation, title, content, selectedTemplateId, queryClient, queryKeys.newslettersDrafts, navigate, navigationPath, toast]);

  useEffect(() => {
    if (!autoSave || isNewNewsletter || !newsletterId || isPublished || !isDirty) return;

    const timeoutId = setTimeout(() => {
      const itemsData: CreateNewsletterItemInput[] = items.map((item, index) => ({
        contentItemId: item.contentItemId,
        note: item.note || undefined,
        order: index,
      }));

      updateMutation.mutate({
        title: title.trim() || "Untitled Draft",
        content: content,
        templateId: selectedTemplateId,
        items: itemsData,
        isAutoSave: true,
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, isNewNewsletter, newsletterId, isPublished, isDirty, title, items, selectedTemplateId, content]);

  const itemsByCategory = useMemo(() => {
    const groups: Record<Category, NewsletterItemLocal[]> = {
      news: [],
      videos: [],
      social: [],
      custom: [],
      none: [],
    };
    items.forEach((item) => {
      const category = item.contentItem?.category ?? "news";
      groups[category].push(item);
    });
    return groups;
  }, [items]);

  const generateTemplateMutation = useMutation({
    mutationFn: () => api.post<any>(endpoints.generateTemplate, { generateWithAI: true, setActive: true }),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: globalQueryKeys.account.usage() });
      setSelectedTemplateId(template.id);
      dismissModal();
      toast({
        title: "Template generated",
        description: "Your AI-powered template is ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate template",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const generateNotesMutation = useMutation({
    mutationFn: () => {
      if (isNewNewsletter || !newsletterId) {
        return api.post<{ notes: GeneratedNote[] }>(endpoints.generateNotes, {
          [config.parentType === "stream" ? "streamId" : "linkedStreamId"]: parentId,
          contentItemIds: items.map((i) => i.contentItemId),
        });
      }
      return api.post<{ notes: GeneratedNote[] }>(`/newsletters/${newsletterId}/generate-notes`);
    },
    onSuccess: (result) => {
      setItems((prev) =>
        prev.map((item) => {
          const generatedNote = result.notes.find((n) => n.itemId === item.contentItemId);
          if (generatedNote && generatedNote.note) {
            return { ...item, note: generatedNote.note, isAiNote: true };
          }
          return item;
        })
      );
      queryClient.invalidateQueries({ queryKey: globalQueryKeys.account.usage() });
      toast({
        title: "Notes generated",
        description: "AI has added curator notes to your items.",
      });
    },
    onError: (error) => {
      if (!handleLimitError(error)) {
        toast({
          title: "Failed to generate notes",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => {
      const contentItemIds = items.map((i) => i.contentItemId);
      const itemNotes = Object.fromEntries(
        items.filter((i) => i.note).map((i) => [i.contentItemId, i.note])
      );

      debugLog("[REGENERATE-FE] Regenerating newsletter with current items:", {
        contentItemIds,
        itemNotesCount: Object.keys(itemNotes).length,
        itemNotes,
      });

      return api.post<{ content: string }>(`/newsletters/${newsletterId}/regenerate`, {
        contentItemIds,
        itemNotes,
      });
    },
    onSuccess: (result) => {
      setContent(result.content);
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletter });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: globalQueryKeys.account.usage() });
      toast({
        title: "Newsletter regenerated",
        description: "Your content has been refreshed with AI.",
      });
    },
    onError: (error) => {
      if (!handleLimitError(error)) {
        toast({
          title: "Failed to regenerate",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: () => {
      const contentItemIds = items.map((i) => i.contentItemId);
      const itemNotes = Object.fromEntries(
        items.filter((i) => i.note).map((i) => [i.contentItemId, i.note])
      );

      debugLog("[GENERATE-FE] Current items array:", {
        length: items.length,
        ids: items.map((i) => i.contentItemId),
      });
      debugLog("[GENERATE-FE] ContentItemIds being sent:", contentItemIds);
      debugLog("[GENERATE-FE] Selected template ID:", selectedTemplateId);
      debugLog("[GENERATE-FE] Item notes being sent:", itemNotes);

      return api.post<{ content: string }>(endpoints.generatePreview, {
        [config.parentType === "stream" ? "streamId" : "linkedStreamId"]: parentId,
        templateId: selectedTemplateId,
        contentItemIds,
        itemNotes,
        title: title || undefined,
      });
    },
    onSuccess: (result) => {
      setContent(result.content);
      setPreviewItemIds(items.map((i) => i.contentItemId));
      setActiveTab("preview");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: globalQueryKeys.account.usage() });
      toast({
        title: "Preview generated",
        description: "Your newsletter preview is ready.",
      });
    },
    onError: (error) => {
      if (!handleLimitError(error)) {
        toast({
          title: "Failed to generate preview",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNewsletterInput) =>
      api.post<any>(endpoints.createNewsletter, data),
    onSuccess: async (newsletter) => {
      queryClient.setQueryData(queryKeys.newsletter, newsletter);
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
      queryClient.invalidateQueries({ queryKey: queryKeys.newslettersDrafts });
      clearDraft("new");

      if (publishAfterCreate) {
        setPublishAfterCreate(false);
        try {
          const published = await api.post<Newsletter & { publicUrl?: string }>(`/newsletters/${newsletter.id}/publish`);
          queryClient.invalidateQueries({ queryKey: queryKeys.newsletter });
          queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
          if (published.publicUrl) {
            navigator.clipboard.writeText(published.publicUrl);
            toast({
              title: "Published!",
              description: "Public link copied to clipboard.",
            });
          } else {
            toast({
              title: "Published!",
              description: "Your newsletter edition is now live.",
            });
          }
        } catch (error) {
          toast({
            title: "Failed to publish",
            description: error instanceof Error ? error.message : "Newsletter was saved but publishing failed. Please try again.",
            variant: "destructive",
          });
        }
        navigate(`${navigationPath}/newsletter/${newsletter.id}`, { replace: true });
      } else {
        toast({
          title: "Edition created",
          description: "Your newsletter edition has been saved as a draft.",
        });
        navigate(`${navigationPath}/newsletter/${newsletter.id}`, { replace: true });
      }
    },
    onError: (error) => {
      setPublishAfterCreate(false);
      toast({
        title: "Failed to create edition",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post<Newsletter & { publicUrl?: string }>(`/newsletters/${newsletterId}/publish`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletter });
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
      clearDraft();
      if (data.publicUrl) {
        navigator.clipboard.writeText(data.publicUrl);
        toast({
          title: "Published!",
          description: "Public link copied to clipboard.",
        });
      } else {
        toast({
          title: "Published!",
          description: "Your newsletter edition is now live.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete<void>(`/newsletters/${newsletterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
      toast({
        title: "Deleted",
        description: "Newsletter has been deleted.",
      });
      navigate(navigationPath);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending || deleteMutation.isPending;
  const isGenerating =
    generateTemplateMutation.isPending ||
    regenerateMutation.isPending ||
    generateNotesMutation.isPending ||
    generatePreviewMutation.isPending;

  const activeTemplate = templates?.find((t: any) => t.id === selectedTemplateId);
  const hasTemplates = templates && templates.length > 0;
  const hasActiveTemplate = templates?.some((t: any) => t.isActive) ?? false;

  function updateItemNote(contentItemId: string, note: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.contentItemId === contentItemId ? { ...item, note, isAiNote: false } : item
      )
    );
  }

  function removeItem(contentItemId: string) {
    setItems((prev) => prev.filter((item) => item.contentItemId !== contentItemId));
  }

  function handleCustomItemCreated(item: ContentItem) {
    debugLog("[CUSTOM-ITEM] Custom item received:", {
      id: item.id,
      title: item.title,
    });

    const newOrder = items.length;
    setItems((prev) => {
      const newItems = [
        ...prev,
        {
          contentItemId: item.id,
          contentItem: item,
          note: "",
          order: newOrder,
          isAiNote: false,
        },
      ];
      debugLog("[CUSTOM-ITEM] Items array after adding:", {
        length: newItems.length,
        ids: newItems.map((i) => i.contentItemId),
      });
      return newItems;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.contentItemId === active.id);
        const newIndex = prev.findIndex((item) => item.contentItemId === over.id);

        const newItems = arrayMove(prev, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, order: idx }));
      });
      setHasReorderedItems(true);
    }
  }

  function handleCategoryDragStart(event: DragStartEvent) {
    setActiveDragCategory(event.active.id as Category);
  }

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragCategory(null);

    if (over && active.id !== over.id) {
      setCategoryOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as Category);
        const newIndex = prev.indexOf(over.id as Category);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleSave() {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your edition.",
        variant: "destructive",
      });
      return;
    }

    const itemsData: CreateNewsletterItemInput[] = items.map((item, index) => ({
      contentItemId: item.contentItemId,
      note: item.note || undefined,
      order: index,
    }));

    if (isNewNewsletter) {
      createMutation.mutate({
        title: title.trim(),
        content: content,
        templateId: selectedTemplateId ?? undefined,
        items: itemsData,
      });
    } else {
      updateMutation.mutate({
        title: title.trim(),
        content: content,
        templateId: selectedTemplateId,
        items: itemsData,
        isAutoSave: false,
      });
    }
  }

  function handlePublish() {
    if (isNewNewsletter) {
      if (!title.trim()) {
        toast({
          title: "Title required",
          description: "Please enter a title for your edition.",
          variant: "destructive",
        });
        return;
      }
      setPublishAfterCreate(true);
      const itemsData: CreateNewsletterItemInput[] = items.map((item, index) => ({
        contentItemId: item.contentItemId,
        note: item.note || undefined,
        order: index,
      }));
      createMutation.mutate({
        title: title.trim(),
        content: content,
        templateId: selectedTemplateId ?? undefined,
        items: itemsData,
      });
      return;
    }
    publishMutation.mutate();
  }

  const isLoading = isLoadingNewsletter || (isNewNewsletter && isLoadingFeed);
  const allItemIds = items.map((item) => item.contentItemId);

  return {
    title,
    setTitle,
    content,
    setContent,
    items,
    setItems,
    activeTab,
    setActiveTab,
    selectedTemplateId,
    setSelectedTemplateId,
    viewMode,
    setViewMode,
    categoryOrder,
    setCategoryOrder,
    activeDragCategory,
    autoSave,
    setAutoSave,
    showDeleteDialog,
    setShowDeleteDialog,
    showPublishConfirmDialog,
    setShowPublishConfirmDialog,

    isNewNewsletter,
    isPublished,
    isDirty,
    isSubmitting,
    isGenerating,
    isLoading,
    hasTemplates,
    hasActiveTemplate,
    activeTemplate,
    maxNewsletterItems,
    hasExceededItemsLimit,
    hasExceededGenerationLimit,
    itemsByCategory,
    allItemIds,

    parentData,
    templates,
    existingNewsletter,

    showRecoveryDialog,
    showTemplatePrompt,
    showLeaveDialog,
    pendingRecoveryData,
    dismissModal,

    updateItemNote,
    removeItem,
    handleCustomItemCreated,
    handleDragEnd,
    handleCategoryDragStart,
    handleCategoryDragEnd,
    handleSave,
    handlePublish,
    handleRecoverPreviousWork,
    handleDiscard,
    handleBackClick,
    confirmLeave,
    cancelLeave,
    saveAndLeave,

    createMutation,
    updateMutation,
    publishMutation,
    deleteMutation,
    generateTemplateMutation,
    generateNotesMutation,
    generatePreviewMutation,
    regenerateMutation,

    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    showPromptWithError,

    sensors,

    usage,
    limits,
  };
}
