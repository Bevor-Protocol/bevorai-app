"use client";

import { codeActions } from "@/actions/bevor";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { CodeVersionFilters } from "@/components/filters/code-versions";
import { Pagination } from "@/components/pagination";
import { CodeVersionElement } from "@/components/versions/element";
import { useDebouncedState } from "@/hooks/useDebouncedState";
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
}> = ({ teamSlug, initialQuery, defaultQuery }) => {
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

  return (
    <div className="flex flex-col space-y-6">
      <CodeVersionFilters
        teamSlug={teamSlug}
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
      />
      {hasResults && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {versionsQuery.data?.results.map((version, ind) => (
              <CodeVersionElement
                key={version.id + String(ind)}
                version={version}
                teamSlug={teamSlug}
                isDisabled={isWaiting}
              />
            ))}
          </div>
          <Pagination handlePage={handlePage} results={versionsQuery.data} />
        </>
      )}

      {isEmpty && isAnySearched && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No code versions found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}

      {isEmpty && !isAnySearched && <AnalysisEmpty centered />}
    </div>
  );
};
