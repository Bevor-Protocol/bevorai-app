"use client";

import { analysisActions } from "@/actions/bevor";
import { AnalysisVersionElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { AnalysisNodeFilters } from "@/components/filters/nodes";
import { Pagination } from "@/components/pagination";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisNodesQuery } from "@/utils/query-params";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";

/*
  initial query will come from the server. Subsequent queries/filters will stay on the client.
  we want to take advantage of client-side caching.

  initialQuery: how the page should hydrate. default queries according to query params or page routing
  defaultQuery: what the state should reset to.
*/

export const AnalysisNodesHistoryView: React.FC<{
  teamSlug: string;
  initialQuery: typeof DefaultAnalysisNodesQuery;
  defaultQuery: typeof DefaultAnalysisNodesQuery;
  node: AnalysisNodeSchemaI;
}> = ({ teamSlug, initialQuery, node, defaultQuery }) => {
  const [filters, setFilters] = useState(initialQuery);
  const { debouncedState, timerRef, isWaiting } = useDebouncedState(filters);

  const nodesQuery = useQuery({
    queryKey: generateQueryKey.analysisVersions(teamSlug, debouncedState),
    queryFn: () => analysisActions.getAnalysisVersions(teamSlug, debouncedState),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters)
      .filter(([k]) => !["page_size", "page", "order"].includes(k))
      .some(
        ([k, v]) =>
          !!v &&
          defaultQuery[k as keyof typeof DefaultAnalysisNodesQuery] !=
            filters[k as keyof typeof DefaultAnalysisNodesQuery],
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

  const hasResults = nodesQuery.data && nodesQuery.data.results.length > 0;
  const isEmpty = nodesQuery.data && nodesQuery.data.results.length === 0;

  return (
    <div className="flex flex-col space-y-6">
      <AnalysisNodeFilters
        teamSlug={teamSlug}
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
        includeProject={!defaultQuery.project_slug}
      />
      {hasResults && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {nodesQuery.data?.results.map((analysis, ind) => (
              <AnalysisVersionElement
                key={analysis.id + String(ind)}
                analysisVersion={analysis}
                isDisabled={isWaiting}
                className={cn(
                  analysis.id === node.id &&
                    "border-l-2 border-l-blue-300 group-hover:border-l-blue-300",
                  analysis.id === node.parent_node_id &&
                    "border-l-2 border-l-purple-300 group-hover:border-l-purple-300",
                  node.children.includes(analysis.id) &&
                    "border-l-2 border-l-orange-300 group-hover:border-l-orange-300",
                )}
              />
            ))}
          </div>
          <Pagination handlePage={handlePage} results={nodesQuery.data} />
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
