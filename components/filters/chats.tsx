"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DefaultChatsQuery } from "@/utils/query-params";
import { X } from "lucide-react";
import React from "react";

export const ChatFilters: React.FC<{
  filters: typeof DefaultChatsQuery;
  setFilters: React.Dispatch<React.SetStateAction<typeof DefaultChatsQuery>>;
  isAnySearched: boolean;
  handleClear: () => void;
}> = ({ filters, handleClear, setFilters, isAnySearched }) => {
  return (
    <div className="flex items-center justify-start mb-6 gap-4 flex-wrap">
      <div className="relative">
        <Select
          value={filters.chat_type}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, chat_type: value }))}
          key={`chat-type-${filters.chat_type || "empty"}`}
        >
          <SelectTrigger className={cn("w-[180px]", filters.chat_type && "pr-7")}>
            <SelectValue placeholder="Chat Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
          </SelectContent>
        </Select>
        {filters.chat_type && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setFilters((prev) => ({ ...prev, chat_type: "" }));
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
