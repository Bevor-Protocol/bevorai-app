"use client";

import { analysisActions } from "@/actions/bevor";
import AnalysisHolder from "@/components/views/analysis/holder";
import { useChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { FindingSchemaI } from "@/utils/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import CollapsibleChatPanel from "./collapsible-chat-panel";

interface AnalysisClientProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  initialFinding?: FindingSchemaI;
  isOwner: boolean;
}

const AnalysisClient: React.FC<AnalysisClientProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  initialFinding,
  isOwner,
}) => {
  const { addFinding, removeFinding, attributes } = useChat();
  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const findingContext = useMemo(() => {
    const findingAttributeIds = new Set(
      attributes.filter((attr) => attr.type === "finding").map((attr) => attr.id),
    );
    return version.findings.filter((finding) => findingAttributeIds.has(finding.id));
  }, [attributes, version.findings]);

  const addFindingToContext = (finding: FindingSchemaI): void => {
    addFinding(finding);
  };

  const removeFindingFromContext = (findingId: string): void => {
    removeFinding(findingId);
  };

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <div className="min-h-0 min-w-0 flex-1">
        <AnalysisHolder
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          nodeId={nodeId}
          initialFinding={initialFinding}
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
  );
};

export default AnalysisClient;
