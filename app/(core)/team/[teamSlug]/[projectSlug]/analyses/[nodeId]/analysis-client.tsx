"use client";

import { analysisActions } from "@/actions/bevor";
import CombinedView from "@/components/views/analysis/combined-view";
import { useChat } from "@/providers/chat";
import { CodeProvider } from "@/providers/code";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

interface AnalysisClientProps {
  teamSlug: string;
  codeVersionId: string;
  projectSlug: string;
  nodeId: string;
  initialFinding?: FindingSchema;
  isOwner: boolean;
}

const AnalysisClient: React.FC<AnalysisClientProps> = ({
  teamSlug,
  codeVersionId,
  projectSlug,
  nodeId,
}) => {
  const { addFinding } = useChat();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysis(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: findings } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisFindings(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisFindings(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <CodeProvider codeId={codeVersionId} initialFileId={null} teamSlug={teamSlug}>
      <div className="flex flex-1 min-h-0">
        <div className="min-h-0 min-w-0 flex-1">
          <CombinedView
            codeVersionId={codeVersionId}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            nodeId={nodeId}
            version={version}
            findings={findings}
            onAddFindingToContext={addFinding}
          />
        </div>
      </div>
    </CodeProvider>
  );
};

export default AnalysisClient;
