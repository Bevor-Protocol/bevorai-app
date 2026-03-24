"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useValidatedFindings } from "@/hooks/useValidatedFindings";
import { generateQueryKey } from "@/utils/constants";
import { FindingSchemaI } from "@/utils/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import FindingDescription from "./description";
import FindingMetadata from "./finding";
import AnalysisScopes, { levelOrder } from "./scopes";
import AnalysisCodeSnippet from "./snippet";
import ValidatedFindingsPanel from "./validated-findings";

const AnalysisHolder: React.FC<{
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
  username: string;
  initialFinding?: FindingSchemaI;
  onAddFindingToContext?: (finding: FindingSchemaI) => void;
}> = ({ teamSlug, projectSlug, nodeId, username, initialFinding, onAddFindingToContext }) => {
  const [selectedFinding, setSelectedFindingState] = useState<FindingSchemaI | undefined>(
    initialFinding,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    initialFinding?.code_version_node_id,
  );
  const setSelectedFinding: React.Dispatch<React.SetStateAction<FindingSchemaI | undefined>> = (
    value,
  ) => {
    setSelectedFindingState((prev) => {
      const nextFinding = typeof value === "function" ? value(prev) : value;
      setSelectedNodeId(nextFinding?.code_version_node_id);
      return nextFinding;
    });
  };

  const { data: version, isLoading } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedNodeId ?? ""),
    queryFn: () =>
      codeActions.getNode(teamSlug, version.code_version_id, selectedNodeId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!selectedNodeId,
  });

  const { promote } = useValidatedFindings(projectSlug);

  // Map source_finding_id → FindingSchemaI for the current analysis, so the
  // validated panel can navigate to a finding when its row is clicked.
  const currentFindingsMap = useMemo(() => {
    const map = new Map<string, FindingSchemaI>();
    version?.findings.forEach((f) => map.set(f.id, f));
    return map;
  }, [version?.findings]);

  const handleValidate = (finding: FindingSchemaI): void => {
    promote(finding, nodeId, version.code_version_id, username);
  };

  useEffect(() => {
    if (!selectedFinding && version && version.findings.length > 0) {
      let isFound = false;
      for (const scope of version.scopes) {
        if (isFound) break;
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
      <div className="flex h-full gap-4">
        <Skeleton className="w-80 h-full" />
        <Skeleton className="flex-1 h-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full max-w-full mx-auto w-full gap-4">
      <div className="flex flex-col min-h-0 overflow-y-auto">
        <ValidatedFindingsPanel
          projectSlug={projectSlug}
          codeVersionId={version.code_version_id}
          username={username}
          onSelectFinding={(f) => setSelectedFinding(f)}
          currentFindings={currentFindingsMap}
          selectedFindingId={selectedFinding?.id}
        />
        <AnalysisScopes
          version={version}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
        />
      </div>

      {!selectedFinding ? (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <div>
            <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Findings</h3>
            <p className="text-muted-foreground">This analysis version has no security findings.</p>
          </div>
        </div>
      ) : (
        <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <FindingMetadata
                  teamSlug={teamSlug}
                  projectSlug={projectSlug}
                  nodeId={nodeId}
                  finding={selectedFinding}
                  selectedNodeId={selectedNodeId}
                  onSelectNodeId={setSelectedNodeId}
                  nodeQuery={nodeQuery}
                  onAddFindingToContext={onAddFindingToContext}
                  onValidate={handleValidate}
                />
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <AnalysisCodeSnippet nodeQuery={nodeQuery} />
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <FindingDescription
                teamSlug={teamSlug}
                nodeId={nodeId}
                finding={selectedFinding}
                setSelectedFinding={setSelectedFinding}
                onValidate={handleValidate}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default AnalysisHolder;
