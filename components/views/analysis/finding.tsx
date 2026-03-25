"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { FindingSchema } from "@/types/api/responses/security";
import { truncateId } from "@/utils/helpers";
import { UseQueryResult } from "@tanstack/react-query";
import { Check, ExternalLink, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getSeverityBadgeClasses } from "./scopes";

const FindingMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  finding: FindingSchema;
  selectedNodeId?: string;
  onSelectNodeId?: (nodeId: string) => void;
  nodeQuery: UseQueryResult<GraphSnapshotNode, Error>;
  onAddFindingToContext?: (finding: FindingSchema) => void;
}> = ({
  teamSlug,
  projectSlug,
  nodeId,
  finding,
  selectedNodeId,
  onSelectNodeId,
  nodeQuery,
  onAddFindingToContext,
}) => {
  const { selectedChatId } = useChat();
  const hasLocations = finding.locations?.length > 0;
  const locationOptions = [
    { source_node_id: finding.source_node_id, field_name: "entrypoint" },
    ...finding.locations,
  ];

  const isValidated = !!finding.validated_at;
  const isInvalidated = !!finding.invalidated_at;
  const isNotAcknowledged = !isValidated && !isInvalidated;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3 min-h-8 w-full min-w-0">
        <h3
          className="text-lg font-semibold truncate whitespace-nowrap min-w-0"
          title={finding.name}
        >
          {finding.name}
        </h3>
        <Badge variant="outline" className={cn("text-xs", getSeverityBadgeClasses(finding.level))}>
          {finding.level}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        {isValidated && (
          <Badge
            variant="outline"
            className="text-xs border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
          >
            <Check className="size-3 mr-1" />
            is validated
          </Badge>
        )}
        {isInvalidated && (
          <Badge
            variant="outline"
            className="text-xs border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
          >
            <X className="size-3 mr-1" />
            is invalidated
          </Badge>
        )}
        {isNotAcknowledged && (
          <Badge
            variant="outline"
            className="text-xs border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground"
          >
            finding not acknowledged
          </Badge>
        )}
        <div className="ml-auto gap-3 h-8 flex">
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
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link
              href={{
                pathname: `/team/${teamSlug}/${projectSlug}/analyses/${nodeId}/code`,
                query: { source: nodeQuery.data?.file_id, node: nodeQuery.data?.id },
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
              key={`${location.source_node_id}-${location.field_name ?? "node"}-${index}`}
              type="button"
              className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs",
                selectedNodeId === location.source_node_id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => onSelectNodeId?.(location.source_node_id)}
              title={
                location.field_name
                  ? `${location.field_name} (${location.source_node_id})`
                  : location.source_node_id
              }
            >
              {location.field_name
                ? `${location.field_name} - ${truncateId(location.source_node_id)}`
                : truncateId(location.source_node_id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindingMetadata;
