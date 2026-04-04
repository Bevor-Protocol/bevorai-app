"use client";

import { codeActions } from "@/actions/bevor";
import { useCode } from "@/providers/code";
import {
  AnalysisNodeSchema,
  DraftFindingSchema,
  FindingSchema,
} from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
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
  isOwner: boolean;
  onAddFindingToContext?: (finding: FindingSchema) => void;
}

const CombinedView: React.FC<CombinedViewProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeVersionId,
  findings,
  isOwner,
  onAddFindingToContext,
}) => {
  const { fileId, handleFileChange } = useCode();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [expandedFindingIds, setExpandedFindingIds] = useState<Set<string>>(new Set());

  const allVersionNodesQuery = useQuery({
    queryKey: generateQueryKey.codeNodes(codeVersionId),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeVersionId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!codeVersionId && (findings.length > 0 || isOwner),
    staleTime: Infinity,
  });

  const allFindingsWithNodes = useMemo((): FindingWithNode[] => {
    if (!allVersionNodesQuery.data) return [];
    const result: FindingWithNode[] = [];
    for (const finding of findings) {
      const node = allVersionNodesQuery.data.find((n) => n.id == finding.node_id);
      if (node) result.push({ finding, node });
    }
    return result;
  }, [findings, allVersionNodesQuery.data]);

  const findingsForCurrentFile = useMemo(
    () => allFindingsWithNodes.filter((fw) => fw.node.file_id === fileId),
    [allFindingsWithNodes, fileId],
  );

  const handleFindingClick = useCallback(
    (finding: FindingSchema) => {
      const fwn = allFindingsWithNodes.find((x) => x.finding.id === finding.id);
      if (!fwn) return;
      const { node } = fwn;

      setSelectedFindingId(finding.id);
      setExpandedFindingIds((prev) => new Set([...prev, finding.id]));

      if (fileId !== node.file_id) {
        handleFileChange(node.file_id);
      }
    },
    [allFindingsWithNodes, fileId, handleFileChange],
  );

  const handleToggleFinding = useCallback(
    (findingId: string) => {
      let willExpand = false;
      setExpandedFindingIds((prev) => {
        willExpand = !prev.has(findingId);
        const next = new Set(prev);
        if (willExpand) next.add(findingId);
        else next.delete(findingId);
        return next;
      });
      setSelectedFindingId(findingId);
      if (willExpand) {
        const fwn = allFindingsWithNodes.find((x) => x.finding.id === findingId);
        if (fwn && fileId !== fwn.node.file_id) handleFileChange(fwn.node.file_id);
      }
    },
    [allFindingsWithNodes, fileId, handleFileChange],
  );

  const selectFindingFromCode = useCallback(
    (findingId: string) => {
      setSelectedFindingId(findingId);
      setExpandedFindingIds((prev) => new Set(prev).add(findingId));
      const fwn = allFindingsWithNodes.find((x) => x.finding.id === findingId);
      if (fwn && fileId !== fwn.node.file_id) handleFileChange(fwn.node.file_id);
    },
    [allFindingsWithNodes, fileId, handleFileChange],
  );

  return (
    <div className="flex h-full min-h-0 w-full">
      <FileTreeFindings
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        nodeId={nodeId}
        codeId={codeVersionId}
        isOwner={isOwner}
        allFindingsWithNodes={allFindingsWithNodes}
        codeVersionNodes={allVersionNodesQuery.data ?? []}
        findingsGraphLoading={allVersionNodesQuery.isLoading}
        selectedFindingId={selectedFindingId}
        expandedFindingIds={expandedFindingIds}
        onFindingClick={handleFindingClick}
        onToggleFinding={handleToggleFinding}
        onAddFindingToContext={onAddFindingToContext}
      />
      <CodeWithAnnotations
        findingsWithNodes={findingsForCurrentFile}
        selectedFindingId={selectedFindingId}
        onSelectFinding={selectFindingFromCode}
      />
    </div>
  );
};

export default CombinedView;
