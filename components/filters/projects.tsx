"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DefaultProjectsQuery } from "@/utils/query-params";
import React from "react";

export const ProjectFilters: React.FC<{
  filters: typeof DefaultProjectsQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultProjectsQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
}> = ({ filters, handleClear, setFilters, isAnySearched }) => {
  return (
    <div className="flex items-center justify-start mb-6 gap-4 flex-wrap">
      <SearchInput
        type="text"
        placeholder="Search projects..."
        value={filters.name || ""}
        onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
      />
      <SearchInput
        type="text"
        placeholder="Search by tag..."
        value={filters.tag}
        onChange={(e) => setFilters((prev) => ({ ...prev, tag: e.target.value }))}
      />
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
