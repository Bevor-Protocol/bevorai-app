"use client";

import { analysisActions } from "@/actions/bevor";
import { AnalysisElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { AnalysisThreadFilters } from "@/components/filters/analysis-threads";
import { Pagination } from "@/components/pagination";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisThreadsQuery } from "@/utils/query-params";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";

/*
  initial query will come from the server. Subsequent queries/filters will stay on the client.
  we want to take advantage of client-side caching.

  initialQuery: how the page should hydrate. default queries according to query params or page routing
  defaultQuery: what the state should reset to.
*/

export const AnalysisThreadsView: React.FC<{
  teamSlug: string;
  initialQuery: typeof DefaultAnalysisThreadsQuery;
  defaultQuery: typeof DefaultAnalysisThreadsQuery;
}> = ({ teamSlug, initialQuery, defaultQuery }) => {
  const [filters, setFilters] = useState(initialQuery);
  const { debouncedState, timerRef, isWaiting } = useDebouncedState(filters);

  const analysesQuery = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, debouncedState),
    queryFn: () => analysisActions.getAnalyses(teamSlug, debouncedState),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters)
      .filter(([k]) => !["page_size", "page", "order"].includes(k))
      .some(
        ([k, v]) =>
          !!v &&
          defaultQuery[k as keyof typeof DefaultAnalysisThreadsQuery] !=
            filters[k as keyof typeof DefaultAnalysisThreadsQuery],
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

  const hasResults = analysesQuery.data && analysesQuery.data.results.length > 0;
  const isEmpty = analysesQuery.data && analysesQuery.data.results.length === 0;

  return (
    <div className="flex flex-col space-y-6">
      <AnalysisThreadFilters
        teamSlug={teamSlug}
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
      />
      
      {hasResults && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {analysesQuery.data?.results.map((analysis, ind) => (
              <AnalysisElement
                key={analysis.id + String(ind)}
                analysis={analysis}
                teamSlug={teamSlug}
                isDisabled={isWaiting}
              />
            ))}
          </div>
          <Pagination handlePage={handlePage} results={analysesQuery.data} />
        </>
      )}

      {isEmpty && isAnySearched && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No analyses found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}

      {isEmpty && !isAnySearched && <AnalysisEmpty centered />}
    </div>
  );
};
