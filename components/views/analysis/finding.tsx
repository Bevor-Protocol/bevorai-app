"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FindingSchemaI, NodeSchemaI } from "@/utils/types";
import { UseQueryResult } from "@tanstack/react-query";
import { Check, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getSeverityBadgeClasses } from "./scopes";

const FindingMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  finding: FindingSchemaI;
  nodeQuery: UseQueryResult<NodeSchemaI, Error>;
}> = ({ teamSlug, projectSlug, nodeId, finding, nodeQuery }) => {
  const isValidated = !!finding.validated_at;
  const isInvalidated = !!finding.invalidated_at;
  const isNotAcknowledged = !isValidated && !isInvalidated;

  return (
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold">{finding.name}</h3>
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
      <Button variant="ghost" size="sm" asChild className="ml-auto">
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
  );
};

export default FindingMetadata;
