"use client";

import { sharedActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import AnalysisScopes, {
  getSeverityBadgeClasses,
  levelOrder,
} from "@/components/views/analysis/scopes";
import AnalysisCodeSnippet from "@/components/views/analysis/snippet";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingSchemaI, NodeSchemaI, SharedAnalysisNodeSchemaI } from "@/utils/types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Check, ExternalLink, Shield, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const FindingDescription: React.FC<{
  finding: FindingSchemaI;
}> = ({ finding }) => {
  const [tab, setTab] = useState("description");

  return (
    <div className={cn("border rounded-lg overflow-hidden", "finding")}>
      <div className="flex justify-between items-center">
        <Subnav className="w-fit px-0">
          <SubnavButton
            isActive={tab === "description"}
            shouldHighlight
            onClick={() => setTab("description")}
          >
            Description
          </SubnavButton>
          <SubnavButton
            isActive={tab === "recommendation"}
            shouldHighlight
            onClick={() => setTab("recommendation")}
          >
            Recommendation
          </SubnavButton>
          <SubnavButton
            isActive={tab === "feedback"}
            shouldHighlight
            onClick={() => setTab("feedback")}
          >
            Feedback
          </SubnavButton>
        </Subnav>
        <Badge variant="outline" size="sm" className="mr-2">
          {truncateId(finding.id)}
        </Badge>
      </div>
      {tab === "description" && (
        <div className="space-y-4 p-4">
          {finding.explanation && <p className="text-sm leading-relaxed">{finding.explanation}</p>}
          {finding.reference && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Reference</h4>
              <p className="text-sm leading-relaxed">{finding.reference}</p>
            </div>
          )}
          {!finding.explanation && !finding.reference && (
            <p className="text-sm text-muted-foreground">No description or reference available.</p>
          )}
        </div>
      )}
      {tab === "recommendation" && (
        <div className="space-y-2 px-4 py-2">
          {finding.recommendation ? (
            <p className="text-sm leading-relaxed">{finding.recommendation}</p>
          ) : (
            <p className="text-sm">No recommendation available.</p>
          )}
        </div>
      )}
      {tab === "feedback" && (
        <p className="text-xs text-muted-foreground italic">Current feedback: {finding.feedback}</p>
      )}
    </div>
  );
};

const FindingMetadata: React.FC<{
  nodeId: string;
  finding: FindingSchemaI;
  nodeQuery: UseQueryResult<NodeSchemaI, Error>;
}> = ({ nodeId, finding, nodeQuery }) => {
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
            pathname: `/shared/${nodeId}/code`,
            query: { source: nodeQuery.data?.source_id, node: nodeQuery.data?.id },
          }}
        >
          Source <ExternalLink className="size-3" />
        </Link>
      </Button>
    </div>
  );
};

const AnalysisHolder: React.FC<{
  analysis: SharedAnalysisNodeSchemaI;
}> = ({ analysis }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingSchemaI | undefined>(undefined);

  const nodeQuery = useQuery({
    queryKey: generateQueryKey.codeNode(selectedFinding?.id ?? ""),
    queryFn: () => sharedActions.getNode(analysis.id, selectedFinding?.code_version_node_id ?? ""),
    enabled: !!selectedFinding,
  });

  useEffect(() => {
    if (!selectedFinding && analysis && analysis.findings.length > 0) {
      let isFound = false;
      for (const scope of analysis.scopes) {
        if (isFound) {
          break;
        }
        const findings = analysis.findings.filter(
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-start gap-2">
        <h2 className="text-lg font-semibold">Findings</h2>
        <div className="h-4 w-px bg-border mx-2" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{analysis.n_scopes}</span>
          <span className="text-muted-foreground/70">
            {analysis.n_scopes === 1 ? "scope" : "scopes"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{analysis.n_findings}</span>
          <span className="text-muted-foreground/70">
            {analysis.n_findings === 1 ? "finding" : "findings"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-w-0">
        <AnalysisScopes
          version={{ scopes: analysis.scopes, findings: analysis.findings }}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
        />
        {!selectedFinding ? (
          <div className="flex items-center justify-center text-center py-12">
            <div>
              <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Findings</h3>
              <p className="text-muted-foreground">
                This analysis analysis has no security findings.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FindingMetadata nodeId={analysis.id} finding={selectedFinding} nodeQuery={nodeQuery} />
            <AnalysisCodeSnippet nodeQuery={nodeQuery} />
            <FindingDescription finding={selectedFinding} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHolder;
