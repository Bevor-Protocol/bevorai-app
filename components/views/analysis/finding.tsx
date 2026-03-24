"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingFeedbackBody } from "@/utils/schema";
import { AnalysisNodeSchemaI, FindingSchemaI, NodeSchemaI } from "@/utils/types";
import { useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { ArrowUp, Check, ExternalLink, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { getSeverityBadgeClasses } from "./scopes";

const FindingMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  finding: FindingSchemaI;
  selectedNodeId?: string;
  onSelectNodeId?: (nodeId: string) => void;
  nodeQuery: UseQueryResult<NodeSchemaI, Error>;
  onAddFindingToContext?: (finding: FindingSchemaI) => void;
  onValidate?: (finding: FindingSchemaI) => void;
}> = ({
  teamSlug,
  projectSlug,
  nodeId,
  finding,
  selectedNodeId,
  onSelectNodeId,
  nodeQuery,
  onAddFindingToContext,
  onValidate,
}) => {
  const { selectedChatId } = useChat();
  const queryClient = useQueryClient();
  const hasLocations = finding.locations?.length > 0;
  const locationOptions = [
    { code_version_node_id: finding.code_version_node_id, field_name: "entrypoint" },
    ...finding.locations,
  ];

  const isValidated = !!finding.validated_at;
  const isInvalidated = !!finding.invalidated_at;

  const feedbackMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: FindingFeedbackBody }) =>
      analysisActions.submitFindingFeedback(teamSlug, nodeId, findingId, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: (_, { findingId, data }) => {
      let promotedFinding: FindingSchemaI | undefined;
      queryClient.setQueryData<AnalysisNodeSchemaI>(
        generateQueryKey.analysisDetailed(nodeId),
        (oldData) => {
          if (!oldData) return oldData;
          const newFindings = oldData.findings.map((f) => {
            if (f.id === findingId) {
              const newFinding = {
                ...f,
                validated_at: data.is_verified ? new Date() : undefined,
                invalidated_at: !data.is_verified ? new Date() : undefined,
              };
              if (data.is_verified) promotedFinding = newFinding;
              return newFinding;
            }
            return f;
          });
          return { ...oldData, findings: newFindings };
        },
      );
      if (promotedFinding) onValidate?.(promotedFinding);
      toast.success(data.is_verified ? "Finding validated" : "Finding invalidated");
    },
    onError: () => toast.error("Failed to submit feedback"),
  });

  // When already validated, skip the API call and just promote to the project panel.
  const handleValidate = () => {
    if (isValidated) {
      onValidate?.(finding);
      toast.success("Added to Validated Findings");
    } else {
      feedbackMutation.mutate({ findingId: finding.id, data: { is_verified: true } });
    }
  };
  const handleInvalidate = () =>
    feedbackMutation.mutate({ findingId: finding.id, data: { is_verified: false } });

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3 min-h-8 w-full min-w-0">
        <h3 className="text-lg font-semibold truncate whitespace-nowrap min-w-0" title={finding.name}>
          {finding.name}
        </h3>
        <Badge variant="outline" className={cn("text-xs", getSeverityBadgeClasses(finding.level))}>
          {finding.level}
        </Badge>
        <span className="text-sm text-muted-foreground shrink-0">
          {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        <div className="ml-auto gap-2 h-8 flex items-center shrink-0">
          {!isInvalidated && (
            <Button
              variant={isValidated ? "outline" : "outline"}
              size="sm"
              onClick={handleValidate}
              disabled={feedbackMutation.isPending}
              className={cn(
                "h-7 text-xs gap-1.5",
                isValidated
                  ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                  : "border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:border-green-500/50",
              )}
            >
              <Check className="size-3" />
              {isValidated ? "Validated" : "Validate"}
            </Button>
          )}
          {!isValidated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInvalidate}
              disabled={feedbackMutation.isPending}
              className={cn(
                "h-7 text-xs gap-1.5",
                isInvalidated
                  ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                  : "border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50",
              )}
            >
              <X className="size-3" />
              {isInvalidated ? "Invalidated" : "Invalidate"}
            </Button>
          )}
          {onAddFindingToContext && selectedChatId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddFindingToContext(finding)}
              title="Add to chat context"
            >
              <MessageSquare className="size-3" />
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={{
                pathname: `/team/${teamSlug}/${projectSlug}/analyses/${nodeId}/code`,
                query: { source: nodeQuery.data?.source_id, node: nodeQuery.data?.id },
              }}
            >
              Source <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </div>
      {hasLocations && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Locations</span>
          {locationOptions.map((location, index) => (
            <button
              key={`${location.code_version_node_id}-${location.field_name ?? "node"}-${index}`}
              type="button"
              className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs",
                selectedNodeId === location.code_version_node_id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => onSelectNodeId?.(location.code_version_node_id)}
              title={
                location.field_name
                  ? `${location.field_name} (${location.code_version_node_id})`
                  : location.code_version_node_id
              }
            >
              {location.field_name
                ? `${location.field_name} - ${truncateId(location.code_version_node_id)}`
                : truncateId(location.code_version_node_id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindingMetadata;
