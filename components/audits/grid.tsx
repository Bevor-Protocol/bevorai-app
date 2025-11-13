"use client";

import { analysisActions } from "@/actions/bevor";
import { AnalysisElement, AnalysisElementLoader } from "@/components/audits/element";
import { AnalysisEmpty } from "@/components/audits/empty";
import { QUERY_KEYS } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export const AnalysisGrid: React.FC<{ query: Record<string, string>; teamId: string }> = ({
  query,
  teamId,
}) => {
  const { data: audits, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SECURITY, teamId, query],
    queryFn: () => analysisActions.getAnalyses(teamId, query),
  });

  if (!audits || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AnalysisElementLoader key={index} />
        ))}
      </div>
    );
  }

  if (audits.results.length === 0) {
    return <AnalysisEmpty centered />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.results.map((audit) => (
        <AnalysisElement key={audit.id} audit={audit} teamId={teamId} />
      ))}
    </div>
  );
};
