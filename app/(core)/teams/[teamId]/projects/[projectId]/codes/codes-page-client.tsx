"use client";

import { teamActions, versionActions } from "@/actions/bevor";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
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
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import { defaultCodesQuery } from "@/utils/queries";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SOURCE_TYPES = [
  { value: "scan", label: "Scan" },
  { value: "paste", label: "Paste" },
  { value: "upload_file", label: "Upload File" },
  { value: "upload_folder", label: "Upload Folder" },
  { value: "repository", label: "Repository" },
];

const NETWORKS = [
  { value: "eth", label: "Ethereum" },
  { value: "bsc", label: "BSC" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
  { value: "avax", label: "Avalanche" },
  { value: "mode", label: "Mode" },
  { value: "arb", label: "Arbitrum" },
  { value: "eth_sepolia", label: "Ethereum Sepolia" },
  { value: "bsc_test", label: "BSC Testnet" },
  { value: "polygon_amoy", label: "Polygon Amoy" },
  { value: "base_sepolia", label: "Base Sepolia" },
  { value: "avax_fuji", label: "Avalanche Fuji" },
  { value: "mode_testnet", label: "Mode Testnet" },
  { value: "arb_sepolia", label: "Arbitrum Sepolia" },
];

const CodeVersionsData: React.FC<{
  teamId: string;
  projectId: string;
  query: { [key: string]: string | undefined };
}> = ({ teamId, projectId, query }) => {
  // initial render will be from the server. Subsequent filtering come from the client. We want to enable
  // routing, but we won't update the route on each applied filter.
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState(query);

  const versionsQuery = useQuery({
    queryKey: [QUERY_KEYS.CODES, teamId, filters],
    queryFn: () => versionActions.getVersions(teamId, filters),
    placeholderData: keepPreviousData,
  });

  const isAnySearched = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => {
      if (k === "page_size" || k === "page" || k === "project_id" || k === "order") {
        return false;
      }
      return v !== null && v !== undefined;
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
          {versionsQuery.data?.results.map((version, ind) => (
            <CodeVersionElement
              key={version.id + String(ind)}
              version={version}
              teamId={teamId}
              isDisabled={versionsQuery.isLoading || versionsQuery.isFetching || isSearching}
            />
          ))}
        </div>
        {versionsQuery.data && versionsQuery.data.results.length === 0 && isAnySearched && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No code versions found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
        {versionsQuery.data && versionsQuery.data.results.length === 0 && !isAnySearched && (
          <VersionEmpty centered />
        )}
      </ScrollArea>
      <Pagination
        filters={filters}
        setFilters={setFilters}
        results={versionsQuery.data ?? { more: false, total_pages: 0 }}
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

  // Debounce the search query to prevent excessive API calls
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, identifier: searchQuery }));
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
    setFilters(defaultCodesQuery(projectId));
    setSearchQuery(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <SearchInput
            type="text"
            placeholder="Search code versions..."
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
            value={filters.method}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, method: value }))}
            key={`method-${filters.method || "empty"}`}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source Type" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.network}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, network: value }))}
            key={`network-${filters.network || "empty"}`}
          >
            <SelectTrigger className="w-[180px]">
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

export default CodeVersionsData;
