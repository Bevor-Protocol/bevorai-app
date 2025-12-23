"use client";

import { codeActions } from "@/actions/bevor";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { CodeVersionFilters } from "@/components/filters/code-versions";
import { Pagination } from "@/components/pagination";
import { CodeVersionElement } from "@/components/versions/element";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultCodesQuery } from "@/utils/query-params";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";

/*
  initial query will come from the server. Subsequent queries/filters will stay on the client.
  we want to take advantage of client-side caching.

  initialQuery: how the page should hydrate. default queries according to query params or page routing
  defaultQuery: what the state should reset to.
*/

export const CodeVersionsView: React.FC<{
  teamSlug: string;
  initialQuery: typeof DefaultCodesQuery;
  defaultQuery: typeof DefaultCodesQuery;
  showRepo?: boolean;
}> = ({ teamSlug, initialQuery, defaultQuery, showRepo = false }) => {
  const [filters, setFilters] = useState(initialQuery);
  const { debouncedState, timerRef, isWaiting } = useDebouncedState(filters);

  const versionsQuery = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, debouncedState),
    queryFn: () => codeActions.getVersions(teamSlug, debouncedState),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters)
      .filter(([k]) => !["page_size", "page", "order"].includes(k))
      .some(
        ([k, v]) =>
          !!v &&
          defaultQuery[k as keyof typeof DefaultCodesQuery] !=
            filters[k as keyof typeof DefaultCodesQuery],
      );
  }, [filters, defaultQuery]);

  const handlePage = (page: number): void => {
    setFilters((prev) => ({ ...prev, page: String(page) }));
  };

  const handleClear = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setFilters(defaultQuery);
  };

  const hasResults = versionsQuery.data && versionsQuery.data.results.length > 0;
  const isEmpty = versionsQuery.data && versionsQuery.data.results.length === 0;
  const isFetching = versionsQuery.isFetching && !versionsQuery.data;

  return (
    <div className="flex flex-col">
      <CodeVersionFilters
        teamSlug={teamSlug}
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
        includeProject={!defaultQuery.project_slug}
      />
      <div className="relative min-h-[200px] overflow-x-hidden">
        {hasResults && (
          <div className="overflow-x-auto -mx-6 px-6">
            <div
              className={cn(
                "grid grid-cols-1 gap-3 transition-opacity duration-500 ease-in-out min-w-max",
                versionsQuery.isFetching ? "opacity-50" : "opacity-100",
              )}
            >
              {versionsQuery.data?.results.map((version) => (
                <CodeVersionElement
                  key={version.id}
                  version={version}
                  teamSlug={teamSlug}
                  isDisabled={isWaiting || versionsQuery.isFetching}
                  showRepo={showRepo}
                />
              ))}
            </div>
          </div>
        )}

        {hasResults && versionsQuery.data && (
          <div
            className={cn(
              "transition-opacity duration-500 ease-in-out",
              versionsQuery.isFetching ? "opacity-50" : "opacity-100",
            )}
          >
            <Pagination handlePage={handlePage} results={versionsQuery.data} />
          </div>
        )}

        {isEmpty && isAnySearched && !isFetching && (
          <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-200">
            <Search className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No code versions found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}

        {isEmpty && !isAnySearched && !isFetching && (
          <div className="animate-in fade-in duration-200">
            <AnalysisEmpty centered />
          </div>
        )}

        {isFetching && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-200">
            <div className="size-12 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};
