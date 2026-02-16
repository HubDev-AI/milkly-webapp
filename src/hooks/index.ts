// Shared hooks for feed-related functionality
export { useDebounce } from "./useDebounce";
export {
  useFeed,
  type StreamType as FeedStreamType,
  type FeedFilter,
  type UseFeedOptions,
  type UseFeedReturn,
} from "./useFeed";
export {
  useRefresh,
  refreshQueryKeys,
  type StreamType as RefreshStreamType,
  type UseRefreshOptions,
  type UseRefreshReturn,
} from "./useRefresh";
export {
  useTemplates,
  type StreamType as TemplateStreamType,
  type UseTemplatesOptions,
  type UseTemplatesReturn,
} from "./useTemplates";
export {
  useCreateGlobalTemplate,
  type UseCreateGlobalTemplateReturn,
} from "./useCreateGlobalTemplate";
export {
  useTemplate,
  type UseTemplateReturn,
} from "./useTemplate";
export {
  useTemplatePreview,
  type UseTemplatePreviewReturn,
} from "./useTemplatePreview";
export {
  useTemplateSettingsActions,
  type UseTemplateSettingsActionsReturn,
} from "./useTemplateSettingsActions";
export {
  useDrafts,
  draftsQueryKeys,
  type StreamType as DraftsStreamType,
  type NewsletterWithCount,
  type LinkedNewsletterWithCount,
  type UseDraftsOptions,
  type UseDraftsReturn,
} from "./useDrafts";
export {
  useCustomItems,
  type StreamType as CustomItemsStreamType,
  type UseCustomItemsOptions,
  type UseCustomItemsReturn,
} from "./useCustomItems";
export {
  useCustomItemDelete,
  type StreamType as CustomItemDeleteStreamType,
  type DeleteItemInfo,
  type UseCustomItemDeleteOptions,
  type UseCustomItemDeleteReturn,
} from "./useCustomItemDelete";
export { useFilterPersistence } from "./useFilterPersistence";

// Existing hooks
export { useToast, toast } from "./useToast";
export { useIsMobile } from "./useMobile";
export { useUnsavedChanges } from "./useUnsavedChanges";
export { useLimitError, checkQueryError } from "./useLimitError";
export { useSubscription } from "./useSubscription";
export { useUsage, type UseUsageReturn } from "./useUsage";

// Media hooks
export {
  useStorageStatus,
  useMediaList,
  useMediaListInfinite,
  useMediaDetail,
  useMediaUrl,
  useMediaUsage,
  useUserLogo,
  useUploadMedia,
  useUpdateMedia,
  useDeleteMedia,
  useDeleteMediaBulk,
  useEditMedia,
  useSetAsLogo,
  type MediaListResponse,
  type UserLogo,
  type ImageEditOperations,
  type UseMediaListOptions,
} from "./useMedia";

// Centralized query keys
export { queryKeys, type QueryKeys } from "@/lib/QueryKeys";
