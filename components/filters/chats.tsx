"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DefaultChatsQuery } from "@/utils/query-params";
import React from "react";

export const ChatFilters: React.FC<{
  filters: typeof DefaultChatsQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultChatsQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
}> = ({ filters, handleClear, setFilters, isAnySearched }) => {
  return (
    <div className="flex items-center justify-start mb-6 gap-4 flex-wrap">
      <Select
        value={filters.chat_type}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, chat_type: value }))}
        key={`chat-type-${filters.chat_type || "empty"}`}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Chat Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="code">Code</SelectItem>
          <SelectItem value="analysis">Analysis</SelectItem>
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
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear All
        </Button>
      )}
    </div>
  );
};
