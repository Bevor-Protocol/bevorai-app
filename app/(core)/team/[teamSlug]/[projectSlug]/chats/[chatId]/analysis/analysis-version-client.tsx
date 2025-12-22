"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { FindingSchemaI } from "@/utils/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CodeSnippet, FindingMetadata, FindingTabs } from "./finding";
import { levelOrder, ScopesList } from "./scopes";

export const AnalysisVersionClient: React.FC<{
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug, nodeId }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingSchemaI | null>(null);

  const { data: version, isLoading } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () => analysisActions.getAnalysisDetailed(teamSlug, nodeId),
  });

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedFinding?.code_version_node_id ?? ""),
    queryFn: () =>
      codeActions.getNode(
        teamSlug,
        version.code_version_id,
        selectedFinding?.code_version_node_id ?? "",
      ),
    enabled: !!selectedFinding,
  });

  useEffect(() => {
    if (!selectedFinding && version && version.findings.length > 0) {
      for (const scope of version.scopes) {
        const findings = version.findings.filter(
          (f) => f.code_version_node_id === scope.code_version_node_id,
        );
        for (const level of levelOrder) {
          const firstFinding = findings.find((finding) => finding.level === level);
          if (firstFinding) {
            setSelectedFinding(firstFinding);
            break;
          }
        }
      }
    }
  }, [selectedFinding, version]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Findings</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-w-0">
        <ScopesList
          teamSlug={teamSlug}
          nodeId={nodeId}
          analysisResult={version}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
        />
        {!selectedFinding ? (
          <div className="flex items-center justify-center text-center py-12">
            <div>
              <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Findings</h3>
              <p className="text-muted-foreground">
                This analysis version has no security findings.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FindingMetadata
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              nodeId={nodeId}
              finding={selectedFinding}
              nodeQuery={nodeQuery}
            />
            <CodeSnippet nodeQuery={nodeQuery} />
            <FindingTabs
              teamSlug={teamSlug}
              nodeId={nodeId}
              finding={selectedFinding}
              setSelectedFinding={setSelectedFinding}
            />
          </div>
        )}
      </div>
    </div>
  );
};
