"use client";

import AnalysisHolder from "@/components/views/analysis/holder";
import { FindingSchemaI } from "@/utils/types";
import React, { useState } from "react";
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
  const [findingContext, setFindingContext] = useState<FindingSchemaI[]>([]);

  const addFindingToContext = (finding: FindingSchemaI): void => {
    setFindingContext((prev) => {
      if (prev.some((f) => f.id === finding.id)) {
        return prev;
      }
      return [...prev, finding];
    });
  };

  const removeFindingFromContext = (findingId: string): void => {
    setFindingContext((prev) => prev.filter((f) => f.id !== findingId));
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
