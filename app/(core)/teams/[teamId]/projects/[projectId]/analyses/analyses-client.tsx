"use client";

import { analysisActions, projectActions, teamActions } from "@/actions/bevor";
import { AnalysisElement } from "@/components/audits/element";
import { AnalysisEmpty } from "@/components/audits/empty";
import CreateAnalysisModal from "@/components/Modal/create-analysis";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import { defaultAnalysesQuery } from "@/utils/queries";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const AnalysisCreate: React.FC<{ teamId: string; projectId: string }> = ({
  teamId,
  projectId,
}) => {
  const { data: project } = useQuery({
    queryKey: ["projects", teamId, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!!project && <CreateAnalysisModal teamId={teamId} project={project} />}
      </DialogContent>
    </Dialog>
  );
};

const AnalysesData: React.FC<{
  teamId: string;
  projectId: string;
  query: { [key: string]: string | undefined };
}> = ({ teamId, projectId, query }) => {
  // initial render will be from the server. Subsequent filtering come from the client. We want to enable
  // routing, but we won't update the route on each applied filter.
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState(query);

  const analysesQuery = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, teamId, filters],
    queryFn: () => analysisActions.getAnalyses(teamId, filters),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => {
      if (k === "page_size" || k === "page" || k === "project_id" || k === "order") {
        return false;
      }
      return v !== null && v !== undefined && v !== "";
    });
  }, [filters]);

  return (
    <div className="grow flex flex-col">
      <Filters
        teamId={teamId}
        projectId={projectId}
        filters={filters}
        setFilters={setFilters}
        isAnySearched={isAnySearched}
        setIsSearching={setIsSearching}
      />
      <ScrollArea className={cn("w-full pb-4 grow", isSearching && "opacity-75")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysesQuery.data?.results.map((analysis, ind) => (
            <AnalysisElement
              key={analysis.id + String(ind)}
              analysis={analysis}
              teamId={teamId}
              isDisabled={analysesQuery.isLoading || analysesQuery.isFetching || isSearching}
            />
          ))}
        </div>
        {analysesQuery.data && analysesQuery.data.results.length === 0 && isAnySearched && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No analyses found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
        {analysesQuery.data && analysesQuery.data.results.length === 0 && !isAnySearched && (
          <AnalysisEmpty centered />
        )}
      </ScrollArea>
      <Pagination
        filters={filters}
        setFilters={setFilters}
        results={analysesQuery.data ?? { more: false, total_pages: 0 }}
      />
    </div>
  );
};

const Filters: React.FC<{
  teamId: string;
  projectId: string;
  filters: { [key: string]: string | undefined };
  setFilters: React.Dispatch<React.SetStateAction<{ [key: string]: string | undefined }>>;
  isAnySearched: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ teamId, projectId, filters, setFilters, isAnySearched, setIsSearching }) => {
  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const timerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, name: searchQuery }));
      setIsSearching(false);
    }, 500);

    return (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [searchQuery, setFilters, setIsSearching]);

  const { data: members } = useQuery({
    queryKey: [QUERY_KEYS.MEMBERS, teamId],
    queryFn: () => teamActions.getMembers(teamId),
    enabled: !!teamId,
  });

  const handleClearAll = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setFilters(defaultAnalysesQuery(projectId));
    setSearchQuery(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <SearchInput
            type="text"
            placeholder="Search analyses..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-60"
          />
          <Select
            value={filters.user_id}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
            key={`user-${filters.user_id || "empty"}`}
          >
            <SelectTrigger className="w-[180px]">
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
          <Select
            value={filters.order || "desc"}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, order: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
          {isAnySearched && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysesData;
