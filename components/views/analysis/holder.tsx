"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { FindingSchemaI } from "@/utils/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import FindingDescription from "./description";
import FindingMetadata from "./finding";
import AnalysisScopes, { levelOrder } from "./scopes";
import AnalysisCodeSnippet from "./snippet";

const AnalysisHolder: React.FC<{
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
  initialFinding?: FindingSchemaI;
  onAddFindingToContext?: (finding: FindingSchemaI) => void;
}> = ({ teamSlug, projectSlug, nodeId, initialFinding, onAddFindingToContext }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingSchemaI | undefined>(
    initialFinding,
  );

  const { data: version, isLoading } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedFinding?.code_version_node_id ?? ""),
    queryFn: () =>
      codeActions
        .getNode(teamSlug, version.code_version_id, selectedFinding?.code_version_node_id ?? "")
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    enabled: !!selectedFinding,
  });

  useEffect(() => {
    if (!selectedFinding && version && version.findings.length > 0) {
      let isFound = false;
      for (const scope of version.scopes) {
        if (isFound) {
          break;
        }
        const findings = version.findings.filter(
          (f) => f.code_version_node_id === scope.code_version_node_id,
        );
        for (const level of levelOrder) {
          const firstFinding = findings.find((finding) => finding.level === level);
          if (firstFinding) {
            setSelectedFinding(firstFinding);
            isFound = true;
            break;
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFinding]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Findings</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-w-0">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 min-w-0 max-w-full h-full">
      <AnalysisScopes
        version={version}
        selectedFinding={selectedFinding}
        onSelectFinding={setSelectedFinding}
      />
      {!selectedFinding ? (
        <div className="flex items-center justify-center text-center py-12">
          <div>
            <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Findings</h3>
            <p className="text-muted-foreground">This analysis version has no security findings.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full h-full min-h-0 overflow-hidden">
          <FindingMetadata
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            nodeId={nodeId}
            finding={selectedFinding}
            nodeQuery={nodeQuery}
            onAddFindingToContext={onAddFindingToContext}
          />
          <AnalysisCodeSnippet nodeQuery={nodeQuery} />
          <FindingDescription
            teamSlug={teamSlug}
            nodeId={nodeId}
            finding={selectedFinding}
            setSelectedFinding={setSelectedFinding}
          />
        </div>
      )}
    </div>
  );
};

export default AnalysisHolder;
