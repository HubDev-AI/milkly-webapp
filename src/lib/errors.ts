import { ApiError, isLimitError, isRateLimitError } from "./Api";

/**
 * Error types for classification
 */
export type ErrorType =
  | "RATE_LIMITED"
  | "LIMIT_EXCEEDED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "SERVER_ERROR"
  | "NETWORK"
  | "UNKNOWN";

/**
 * Classified error with type and optional data
 */
export interface ClassifiedError {
  type: ErrorType;
  message: string;
  data?: unknown;
}

/**
 * Default toast messages for each error type
 */
export const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string }> = {
  RATE_LIMITED: {
    title: "Too many attempts",
    description: "Please wait a few minutes before trying again.",
  },
  LIMIT_EXCEEDED: {
    title: "Limit reached",
    description: "You've reached your plan limit.",
  },
  UNAUTHORIZED: {
    title: "Session expired",
    description: "Please sign in again.",
  },
  FORBIDDEN: {
    title: "Access denied",
    description: "You don't have permission to perform this action.",
  },
  NOT_FOUND: {
    title: "Not found",
    description: "The requested resource was not found.",
  },
  VALIDATION: {
    title: "Invalid input",
    description: "Please check your input and try again.",
  },
  SERVER_ERROR: {
    title: "Server error",
    description: "Something went wrong. Please try again later.",
  },
  NETWORK: {
    title: "Connection error",
    description: "Please check your internet connection.",
  },
  UNKNOWN: {
    title: "Error",
    description: "An unexpected error occurred.",
  },
};

/**
 * Check if error is a rate limit error (handles both ApiError and Better Auth errors)
 */
function checkRateLimited(error: unknown): boolean {
  // Check ApiError rate limit
  if (isRateLimitError(error)) return true;

  // Check Better Auth style errors (result.error object)
  if (error && typeof error === "object") {
    const err = error as { status?: number; code?: string; message?: string };
    if (err.status === 429 || err.code === "RATE_LIMITED") return true;
  }

  // Check error message
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("too many") || msg.includes("rate limit")) return true;
  }

  return false;
}

/**
 * Classify an error into a known type
 */
export function classifyError(error: unknown): ClassifiedError {
  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return { type: "NETWORK", message: ERROR_MESSAGES.NETWORK.description };
  }

  // Rate limited - check first as it's common
  if (checkRateLimited(error)) {
    return { type: "RATE_LIMITED", message: ERROR_MESSAGES.RATE_LIMITED.description };
  }

  // Tier/subscription limit errors
  if (isLimitError(error)) {
    return {
      type: "LIMIT_EXCEEDED",
      message: error.data.message || ERROR_MESSAGES.LIMIT_EXCEEDED.description,
      data: error.data,
    };
  }

  // ApiError with status codes
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return { type: "UNAUTHORIZED", message: error.message };
      case 403:
        return { type: "FORBIDDEN", message: error.message };
      case 404:
        return { type: "NOT_FOUND", message: error.message };
      case 422:
        return { type: "VALIDATION", message: error.message, data: error.data };
      default:
        if (error.status >= 500) {
          return { type: "SERVER_ERROR", message: error.message };
        }
        return { type: "UNKNOWN", message: error.message, data: error.data };
    }
  }

  // Better Auth style errors (result.error object with status)
  if (error && typeof error === "object" && "status" in error) {
    const err = error as { status?: number; message?: string };
    if (err.status === 401) {
      return { type: "UNAUTHORIZED", message: err.message || ERROR_MESSAGES.UNAUTHORIZED.description };
    }
    if (err.status === 403) {
      return { type: "FORBIDDEN", message: err.message || ERROR_MESSAGES.FORBIDDEN.description };
    }
    if (err.status === 404) {
      return { type: "NOT_FOUND", message: err.message || ERROR_MESSAGES.NOT_FOUND.description };
    }
    if (err.status && err.status >= 500) {
      return { type: "SERVER_ERROR", message: err.message || ERROR_MESSAGES.SERVER_ERROR.description };
    }
  }

  // Standard Error
  if (error instanceof Error) {
    return { type: "UNKNOWN", message: error.message };
  }

  // String error
  if (typeof error === "string") {
    return { type: "UNKNOWN", message: error };
  }

  return { type: "UNKNOWN", message: ERROR_MESSAGES.UNKNOWN.description };
}

/**
 * Extract error message from various error shapes
 * Handles ApiError.data, nested error objects, and standard Error
 */
export function getErrorMessage(error: unknown): string {
  // ApiError with nested data
  if (error instanceof ApiError) {
    // Check data.message first (API error envelope)
    if (error.data && typeof error.data === "object") {
      const data = error.data as { message?: string; error?: { message?: string } };
      if (data.message) return data.message;
      if (data.error?.message) return data.error.message;
    }
    return error.message;
  }

  // Better Auth style errors
  if (error && typeof error === "object") {
    const err = error as { message?: string; error?: { message?: string } };
    if (err.message) return err.message;
    if (err.error?.message) return err.error.message;
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // String
  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}
