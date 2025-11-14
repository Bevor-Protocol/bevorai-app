"use client";

import { dashboardActions } from "@/actions/bevor";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { SearchInput } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QUERY_KEYS } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ProjectsTable: React.FC<{
  projectQuery: { page_size: string; name: string; tag: string };
}> = ({ projectQuery }) => {
  const [searchQuery, setSearchQuery] = useState(projectQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(projectQuery);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // Debounce the search query to prevent excessive API calls
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchQuery]);

  const {
    data: projects,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, "overview", debouncedSearchQuery],
    queryFn: async () => dashboardActions.getAllProjects(debouncedSearchQuery),
  });

  const handleSearch = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, name: value }));
  }, []);

  const handleTag = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, tag: value }));
  }, []);

  const isSearching = useMemo(() => isLoading || isFetching, [isLoading, isFetching]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <SearchInput
            type="text"
            placeholder="Search projects..."
            value={searchQuery.name}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <SearchInput
            type="text"
            placeholder="Search by tag..."
            value={searchQuery.tag}
            onChange={(e) => handleTag(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="w-full pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {projects?.results.map((project) => (
            <ProjectElement key={project.id} project={project} isDisabled={isSearching} showTeam />
          ))}
        </div>
      </ScrollArea>
      {projects &&
        projects.results.length === 0 &&
        (debouncedSearchQuery.name || debouncedSearchQuery.tag) && (
          <div className="text-center py-12">
            <Search className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No projects found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      {projects &&
        projects.results.length === 0 &&
        !debouncedSearchQuery.name &&
        !debouncedSearchQuery.tag && <ProjectEmpty centered />}
    </div>
  );
};
