"use client";

import { analysisActions } from "@/actions/bevor";
import type { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import React from "react";
import AnalysisClient from "./analysis-client";
import AnalysisProgress from "./analysis-progress";

interface AnalysisWorkspaceClientProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  initialFinding?: FindingSchema;
  isOwner: boolean;
}

const AnalysisWorkspaceClient: React.FC<AnalysisWorkspaceClientProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeVersionId,
  initialFinding,
  isOwner,
}) => {
  const { data: analysis, isError } = useQuery({
    queryKey: generateQueryKey.analysis(nodeId),
    queryFn: async () => {
      const r = await analysisActions.getAnalysis(teamSlug, nodeId);
      if (!r.ok) throw r;
      return r.data;
    },
  });

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-destructive">Could not load this analysis.</p>
        <p className="text-xs text-muted-foreground">Refresh the page or try again later.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading analysis…</p>
      </div>
    );
  }

  if (analysis.status === "waiting" || analysis.status === "processing") {
    return <AnalysisProgress teamSlug={teamSlug} projectSlug={projectSlug} analysisId={nodeId} />;
  }

  return (
    <AnalysisClient
      codeVersionId={codeVersionId}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
      nodeId={nodeId}
      initialFinding={initialFinding}
      isOwner={isOwner}
    />
  );
};

export default AnalysisWorkspaceClient;
