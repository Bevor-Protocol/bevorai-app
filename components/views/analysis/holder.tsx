"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import React, { useEffect, useState } from "react";
import FindingDescription from "./description";
import FindingMetadata from "./finding";
import AnalysisScopes, { levelOrder } from "./scopes";
import AnalysisCodeSnippet from "./snippet";

const AnalysisHolder: React.FC<{
  nodeId: string;
  codeVersionId: string;
  teamSlug: string;
  projectSlug: string;
  initialFinding?: FindingSchema;
  validatedFindingNames?: Set<string>;
  onAddFindingToContext?: (finding: FindingSchema) => void;
  onAddToValidated?: (finding: FindingSchema) => void;
}> = ({
  teamSlug,
  codeVersionId,
  projectSlug,
  nodeId,
  initialFinding,
  validatedFindingNames,
  onAddFindingToContext,
  onAddToValidated,
}) => {
  const [selectedFinding, setSelectedFindingState] = useState<FindingSchema | undefined>(
    initialFinding,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(initialFinding?.node_id);
  const setSelectedFinding: React.Dispatch<React.SetStateAction<FindingSchema | undefined>> = (
    value,
  ) => {
    setSelectedFindingState((prev) => {
      const nextFinding = typeof value === "function" ? value(prev) : value;
      setSelectedNodeId(nextFinding?.node_id);
      return nextFinding;
    });
  };

  const { data: version, isLoading } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const 

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedNodeId ?? ""),
    queryFn: () =>
      codeActions.getNode(teamSlug, version.code_version_id, selectedNodeId ?? "").then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!selectedNodeId,
  });

  useEffect(() => {
    if (!selectedFinding && version && version.findings.length > 0) {
      let isFound = false;
      for (const scope of version.scopes) {
        if (isFound) {
          break;
        }
        const findings = version.findings.filter((f) => f.source_node_id === scope.source_node_id);
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
      <AnalysisScopes
        version={version}
        selectedFinding={selectedFinding}
        onSelectFinding={setSelectedFinding}
        validatedFindingNames={validatedFindingNames}
      />

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
                  validatedFindingNames={validatedFindingNames}
                  onAddFindingToContext={onAddFindingToContext}
                  onAddToValidated={onAddToValidated}
                />
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <AnalysisCodeSnippet
                  teamSlug={teamSlug}
                  codeId={codeVersionId}
                  nodeId={selectedNodeId ?? ""}
                />
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Details panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex flex-col h-full">
              <FindingDescription
                teamSlug={teamSlug}
                nodeId={nodeId}
                finding={selectedFinding}
                setSelectedFinding={setSelectedFinding}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default AnalysisHolder;
