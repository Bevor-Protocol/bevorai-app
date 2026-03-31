"use client";

import { codeActions } from "@/actions/bevor";
import { Shield } from "lucide-react";
import { useCode } from "@/providers/code";
import { AnalysisNodeSchema, FindingSchema } from "@/types/api/responses/security";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { generateQueryKey } from "@/utils/constants";
import { useQueries } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import CodeWithAnnotations, { FindingWithNode } from "./code-with-annotations";
import FileTreeFindings from "./file-tree-findings";

interface CombinedViewProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  version: AnalysisNodeSchema;
  validatedFindingNames?: Set<string>;
  onAddFindingToContext?: (finding: FindingSchema) => void;
  onAddToValidated?: (finding: FindingSchema) => void;
}

const CombinedView: React.FC<CombinedViewProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeVersionId,
  version,
  validatedFindingNames,
  onAddFindingToContext,
  onAddToValidated,
}) => {
  const { fileId, handleFileChange } = useCode();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [expandedFindingIds, setExpandedFindingIds] = useState<Set<string>>(new Set());

  // Batch-fetch nodes for all unique scope source_node_ids
  const uniqueSourceNodeIds = useMemo(
    () => Array.from(new Set(version.scopes.map((s) => s.source_node_id))),
    [version.scopes],
  );

  const nodeQueryResults = useQueries({
    queries: uniqueSourceNodeIds.map((nid) => ({
      queryKey: generateQueryKey.codeNode(nid),
      queryFn: () =>
        codeActions.getNode(teamSlug, codeVersionId, nid).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
      staleTime: Infinity,
    })),
  });

  const nodesLoading = nodeQueryResults.some((q) => q.isLoading);

  // Build map: source_node_id -> GraphSnapshotNode
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphSnapshotNode>();
    uniqueSourceNodeIds.forEach((nid, idx) => {
      const data = nodeQueryResults[idx]?.data;
      if (data) map.set(nid, data);
    });
    return map;
  }, [uniqueSourceNodeIds, nodeQueryResults]);

  // Build list of findings with their associated nodes (for current file)
  const allFindingsWithNodes = useMemo((): FindingWithNode[] => {
    const result: FindingWithNode[] = [];
    for (const finding of version.findings) {
      const node = nodeMap.get(finding.source_node_id);
      if (node) result.push({ finding, node });
    }
    return result;
  }, [version.findings, nodeMap]);

  // Filter findings for the currently selected file
  const findingsForCurrentFile = useMemo(
    () => allFindingsWithNodes.filter((fw) => fw.node.file_id === fileId),
    [allFindingsWithNodes, fileId],
  );

  const handleFindingClick = useCallback(
    (finding: FindingSchema) => {
      const node = nodeMap.get(finding.source_node_id);
      if (!node) return;

      setSelectedFindingId(finding.id);
      setExpandedFindingIds((prev) => new Set([...prev, finding.id]));

      // Switch file if this finding is in a different file
      if (fileId !== node.file_id) {
        handleFileChange(node.file_id);
      }
    },
    [nodeMap, fileId, handleFileChange],
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

  if (version.findings.length === 0) {
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
      {/* Left panel: file tree with findings */}
      <FileTreeFindings
        version={version}
        nodeMap={nodeMap}
        selectedFindingId={selectedFindingId}
        onFindingClick={handleFindingClick}
        validatedFindingNames={validatedFindingNames}
        nodesLoading={nodesLoading}
      />

      {/* Middle panel: full code view with inline annotation cards */}
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
          validatedFindingNames={validatedFindingNames}
          onAddFindingToContext={onAddFindingToContext}
          onAddToValidated={onAddToValidated}
        />
      </div>
    </div>
  );
};

export default CombinedView;
