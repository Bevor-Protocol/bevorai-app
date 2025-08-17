import { QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Hook for SSR-friendly queries with initial data hydration.
 *
 * This hook prevents unnecessary refetching when you already have server-side data,
 * while still supporting React Query's invalidation system.
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useQueryWithHydration({
 *   queryKey: ["teams"],
 *   queryFct: () => fetchTeams(),
 *   initialData: serverTeams,
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 * });
 * ```
 *
 * Alternative approach for more complex SSR scenarios:
 * ```tsx
 * // In your layout/page component
 * const queryClient = getQueryClient();
 *
 * // Pre-populate the cache
 * queryClient.setQueryData(["teams"], serverTeams);
 *
 * // In your component
 * const { data } = useQuery({
 *   queryKey: ["teams"],
 *   queryFn: fetchTeams,
 *   staleTime: 5 * 60 * 1000,
 *   refetchOnMount: false,
 * });
 * ```
 */
export const useQueryWithHydration = <TData,>({
  initialData,
  queryKey,
  queryFct,
  staleTime = 5 * 60 * 1000, // 5 minutes
}: {
  queryKey: QueryKey;
  initialData: TData;
  queryFct: () => Promise<TData>;
  staleTime?: number;
}) => {
  const queryClient = useQueryClient();
  const isHydrated = useRef(false);

  // Set initial data on first render
  useEffect(() => {
    if (!isHydrated.current) {
      queryClient.setQueryData(queryKey, initialData);
      isHydrated.current = true;
    }
  }, [queryKey, initialData, queryClient]);

  const result = useQuery({
    queryKey,
    queryFn: queryFct,
    initialData,
    staleTime,
    // Only refetch if data is stale and we're not in SSR
    refetchOnMount: isHydrated.current,
    refetchOnWindowFocus: false,
  });

  // Since we always have initialData, data will never be undefined
  return {
    ...result,
    data: result.data as TData, // Type assertion since we know data exists
  };
};
