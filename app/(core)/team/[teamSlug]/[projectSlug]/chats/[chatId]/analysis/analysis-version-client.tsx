"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisNodeSchemaI, AnalysisResultSchemaI, FindingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CodeSnippet, FindingMetadata, FindingTabs } from "./finding";
import { levelOrder, ScopesList } from "./scopes";

export const AnalysisVersionClient: React.FC<{
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
  analysisVersion: AnalysisNodeSchemaI;
}> = ({ teamSlug, projectSlug, analysisVersion }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingSchemaI | null>(null);

  const { data: analysisResult, isLoading } = useQuery<AnalysisResultSchemaI>({
    queryKey: generateQueryKey.analysisFindings(analysisVersion.id),
    queryFn: () => analysisActions.getFindings(teamSlug, analysisVersion.id),
  });

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedFinding?.code_version_node_id ?? ""),
    queryFn: () =>
      codeActions.getNode(
        teamSlug,
        analysisVersion.code_version_id,
        selectedFinding?.code_version_node_id ?? "",
      ),
    enabled: !!selectedFinding,
  });

  useEffect(() => {
    if (!selectedFinding && analysisResult && analysisResult.findings.length > 0) {
      for (const scope of analysisResult.scopes) {
        const findings = analysisResult.findings.filter(
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
  }, [selectedFinding, analysisResult]);

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
          nodeId={analysisVersion.id}
          analysisResult={analysisResult}
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
              nodeId={analysisVersion.id}
              finding={selectedFinding}
              nodeQuery={nodeQuery}
            />
            <CodeSnippet nodeQuery={nodeQuery} />
            <FindingTabs
              teamSlug={teamSlug}
              nodeId={analysisVersion.id}
              finding={selectedFinding}
              setSelectedFinding={setSelectedFinding}
            />
          </div>
        )}
      </div>
    </div>
  );
};
