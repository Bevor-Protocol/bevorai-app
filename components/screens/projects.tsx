"use client";

import { projectActions } from "@/actions/bevor";
import { ProjectFilters } from "@/components/filters/projects";
import { Pagination } from "@/components/pagination";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { generateQueryKey } from "@/utils/constants";
import { DefaultProjectsQuery } from "@/utils/query-params";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";

export const ProjectsView: React.FC<{
  teamSlug: string;
  initialQuery: typeof DefaultProjectsQuery;
  defaultQuery: typeof DefaultProjectsQuery;
}> = ({ teamSlug, initialQuery, defaultQuery }) => {
  // initial query will come from the server. Subsequent queries/filters will stay on the client.
  // we want to take advantage of client-side caching.
  const [filters, setFilters] = useState(initialQuery);
  const { debouncedState, timerRef, isWaiting } = useDebouncedState(filters);

  const projectsQuery = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, debouncedState),
    queryFn: () =>
      projectActions.getProjects(teamSlug, debouncedState).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters)
      .filter(([k]) => !["page_size", "page", "order"].includes(k))
      .some(
        ([k, v]) =>
          !!v &&
          defaultQuery[k as keyof typeof DefaultProjectsQuery] !=
            filters[k as keyof typeof DefaultProjectsQuery],
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

  const hasResults = projectsQuery.data && projectsQuery.data.results.length > 0;
  const isEmpty = projectsQuery.data && projectsQuery.data.results.length === 0;

  return (
    <div className="flex flex-col space-y-6">
      <ProjectFilters
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        handleClear={handleClear}
      />
      {hasResults && (
        <>
          <div className="grid grid-cols-1 gap-3">
            {projectsQuery.data?.results.map((project) => (
              <ProjectElement key={project.id} project={project} isDisabled={isWaiting} />
            ))}
          </div>
          <Pagination handlePage={handlePage} results={projectsQuery.data} />
        </>
      )}

      {isEmpty && (debouncedState.name || debouncedState.tag) && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No projects found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}

      {isEmpty && !debouncedState.name && !debouncedState.tag && <ProjectEmpty centered />}
    </div>
  );
};
