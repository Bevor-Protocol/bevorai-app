"use client";

import { projectActions } from "@/actions/bevor";
import CreateProjectModal from "@/components/Modal/create-project";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { generateQueryKey } from "@/utils/constants";
import { defaultProjectsQuery } from "@/utils/queries";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export const ProjectCreate: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        <Button>
          <Plus className="size-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CreateProjectModal teamSlug={teamSlug} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};

const ProjectsPageClient: React.FC<{
  teamSlug: string;
  query: { [key: string]: string | undefined };
}> = ({ teamSlug, query }) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const { debouncedState, timerRef } = useDebouncedState(searchQuery);

  const {
    data: projects,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, debouncedState),
    queryFn: () => projectActions.getProjects(teamSlug, debouncedState),
    placeholderData: keepPreviousData,
  });

  const handleSearch = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, name: value }));
  }, []);

  const handleTag = useCallback((value: string) => {
    setSearchQuery((prev) => ({ ...prev, tag: value }));
  }, []);

  const handleClearAll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSearchQuery(defaultProjectsQuery());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAnySearched = useMemo(() => {
    return Object.entries(searchQuery).some(([k, v]) => {
      if (k === "page_size" || k === "page" || k === "project_id" || k === "order") {
        return false;
      }
      return !!v;
    });
  }, [searchQuery]);

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
          {isAnySearched && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="w-full pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {projects?.results.map((project) => (
            <ProjectElement key={project.id} project={project} isDisabled={isSearching} />
          ))}
        </div>
      </ScrollArea>
      {projects && projects.results.length === 0 && (debouncedState.name || debouncedState.tag) && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <h3 className="text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms</p>
        </div>
      )}
      {projects && projects.results.length === 0 && !debouncedState.name && !debouncedState.tag && (
        <ProjectEmpty centered />
      )}
    </div>
  );
};

export default ProjectsPageClient;
