"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { FindingLevel } from "@/utils/enums";
import { AnalysisMappingSchemaI, FindingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, GitBranch, Info, Shield, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

const getSeverityIcon = (level: FindingLevel): React.ReactElement => {
  switch (level.toLowerCase()) {
    case "critical":
      return <XCircle className="size-4 text-red-500" />;
    case "high":
      return <AlertTriangle className="size-4 text-orange-500" />;
    case "medium":
      return <AlertTriangle className="size-4 text-yellow-500" />;
    case "low":
      return <Info className="size-4 text-blue-500" />;
    default:
      return <Info className="size-4 text-neutral-500" />;
  }
};

const getSeverityColor = (level: FindingLevel): string => {
  switch (level.toLowerCase()) {
    case "critical":
      return "border-red-500/20 bg-red-500/5";
    case "high":
      return "border-orange-500/20 bg-orange-500/5";
    case "medium":
      return "border-yellow-500/20 bg-yellow-500/5";
    case "low":
      return "border-blue-500/20 bg-blue-500/5";
    default:
      return "border-neutral-500/20 bg-neutral-500/5";
  }
};

const levelOrder = [
  FindingLevel.CRITICAL,
  FindingLevel.HIGH,
  FindingLevel.MEDIUM,
  FindingLevel.LOW,
];

export const Relations: React.FC<{
  analysisVersion: AnalysisMappingSchemaI;
  teamSlug: string;
}> = ({ analysisVersion, teamSlug }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-4">
          <GitBranch className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="p-2 text-sm">
          <div className="mb-2">
            <span className="font-medium">Parent: </span>
            {analysisVersion.parent ? (
              <Link
                href={`/teams/${teamSlug}/analysis-versions/${analysisVersion.parent.id}`}
                className="text-blue-400 hover:underline"
              >
                {analysisVersion.parent.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">none</span>
            )}
          </div>

          <div>
            <span className="font-medium">Children: </span>
            {analysisVersion.children.map((child) => (
              <Link
                key={child.id}
                href={`/teams/${teamSlug}/analysis-versions/${child.id}`}
                className="text-blue-400 hover:underline"
              >
                {child.name}
              </Link>
            ))}
            {analysisVersion.children.length === 0 && (
              <span className="text-muted-foreground">none</span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type FindingWithScope = FindingSchemaI["findings"][0] & {
  scope: {
    id: string;
    callable: FindingSchemaI["callable"];
  };
};

const getFindingsCountByLevel = (
  findings: FindingSchemaI["findings"],
): Record<FindingLevel, number> => {
  const counts = {
    [FindingLevel.CRITICAL]: 0,
    [FindingLevel.HIGH]: 0,
    [FindingLevel.MEDIUM]: 0,
    [FindingLevel.LOW]: 0,
  } as Record<FindingLevel, number>;

  findings.forEach((finding) => {
    if (finding.level in counts) {
      counts[finding.level as FindingLevel]++;
    }
  });

  return counts;
};

export const AnalysisVersionClient: React.FC<{
  teamSlug: string;
  analysisVersion: AnalysisMappingSchemaI;
}> = ({ teamSlug, analysisVersion }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingWithScope | null>(null);

  const { data: scopes = [] } = useQuery<FindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionFindings(analysisVersion.id),
    queryFn: () => analysisActions.getFindings(teamSlug, analysisVersion.id),
  });

  const allFindings = useMemo(() => {
    const flattened: FindingWithScope[] = [];
    scopes.forEach((scope) => {
      scope.findings.forEach((finding) => {
        flattened.push({
          ...finding,
          scope: {
            id: scope.id,
            callable: scope.callable,
          },
        });
      });
    });
    return flattened;
  }, [scopes]);

  const sortedScopes = useMemo(() => {
    return [...scopes].sort((a, b) => {
      const aCount = a.findings.length;
      const bCount = b.findings.length;
      if (aCount !== bCount) {
        return bCount - aCount;
      }
      return a.callable.name.localeCompare(b.callable.name);
    });
  }, [scopes]);

  React.useEffect(() => {
    if (allFindings.length > 0 && !selectedFinding) {
      for (const level of levelOrder) {
        const firstFinding = allFindings.find((finding) => finding.level === level);
        if (firstFinding) {
          setSelectedFinding(firstFinding);
          return;
        }
      }
    }
  }, [allFindings, selectedFinding]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[600px] my-10">
      <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
        {sortedScopes.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">No scopes found</div>
        ) : (
          sortedScopes.map((scope) => {
            const counts = getFindingsCountByLevel(scope.findings);
            const totalFindings = scope.findings.length;
            const hasFindings = totalFindings > 0;

            return (
              <Collapsible
                key={scope.id}
                defaultOpen={hasFindings && selectedFinding?.scope.id === scope.id}
                className="group"
              >
                <div className="space-y-2">
                  <CollapsibleTrigger
                    className={cn(
                      "w-full text-left flex items-start gap-2 p-2 data-[state=open]:[&>svg]:rotate-180",
                      "rounded-lg hover:bg-accent transition-colors",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium  truncate min-w-0 flex-1">
                          {scope.callable.name}
                        </div>
                        {hasFindings ? (
                          <div className="flex items-center gap-2 shrink-0">
                            {levelOrder.map((level) => {
                              const count = counts[level];
                              if (count === 0) return null;
                              return (
                                <Badge
                                  key={level}
                                  variant={
                                    level === FindingLevel.CRITICAL
                                      ? "destructive"
                                      : level === FindingLevel.HIGH
                                        ? "destructive"
                                        : level === FindingLevel.MEDIUM
                                          ? "secondary"
                                          : "blue"
                                  }
                                  className="text-xs"
                                >
                                  {count} {level}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground shrink-0">No findings</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                        {scope.callable.signature}
                      </div>
                    </div>
                    <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 ml-6">
                      {!hasFindings ? (
                        <div className="text-sm text-muted-foreground py-2">
                          No findings in this scope
                        </div>
                      ) : (
                        levelOrder.map((level) => {
                          const levelFindings = scope.findings.filter((f) => f.level === level);
                          if (levelFindings.length === 0) return null;

                          return (
                            <div key={level} className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground capitalize">
                                {level}
                              </div>
                              {levelFindings.map((finding, index) => {
                                const findingWithScope: FindingWithScope = {
                                  ...finding,
                                  scope: {
                                    id: scope.id,
                                    callable: scope.callable,
                                  },
                                };
                                const isSelected = selectedFinding?.id === finding.id;

                                return (
                                  <div
                                    key={finding.id || index}
                                    onClick={() => setSelectedFinding(findingWithScope)}
                                    className={cn(
                                      "w-full text-left p-2 rounded border transition-all duration-200",
                                      getSeverityColor(level),
                                      isSelected
                                        ? "border-opacity-60 bg-opacity-10"
                                        : "hover:bg-opacity-10 hover:border-opacity-40",
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getSeverityIcon(level)}
                                      <span className="text-sm font-medium  truncate">
                                        {finding.name}
                                      </span>
                                      {finding.metadata?.attested_at && (
                                        <span className="text-green-400 font-medium text-xs shrink-0">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "border rounded-xl p-6",
              selectedFinding
                ? getSeverityColor(selectedFinding.level.toLowerCase() as FindingLevel)
                : "border-border",
            )}
          >
            {selectedFinding ? (
              <>
                <div className="flex items-start gap-4 mb-4">
                  {getSeverityIcon(selectedFinding.level.toLowerCase() as FindingLevel)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold ">{selectedFinding.name}</h3>
                      {selectedFinding.metadata?.attested_at && (
                        <Badge variant="green" className="ml-4">
                          ✓ Attested
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="capitalize font-medium">
                        {selectedFinding.level} severity
                      </span>
                      <span>•</span>
                      <span>Type: {selectedFinding.type}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Scope: </span>
                      <span className="font-mono">{selectedFinding.scope.callable.name}</span>
                      <span className="mx-2">•</span>
                      <span className="font-mono text-xs">
                        {selectedFinding.scope.callable.signature}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedFinding.explanation && (
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium ">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedFinding.explanation}
                    </p>
                  </div>
                )}

                {selectedFinding.recommendation && (
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium ">Recommendation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedFinding.recommendation}
                    </p>
                  </div>
                )}

                {selectedFinding.reference && (
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium ">Reference</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedFinding.reference}
                    </p>
                  </div>
                )}

                {selectedFinding.metadata?.feedback && (
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium ">Feedback</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedFinding.metadata.feedback}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Scope ID:</span>
                      <br />
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {selectedFinding.scope.id}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Merkle Hash:</span>
                      <br />
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {selectedFinding.scope.callable.merkle_hash.slice(0, 8)}...
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Verified:</span>
                      <br />
                      <span
                        className={
                          selectedFinding.metadata?.is_verified
                            ? "text-green-400"
                            : "text-destructive"
                        }
                      >
                        {selectedFinding.metadata?.is_verified ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center text-center py-12">
                <div>
                  <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium  mb-2">No Findings</h3>
                  <p className="text-muted-foreground">
                    This analysis version has no security findings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
