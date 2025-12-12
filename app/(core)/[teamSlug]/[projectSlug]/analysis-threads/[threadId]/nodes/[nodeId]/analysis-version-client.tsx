"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { FindingLevel } from "@/utils/enums";
import { FindingFeedbackBody } from "@/utils/schema";
import { AnalysisNodeSchemaI, FindingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronDown,
  Info,
  Shield,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

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

const ScopesList: React.FC<{
  teamSlug: string;
  nodeId: string;
  selectedFinding: FindingWithScope | null;
  onSelectFinding: (finding: FindingWithScope) => void;
}> = ({ teamSlug, nodeId, selectedFinding, onSelectFinding }) => {
  const [openScopes, setOpenScopes] = useState<Set<string>>(new Set());

  const { data: scopes = [], isLoading } = useQuery<FindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionFindings(nodeId),
    queryFn: () => analysisActions.getFindings(teamSlug, nodeId),
  });

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

  const displayScopes = sortedScopes;

  React.useEffect(() => {
    if (selectedFinding && !openScopes.has(selectedFinding.scope.id)) {
      setOpenScopes(new Set([...openScopes, selectedFinding.scope.id]));
    }
  }, [selectedFinding, openScopes]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (displayScopes.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No scopes found</div>;
  }

  return (
    <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
      {displayScopes.map((scope) => {
        const counts = getFindingsCountByLevel(scope.findings);
        const hasFindings = scope.findings.length > 0;
        const isOpen = openScopes.has(scope.id);

        return (
          <Collapsible
            key={scope.id}
            open={isOpen}
            onOpenChange={(open) => {
              const newOpenScopes = new Set(openScopes);
              if (open) {
                newOpenScopes.add(scope.id);
              } else {
                newOpenScopes.delete(scope.id);
              }
              setOpenScopes(newOpenScopes);
            }}
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
                                onClick={() => {
                                  onSelectFinding(findingWithScope);
                                  if (!openScopes.has(scope.id)) {
                                    setOpenScopes(new Set([...openScopes, scope.id]));
                                  }
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded border transition-all duration-200 cursor-pointer",
                                  getSeverityColor(level),
                                  isSelected
                                    ? "border-opacity-60 bg-opacity-10"
                                    : "hover:bg-opacity-10 hover:border-opacity-40",
                                )}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getSeverityIcon(level)}
                                  <span className="text-sm font-medium truncate">
                                    {finding.name}
                                  </span>
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
      })}
    </div>
  );
};

const FindingDetail: React.FC<{
  teamSlug: string;
  nodeId: string;
  finding: FindingWithScope | null;
  isLoading?: boolean;
}> = ({ teamSlug, nodeId, finding, isLoading }) => {
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [pendingVerification, setPendingVerification] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: FindingFeedbackBody }) => {
      return analysisActions.submitFindingFeedback(teamSlug, nodeId, findingId, data);
    },
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Feedback submitted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback");
    },
  });

  React.useEffect(() => {
    if (finding) {
      setFeedbackText(finding?.feedback || "");
      setPendingVerification(finding.validated_at ? true : finding.invalidated_at ? false : null);
    }
  }, [finding]);

  const handleSubmitFeedback = (findingId: string, isVerified: boolean): void => {
    setPendingVerification(isVerified);
    submitFeedbackMutation.mutate({
      findingId,
      data: {
        feedback: feedbackText || undefined,
        is_verified: isVerified,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="flex items-center justify-center text-center py-12">
        <div>
          <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium  mb-2">No Findings</h3>
          <p className="text-muted-foreground">This analysis version has no security findings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        {getSeverityIcon(finding.level.toLowerCase() as FindingLevel)}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold ">{finding.name}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="capitalize font-medium">{finding.level} severity</span>
            <span>•</span>
            <span>Type: {finding.type.replace("_", " ")}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Scope: </span>
            <span className="font-mono">{finding.scope.callable.name}</span>
            <span className="mx-2">•</span>
            <span className="font-mono text-xs">{finding.scope.callable.signature}</span>
          </div>
        </div>
      </div>

      {finding.explanation && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium ">Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.explanation}</p>
        </div>
      )}

      {finding.recommendation && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium ">Recommendation</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.recommendation}</p>
        </div>
      )}

      {finding.reference && (
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium ">Reference</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{finding.reference}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium ">Feedback</h4>
        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Enter your feedback..."
          rows={4}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleSubmitFeedback(finding.id, true)}
              disabled={submitFeedbackMutation.isPending}
            >
              <ThumbsUp
                className={cn(
                  "size-4 text-muted-foreground hover:text-foreground",
                  pendingVerification === true && "text-green-400",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleSubmitFeedback(finding.id, false)}
              disabled={submitFeedbackMutation.isPending}
            >
              <ThumbsDown
                className={cn(
                  "size-4 text-muted-foreground hover:text-foreground",
                  pendingVerification === false && "text-destructive",
                )}
              />
            </Button>
          </div>
        </div>
        {finding?.feedback && !feedbackText && (
          <p className="text-xs text-muted-foreground italic">
            Current feedback: {finding.feedback}
          </p>
        )}
      </div>
    </>
  );
};

export const AnalysisVersionClient: React.FC<{
  threadId: string;
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
  analysisVersion: AnalysisNodeSchemaI;
}> = ({ teamSlug, analysisVersion }) => {
  const [selectedFinding, setSelectedFinding] = useState<FindingWithScope | null>(null);

  const { data: scopes = [], isLoading } = useQuery<FindingSchemaI[]>({
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

  const initialFinding = useMemo(() => {
    if (allFindings.length === 0) return null;
    for (const level of levelOrder) {
      const firstFinding = allFindings.find((finding) => finding.level === level);
      if (firstFinding) {
        return firstFinding;
      }
    }
    return null;
  }, [allFindings]);

  React.useEffect(() => {
    if (initialFinding && !selectedFinding) {
      setSelectedFinding(initialFinding);
    }
  }, [initialFinding, selectedFinding]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Findings</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[600px]">
        <ScopesList
          teamSlug={teamSlug}
          nodeId={analysisVersion.id}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
        />
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
              <FindingDetail
                teamSlug={teamSlug}
                nodeId={analysisVersion.id}
                finding={selectedFinding}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
