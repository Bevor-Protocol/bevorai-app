"use client";

import { analysisActions } from "@/actions/bevor";
import CombinedView from "@/components/views/analysis/combined-view";
import CollapsibleChatPanel from "@/components/views/chat/analysis-panel";
import { useChat } from "@/providers/chat";
import { CodeProvider } from "@/providers/code";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";

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
  isOwner,
}) => {
  const { addFinding, removeFinding, attributes } = useChat();

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

  const findingContext = useMemo(() => {
    const findingAttributeIds = new Set(
      attributes.filter((attr) => attr.type === "finding").map((attr) => attr.id),
    );
    return findings.filter((finding) => findingAttributeIds.has(finding.id));
  }, [attributes, findings]);

  const addFindingToContext = (finding: FindingSchema): void => {
    addFinding(finding);
  };

  const removeFindingFromContext = (findingId: string): void => {
    removeFinding(findingId);
  };

  return (
    <CodeProvider codeId={codeVersionId} initialFileId={null} teamSlug={teamSlug}>
      <div className="flex flex-1 min-h-0 gap-4">
        <div className="min-h-0 min-w-0 flex-1">
          <CombinedView
            codeVersionId={codeVersionId}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            nodeId={nodeId}
            version={version}
            findings={findings}
            onAddFindingToContext={addFindingToContext}
          />
        </div>
        {isOwner && (
          <CollapsibleChatPanel
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            nodeId={nodeId}
            findingContext={findingContext}
            onRemoveFindingFromContext={removeFindingFromContext}
          />
        )}
      </div>
    </CodeProvider>
  );
};

export default AnalysisClient;
