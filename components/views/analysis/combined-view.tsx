"use client";

import { useCode } from "@/providers/code";
import {
  AnalysisNodeSchema,
  DraftFindingSchema,
  FindingSchema,
} from "@/types/api/responses/security";
import { Shield } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import CodeWithAnnotations, { FindingWithNode } from "./code-with-annotations";
import FileTreeFindings from "./file-tree-findings";

interface CombinedViewProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  version: AnalysisNodeSchema;
  findings: DraftFindingSchema[];
  onAddFindingToContext?: (finding: FindingSchema) => void;
}

const CombinedView: React.FC<CombinedViewProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeVersionId,
  findings,
  onAddFindingToContext,
}) => {
  const { fileId, handleFileChange, nodesQuery } = useCode();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [expandedFindingIds, setExpandedFindingIds] = useState<Set<string>>(new Set());

  // Build list of findings with their associated nodes (for current file)
  const allFindingsWithNodes = useMemo((): FindingWithNode[] => {
    if (!nodesQuery.data) return [];
    const result: FindingWithNode[] = [];
    for (const finding of findings) {
      const node = nodesQuery.data.find((n) => n.id == finding.node_id);
      if (node) result.push({ finding, node });
    }
    return result;
  }, [findings, nodesQuery.data]);

  // Filter findings for the currently selected file
  const findingsForCurrentFile = useMemo(
    () => allFindingsWithNodes.filter((fw) => fw.node.file_id === fileId),
    [allFindingsWithNodes, fileId],
  );

  const handleFindingClick = useCallback(
    (finding: FindingSchema) => {
      const node = nodesQuery.data?.find((n) => n.id == finding.node_id);
      if (!node) return;

      setSelectedFindingId(finding.id);
      setExpandedFindingIds((prev) => new Set([...prev, finding.id]));

      // Switch file if this finding is in a different file
      if (fileId !== node.file_id) {
        handleFileChange(node.file_id);
      }
    },
    [nodesQuery.data, fileId, handleFileChange],
  );

  const handleToggleFinding = useCallback((findingId: string) => {
    setExpandedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) next.delete(findingId);
      else next.add(findingId);
      return next;
    });
    setSelectedFindingId(findingId);
  }, []);

  if (findings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-12">
        <div>
          <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Findings</h3>
          <p className="text-muted-foreground">This analysis version has no security findings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <FileTreeFindings
        teamSlug={teamSlug}
        codeId={codeVersionId}
        selectedFindingId={selectedFindingId}
        onFindingClick={handleFindingClick}
        findings={findings}
      />
      <div className="flex-1 min-w-0 h-full">
        <CodeWithAnnotations
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          nodeId={nodeId}
          codeVersionId={codeVersionId}
          findingsWithNodes={findingsForCurrentFile}
          selectedFindingId={selectedFindingId}
          expandedFindingIds={expandedFindingIds}
          onToggleFinding={handleToggleFinding}
          onAddFindingToContext={onAddFindingToContext}
        />
      </div>
    </div>
  );
};

export default CombinedView;
