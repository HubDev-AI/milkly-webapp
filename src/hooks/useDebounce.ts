import { useState, useEffect } from "react";

/**
 * Custom hook for debouncing a value.
 * Returns the debounced value that only updates after the specified delay
 * has passed since the last change to the input value.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchInput, setSearchInput] = useState("");
 * const debouncedSearch = useDebounce(searchInput, 300);
 *
 * // Use debouncedSearch for API calls, etc.
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
