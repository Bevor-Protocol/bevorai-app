"use client";

import { teamActions } from "@/actions/bevor";
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
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultAnalysisThreadsQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import React from "react";

export const AnalysisThreadFilters: React.FC<{
  teamSlug: string;
  filters: typeof DefaultAnalysisThreadsQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultAnalysisThreadsQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
}> = ({ teamSlug, filters, handleClear, setFilters, isAnySearched }) => {
  const { data: members } = useQuery({
    queryKey: generateQueryKey.members(teamSlug),
    queryFn: () => teamActions.getMembers(teamSlug),
  });

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative min-w-60">
        <SearchInput
          type="text"
          placeholder="Search analyses..."
          value={filters.name || ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
          className="min-w-60 pr-8"
        />
        {filters.name && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setFilters((prev) => ({ ...prev, name: "" }))}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
      <div className="relative">
        <Select
          value={filters.user_id}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, user_id: value }))}
          key={`user-${filters.user_id || "empty"}`}
        >
          <SelectTrigger className={cn("w-[180px]", filters.user_id && "pr-7")}>
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
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear All
        </Button>
      )}
    </div>
  );
};
