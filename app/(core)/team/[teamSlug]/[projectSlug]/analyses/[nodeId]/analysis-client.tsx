"use client";

import { analysisActions, validatedFindingActions } from "@/actions/bevor";
import AnalysisHolder from "@/components/views/analysis/holder";
import CollapsibleChatPanel from "@/components/views/chat/analysis-panel";
import { useChat } from "@/providers/chat";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { toast } from "sonner";

interface AnalysisClientProps {
  teamSlug: string;
  codeVersionId: string;
  projectSlug: string;
  nodeId: string;
  initialFinding?: FindingSchema;
  isOwner: boolean;
}

const AnalysisClient: React.FC<AnalysisClientProps> = ({
  teamSlug,
  codeVersionId,
  projectSlug,
  nodeId,
  initialFinding,
  isOwner,
}) => {
  const { addFinding, removeFinding, attributes } = useChat();
  const queryClient = useQueryClient();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: validatedFindings = [] } = useQuery({
    queryKey: generateQueryKey.validatedFindings(projectSlug),
    queryFn: () =>
      validatedFindingActions.getValidatedFindings(teamSlug, projectSlug).then((r) => {
        if (!r.ok) return [];
        return r.data;
      }),
  });

  const validatedFindingNames = useMemo(
    () => new Set(validatedFindings.map((vf) => `${vf.name}::${vf.level}`)),
    [validatedFindings],
  );

  const findingContext = useMemo(() => {
    const findingAttributeIds = new Set(
      attributes.filter((attr) => attr.type === "finding").map((attr) => attr.id),
    );
    return version.findings.filter((finding) => findingAttributeIds.has(finding.id));
  }, [attributes, version.findings]);

  const addFindingToContext = (finding: FindingSchema): void => {
    addFinding(finding);
  };

  const removeFindingFromContext = (findingId: string): void => {
    removeFinding(findingId);
  };

  const addToValidatedMutation = useMutation({
    mutationFn: (finding: FindingSchema) =>
      validatedFindingActions
        .addValidatedFinding(teamSlug, projectSlug, {
          finding_id: finding.id,
          analysis_node_id: nodeId,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success("Finding added to validated list");
    },
    onError: (error: any) => {
      const message = error?.error?.message ?? "Failed to add finding";
      toast.error(message);
    },
  });

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      <div className="min-h-0 min-w-0 flex-1">
        <AnalysisHolder
          codeVersionId={codeVersionId}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          nodeId={nodeId}
          initialFinding={initialFinding}
          validatedFindingNames={validatedFindingNames}
          onAddFindingToContext={addFindingToContext}
          onAddToValidated={(finding) => addToValidatedMutation.mutate(finding)}
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
