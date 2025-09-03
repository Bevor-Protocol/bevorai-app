"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export const AuditPagination: React.FC<{ page: string; teamSlug: string }> = ({
  page,
  teamSlug,
}) => {
  const currentPage = parseInt(page);
  const prevPage = currentPage > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1;

  const { data: audits, isLoading } = useQuery({
    queryKey: ["audits", page],
    queryFn: () => bevorAction.getAudits({ page }),
  });

  const totalPages = audits?.total_pages || 1;
  const hasMore = audits?.more || false;

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4">
        <Link href={`/teams/${teamSlug}/audits?page=${prevPage}`}>
          <Button
            disabled={currentPage === 0 || isLoading}
            variant="transparent"
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>
        </Link>
        <span className="text-sm text-neutral-400">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Link href={`/teams/${teamSlug}/audits?page=${nextPage}`}>
          <Button
            disabled={!hasMore || isLoading}
            variant="transparent"
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
