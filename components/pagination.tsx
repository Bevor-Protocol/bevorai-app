"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaginationI } from "@/utils/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

export const Pagination: React.FC<{
  filters: { [key: string]: string | undefined };
  setFilters: React.Dispatch<React.SetStateAction<{ [key: string]: string | undefined }>>;
  results: PaginationI;
  className?: string;
}> = ({ filters, setFilters, results, className }) => {
  // generic pagination. Rely on server-side + query params
  const currentPage = parseInt(filters.page ?? "0");
  const prevPage = currentPage > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1;

  const totalPages = results.total_pages || 1;
  const hasMore = results.more || false;

  const handlePrev = (): void => {
    setFilters((prev) => ({ ...prev, page: prevPage.toString() }));
  };

  const handleNext = (): void => {
    setFilters((prev) => ({ ...prev, page: nextPage.toString() }));
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="grid items-center gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Button variant="outline" disabled={currentPage === 0} onClick={handlePrev}>
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </Button>
        <span className="text-sm text-muted-foreground text-center">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button variant="outline" disabled={!hasMore} onClick={handleNext}>
          <span>Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
