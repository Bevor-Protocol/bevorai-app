"use client";

import { securityAnalysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export const AuditPagination: React.FC<{ page: string; basePath: string }> = ({
  page,
  basePath,
}) => {
  const currentPage = parseInt(page);
  const prevPage = currentPage > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1;

  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits", page],
    queryFn: () => securityAnalysisActions.getSecurityAnalyses({ page }),
  });

  const totalPages = audits?.total_pages || 1;
  const hasMore = audits?.more || false;

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4">
        {currentPage === 0 || isLoading ? (
          <Button variant="outline" disabled>
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`${basePath}?page=${prevPage}`}>
              <ChevronLeft className="size-4" />
              <span>Previous</span>
            </Link>
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>
        {!hasMore || isLoading ? (
          <Button variant="outline" disabled>
            <span>Next</span>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={`${basePath}?page=${nextPage}`}>
              <span>Next</span>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
