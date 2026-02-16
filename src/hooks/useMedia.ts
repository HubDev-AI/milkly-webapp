import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { QUERY, PAGINATION } from "@/lib/Constants";
import type {
  MediaFile,
  MediaFileWithUrl,
  MediaUsage,
  UpdateMediaFileInput,
} from "../../../milkly-backend/src/types";

const ITEMS_PER_PAGE = PAGINATION.DEFAULT_LIMIT;

export interface MediaListResponse {
  files: MediaFileWithUrl[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserLogo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  brandColors: string[] | null;
}

export interface ImageEditOperations {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  saveAsNew?: boolean;
}

export function useStorageStatus() {
  return useQuery({
    queryKey: queryKeys.media.status(),
    queryFn: () => api.get<{ configured: boolean }>("/media/status"),
    staleTime: QUERY.STALE_TIME_MS,
  });
}

export interface UseMediaListOptions {
  page?: number;
  search?: string;
  tags?: string;
  enabled?: boolean;
}

export function useMediaList(options: UseMediaListOptions = {}) {
  const { page = 1, search, tags, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.media.list({ page, search, tags }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      if (search?.trim()) params.set("search", search.trim());
      if (tags?.trim()) params.set("tags", tags.trim());

      return api.get<MediaListResponse>(`/media?${params.toString()}`);
    },
    enabled,
  });
}

export function useMediaListInfinite(options: { search?: string; tags?: string; enabled?: boolean } = {}) {
  const { search, tags, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: queryKeys.media.listInfinite({ search, tags }),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("page", pageParam.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      if (search?.trim()) params.set("search", search.trim());
      if (tags?.trim()) params.set("tags", tags.trim());

      return api.get<MediaListResponse>(`/media?${params.toString()}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
  });
}

export function useMediaDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.media.detail(id ?? ""),
    queryFn: () => api.get<MediaFileWithUrl>(`/media/${id}`),
    enabled: !!id,
  });
}

export function useMediaUrl(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.media.url(id ?? ""),
    queryFn: () => api.get<{ url: string }>(`/media/${id}/url`),
    enabled: !!id,
    staleTime: QUERY.MEDIA_URL_STALE_TIME_MS,
  });
}

export function useMediaUsage() {
  return useQuery({
    queryKey: queryKeys.media.usage(),
    queryFn: () => api.get<MediaUsage>("/media/usage"),
  });
}

export function useUserLogo() {
  return useQuery({
    queryKey: queryKeys.media.logo(),
    queryFn: () => api.get<UserLogo | null>("/media/logo"),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.raw("/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Upload failed");
      }

      const json = await response.json();
      return json.data as MediaFileWithUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMediaFileInput }) => {
      return api.patch<MediaFile>(`/media/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.media.detail(id) });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
}

export function useDeleteMediaBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => api.delete(`/media/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
  });
}

export function useEditMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, operations }: { id: string; operations: ImageEditOperations }) => {
      return api.post<MediaFileWithUrl>(`/media/${id}/edit`, operations);
    },
    onSuccess: (_, { id, operations }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
      if (!operations.saveAsNew) {
        queryClient.invalidateQueries({ queryKey: queryKeys.media.detail(id) });
      }
    },
  });
}

export function useSetAsLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<{ brandColors: string[] }>(`/media/${id}/set-logo`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.logo() });
    },
  });
}
