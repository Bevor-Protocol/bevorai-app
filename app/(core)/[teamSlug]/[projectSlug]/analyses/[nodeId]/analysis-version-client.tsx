"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisNodeSchemaI, FindingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useMemo, useState } from "react";
import { CodeSnippet, FindingMetadata, FindingTabs } from "./finding";
import { FindingWithScope, levelOrder, ScopesList } from "./scopes";

export const AnalysisVersionClient: React.FC<{
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
  analysisVersion: AnalysisNodeSchemaI;
}> = ({ teamSlug, projectSlug, analysisVersion }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingWithScope | null>(null);

  const { data: scopes = [], isLoading } = useQuery<FindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionFindings(analysisVersion.id),
    queryFn: () => analysisActions.getFindings(teamSlug, analysisVersion.id),
  });

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedFinding?.scope.code_version_node_id ?? ""),
    queryFn: () =>
      codeActions.getNode(
        teamSlug,
        analysisVersion.code_version_id,
        selectedFinding?.scope.code_version_node_id ?? "",
      ),
    enabled: !!selectedFinding,
  });

  const allFindings = useMemo(() => {
    const flattened: FindingWithScope[] = [];
    scopes.forEach((scope) => {
      scope.findings.forEach((finding) => {
        flattened.push({
          ...finding,
          scope: {
            id: scope.id,
            code_version_node_id: scope.code_version_node_id,
            callable: scope.callable,
          },
        });
      });
    });
    return flattened;
  }, [scopes]);

  const initialFinding = useMemo(() => {
    if (allFindings.length === 0) return null;
    for (const level of levelOrder) {
      const firstFinding = allFindings.find((finding) => finding.level === level);
      if (firstFinding) {
        return firstFinding;
      }
    }
    return null;
  }, [allFindings]);

  React.useEffect(() => {
    if (initialFinding && !selectedFinding) {
      setSelectedFinding(initialFinding);
    }
  }, [initialFinding, selectedFinding]);

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
              codeId={analysisVersion.code_version_id}
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
