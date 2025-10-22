"use client";

import { projectActions } from "@/actions/bevor";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { SearchInput } from "@/components/ui/input";
import { TeamSchemaI } from "@/utils/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ProjectsPageClientProps {
  team: TeamSchemaI;
}

const ProjectsPageClient: React.FC<ProjectsPageClientProps> = ({ team }) => {
  const [searchQuery, setSearchQuery] = useState({ page_size: "6", name: "", tag: "" });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState({
    page_size: "6",
    name: "",
    tag: "",
  });
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
    queryKey: ["projects", team.id, debouncedSearchQuery],
    queryFn: () => projectActions.getProjects(debouncedSearchQuery),
    placeholderData: keepPreviousData,
  });

  const handleSearch = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, name: value }));
  }, []);

  const handleTag = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, tag: value }));
  }, []);

  const isSearching = useMemo(() => isLoading || isFetching, [isLoading, isFetching]);

  return (
    <div className="max-w-7xl mx-auto">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects &&
          projects.results.map((project) => (
            <ProjectElement
              key={project.id}
              project={project}
              teamId={team.id}
              isDisabled={isSearching}
            />
          ))}
      </div>
      {projects &&
        projects.results.length === 0 &&
        (debouncedSearchQuery.name || debouncedSearchQuery.tag) && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
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

export default ProjectsPageClient;
