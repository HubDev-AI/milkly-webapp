import { z } from "zod";
import type { LimitError, LimitType } from "../../../milkly-backend/src/types";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const API_PATH = "/api/v1";

class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Response envelope type - all app routes return { data: T }
interface ApiResponse<T> {
  data: T;
}

// Paginated response type - routes with pagination return { data: T[], pagination: {...} }
interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${API_PATH}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const json = await response.json().catch(() => null);

    // Handle rate limiting with user-friendly message
    if (response.status === 429 || json?.error?.code === "RATE_LIMITED") {
      throw new ApiError(
        "Too many requests. Please wait a moment and try again.",
        429,
        json?.error || { code: "RATE_LIMITED", retryAfter: json?.error?.retryAfter }
      );
    }

    throw new ApiError(
      json?.error?.message || json?.message || `Request failed with status ${response.status}`,
      response.status,
      json?.error || json
    );
  }

  // 1. Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // 2. JSON responses: parse and unwrap { data }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json: ApiResponse<T> = await response.json();
    return json.data;
  }

  // 3. Non-JSON: return undefined (caller should use api.raw() for these)
  return undefined as T;
}

// Raw request for non-JSON endpoints (uploads, downloads, streams)
async function rawRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${API_PATH}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
    },
    credentials: "include",
  };
  return fetch(url, config);
}

// Paginated request - returns both data and pagination info without unwrapping
async function paginatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaginatedApiResponse<T>> {
  const url = `${API_BASE_URL}${API_PATH}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const json = await response.json().catch(() => null);

    // Handle rate limiting with user-friendly message
    if (response.status === 429 || json?.error?.code === "RATE_LIMITED") {
      throw new ApiError(
        "Too many requests. Please wait a moment and try again.",
        429,
        json?.error || { code: "RATE_LIMITED", retryAfter: json?.error?.retryAfter }
      );
    }

    throw new ApiError(
      json?.error?.message || json?.message || `Request failed with status ${response.status}`,
      response.status,
      json?.error || json
    );
  }

  const json: PaginatedApiResponse<T> = await response.json();
  return json;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  // Paginated GET - returns { data: T[], pagination: {...} }
  paginated: <T>(endpoint: string, options?: RequestInit) =>
    paginatedRequest<T>(endpoint, { ...options, method: "GET" }),

  // Escape hatch for non-JSON endpoints
  raw: rawRequest,
};

/**
 * Validated fetch helper - fetches data and validates with Zod schema
 * @example
 * const feedItems = await getValidated(
 *   '/streams/123/feed',
 *   PaginatedResponseSchema(ContentItemSchema)
 * );
 */
export async function getValidated<T>(
  path: string,
  schema: z.ZodSchema<T>,
  options?: RequestInit
): Promise<T> {
  const response = await api.get<unknown>(path, options);
  return schema.parse(response);
}

// Sample endpoint types (extend as needed)
export interface SampleResponse {
  message: string;
  timestamp: string;
}

// Sample API functions
export const sampleApi = {
  getSample: () => api.get<SampleResponse>("/sample"),
};

// Type guard to check if an error is a rate limit error (429)
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("too many") || msg.includes("rate limit");
  }
  return false;
}

// Type guard to check if an error is a limit error
export function isLimitError(error: unknown): error is ApiError & { data: LimitError } {
  if (!(error instanceof ApiError)) return false;
  const data = error.data as LimitError | undefined;
  return (
    data !== undefined &&
    (data.code === "LIMIT_EXCEEDED" ||
      data.code === "FEATURE_LOCKED" ||
      data.code === "TIER_RESTRICTION") &&
    typeof data.limit === "string"
  );
}

// Extract limit error data from an ApiError
export function getLimitErrorData(error: unknown): LimitError | null {
  if (isLimitError(error)) {
    return error.data;
  }
  return null;
}

export { ApiError };
export type { LimitError, LimitType };
