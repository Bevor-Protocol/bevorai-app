"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaginationI } from "@/utils/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

/*
Generic pagination pattern.
*/
export const Pagination: React.FC<{
  handlePage: (page: number) => void;
  results?: PaginationI;
  className?: string;
}> = ({ handlePage, results, className }) => {
  const currentPage = results?.page ?? 0;
  const prevPage = currentPage > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1;

  const totalPages = results?.total_pages || 1;
  const hasMore = results?.more || false;

  if (!results || totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between border-t pt-4", className)}>
      <div className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          disabled={currentPage === 0} 
          onClick={() => handlePage(prevPage)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={!hasMore} 
          onClick={() => handlePage(nextPage)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
