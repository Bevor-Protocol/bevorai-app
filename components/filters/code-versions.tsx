"use client";

import { projectActions, teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { generateQueryKey, NETWORKS } from "@/utils/constants";
import { DefaultCodesQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import React, { useState } from "react";

const SOURCE_TYPES = [
  { value: "scan", label: "Scan" },
  { value: "raw", label: "Raw Upload" },
  { value: "repository", label: "Repository" },
];

const FilterContent: React.FC<{
  teamSlug: string;
  filters: typeof DefaultCodesQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultCodesQuery>>;
  includeProject: boolean;
  variant?: "mobile" | "desktop";
}> = ({ teamSlug, filters, setFilters, includeProject, variant = "mobile" }) => {
  const isMobile = variant === "mobile";
  const selectWidth = isMobile ? "w-full" : "w-[180px]";
  const containerClass = isMobile
    ? "flex flex-col gap-4"
    : "hidden md:flex items-center justify-start gap-2 md:gap-4 flex-wrap";

  const { data: members } = useQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: () =>
      teamActions.getMembers(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: projects } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, { page_size: "10" }),
    queryFn: async () =>
      projectActions.getProjects(teamSlug, { page_size: "10" }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: includeProject,
  });

  return (
    <div className={containerClass}>
      <div className="relative">
        <Select
          value={filters.user_id}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
          key={`user-${filters.user_id || "empty"}`}
        >
          <SelectTrigger className={cn(selectWidth, filters.user_id && "pr-7")}>
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            {members?.map((member) => (
              <SelectItem key={member.user.id} value={member.user.id}>
                <Icon size="sm" seed={member.user.id} />
                {member.user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.user_id && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setFilters((prev) => ({ ...prev, user_id: "" }));
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      {includeProject && (
        <div className="relative">
          <Select
            value={filters.project_slug}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, project_slug: value }))}
            key={`project-${filters.project_slug || "empty"}`}
          >
            <SelectTrigger className={cn(selectWidth, filters.project_slug && "pr-7")}>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.results?.map((project) => (
                <SelectItem key={project.slug} value={project.slug}>
                  <Icon size="sm" seed={project.slug} className="shrink-0" />
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.project_slug && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setFilters((prev) => ({ ...prev, project_slug: "" }));
              }}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      )}
      <div className="relative">
        <Select
          value={filters.method}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, method: value }))}
          key={`method-${filters.method || "empty"}`}
        >
          <SelectTrigger className={cn(selectWidth, filters.method && "pr-7")}>
            <SelectValue placeholder="Upload Method" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.method && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setFilters((prev) => ({ ...prev, method: "" }));
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <div className="relative">
        <Select
          value={filters.network}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, network: value }))}
          key={`network-${filters.network || "empty"}`}
        >
          <SelectTrigger className={cn(selectWidth, filters.network && "pr-7")}>
            <SelectValue placeholder="Network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((network) => (
              <SelectItem key={network.value} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.network && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setFilters((prev) => ({ ...prev, network: "" }));
            }}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <div className="relative">
        <Select
          value={filters.order || "desc"}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, order: value }))}
        >
          <SelectTrigger className={selectWidth}>
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export const CodeVersionFilters: React.FC<{
  teamSlug: string;
  filters: typeof DefaultCodesQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultCodesQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
  includeProject: boolean;
}> = ({ teamSlug, filters, handleClear, setFilters, isAnySearched, includeProject }) => {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="py-4 sticky top-subheader z-10 bg-background">
      <div className="flex items-center justify-start flex-wrap gap-2 md:gap-4">
        <div className={cn("relative ", isMobile ? "flex-1 min-w-0" : "flex-1 min-w-60 max-w-80")}>
          <SearchInput
            type="text"
            placeholder="Search code versions..."
            value={filters.identifier || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, identifier: e.target.value }))}
            className="w-full pr-8"
          />
          {filters.identifier && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setFilters((prev) => ({ ...prev, identifier: "" }))}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
        {isMobile ? (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <div className="relative shrink-0 overflow-visible">
                <Button variant="ghost" size="sm" className="relative">
                  <SlidersHorizontal className="size-4" />
                  {isAnySearched && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
                  )}
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <div className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="flex-1 px-4 pb-4 overflow-y-auto">
                  <FilterContent
                    teamSlug={teamSlug}
                    filters={filters}
                    setFilters={setFilters}
                    includeProject={includeProject}
                  />
                  {isAnySearched && (
                    <Button
                      variant="outline"
                      className="w-full mt-6"
                      onClick={() => {
                        handleClear();
                        setSheetOpen(false);
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <FilterContent
              teamSlug={teamSlug}
              filters={filters}
              setFilters={setFilters}
              includeProject={includeProject}
              variant="desktop"
            />
            {isAnySearched && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
                Clear All
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
