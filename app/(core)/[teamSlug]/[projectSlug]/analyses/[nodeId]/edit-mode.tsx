"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { FindingLevel, FindingType } from "@/utils/enums";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  analysisFindingBodySchema,
} from "@/utils/schema";
import { DraftFindingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, RotateCcw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { codeToHtml } from "shiki";
import { toast } from "sonner";
import { getSeverityBadgeClasses, getSeverityColor, getSeverityIcon, levelOrder } from "./scopes";

type DraftFindingWithScope = DraftFindingSchemaI["findings"][0] & {
  scope: {
    id: string;
    code_version_node_id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

type MergedFindingWithScope = DraftFindingSchemaI["findings"][0] & {
  scope: {
    id: string;
    code_version_node_id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

type StagedFindingWithScope = DraftFindingSchemaI["staged"][0] & {
  scope: {
    id: string;
    code_version_node_id: string;
    callable: DraftFindingSchemaI["callable"];
  };
};

type GroupingMode = "scope" | "severity" | "type";

type GroupedData =
  | {
      mode: "scope";
      groups: DraftFindingSchemaI[];
    }
  | {
      mode: "severity";
      groups: Array<{
        key: FindingLevel;
        findings: DraftFindingWithScope[];
      }>;
    }
  | {
      mode: "type";
      groups: Array<{
        key: string;
        findings: DraftFindingWithScope[];
      }>;
    };

const severityScoreMap: Record<FindingLevel, number> = {
  [FindingLevel.CRITICAL]: 6,
  [FindingLevel.HIGH]: 4,
  [FindingLevel.MEDIUM]: 2,
  [FindingLevel.LOW]: 1,
};

const getFindingsCountByLevel = (
  findings: DraftFindingSchemaI["findings"],
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

const EditScopesList: React.FC<{
  teamSlug: string;
  nodeId: string;
  selectedFinding: DraftFindingWithScope | null;
  onSelectFinding: (finding: DraftFindingWithScope) => void;
  onAddFinding: (data: AddAnalysisFindingBody) => void;
}> = ({ teamSlug, nodeId, selectedFinding, onSelectFinding, onAddFinding }) => {
  const [openAddDialog, setOpenAddDialog] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("scope");

  const { data: draftScopes = [], isLoading } = useQuery<DraftFindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionDraft(nodeId),
    queryFn: () => analysisActions.getDraft(teamSlug, nodeId),
  });

  const groupedData = useMemo((): GroupedData => {
    if (groupingMode === "scope") {
      return {
        mode: "scope",
        groups: draftScopes,
      };
    }

    const allFindings: DraftFindingWithScope[] = [];
    draftScopes.forEach((scope) => {
      scope.findings.forEach((finding) => {
        allFindings.push({
          ...finding,
          scope: {
            id: scope.id,
            code_version_node_id: scope.code_version_node_id,
            callable: scope.callable,
          },
        });
      });
    });

    if (groupingMode === "severity") {
      const groups = levelOrder
        .map((level) => ({
          key: level,
          findings: allFindings.filter((f) => f.level === level),
        }))
        .filter((group) => group.findings.length > 0);

      return {
        mode: "severity",
        groups,
      };
    }

    const typeGroups = new Map<string, DraftFindingWithScope[]>();
    allFindings.forEach((finding) => {
      const type = finding.type;
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(finding);
    });

    const groups = Array.from(typeGroups.entries())
      .map(([key, findings]) => {
        const sortedFindings = [...findings].sort((a, b) => {
          const scoreA = severityScoreMap[a.level as FindingLevel] ?? 0;
          const scoreB = severityScoreMap[b.level as FindingLevel] ?? 0;
          return scoreB - scoreA;
        });
        const totalScore = sortedFindings.reduce(
          (sum, f) => sum + (severityScoreMap[f.level as FindingLevel] ?? 0),
          0,
        );
        return { key, findings: sortedFindings, totalScore };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.key.localeCompare(b.key);
      })
      .map(({ key, findings }) => ({ key, findings }));

    return {
      mode: "type",
      groups,
    };
  }, [draftScopes, groupingMode]);

  React.useEffect(() => {
    if (!selectedFinding) return;

    if (groupingMode === "scope") {
      if (!openGroups.has(selectedFinding.scope.id)) {
        setOpenGroups(new Set([...openGroups, selectedFinding.scope.id]));
      }
    } else if (groupingMode === "severity") {
      const groupKey = selectedFinding.level;
      if (!openGroups.has(groupKey)) {
        setOpenGroups(new Set([...openGroups, groupKey]));
      }
    } else if (groupingMode === "type") {
      const groupKey = selectedFinding.type;
      if (!openGroups.has(groupKey)) {
        setOpenGroups(new Set([...openGroups, groupKey]));
      }
    }
  }, [selectedFinding, groupingMode, openGroups]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const hasData =
    groupingMode === "scope" ? groupedData.groups.length > 0 : groupedData.groups.length > 0;

  if (!hasData) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No findings found</div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <Select
        value={groupingMode}
        onValueChange={(value) => setGroupingMode(value as GroupingMode)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scope">Group by Scope</SelectItem>
          <SelectItem value="severity">Group by Severity</SelectItem>
          <SelectItem value="type">Group by Type</SelectItem>
        </SelectContent>
      </Select>
      <ScrollArea className="flex flex-col space-y-4 pr-2 overflow-y-auto max-h-[calc(100svh-var(--spacing-header)-var(--spacing-subheader)-9rem-1.5rem-2rem)]">
        <div className="w-[350px]">
          {groupingMode === "scope"
            ? (groupedData as { mode: "scope"; groups: DraftFindingSchemaI[] }).groups.map(
                (scope) => {
                  const counts = getFindingsCountByLevel(scope.findings);
                  const hasFindings = scope.findings.length > 0;
                  const isOpen = openGroups.has(scope.id);

                  return (
                    <Collapsible
                      key={scope.id}
                      open={isOpen}
                      onOpenChange={(open) => {
                        const newOpenGroups = new Set(openGroups);
                        if (open) {
                          newOpenGroups.add(scope.id);
                        } else {
                          newOpenGroups.delete(scope.id);
                        }
                        setOpenGroups(newOpenGroups);
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
                              <div className="font-medium truncate min-w-0 flex-1">
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
                                        variant="outline"
                                        className={cn("text-xs", getSeverityBadgeClasses(level))}
                                      >
                                        {count}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground shrink-0">
                                  No findings
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                              {scope.callable.signature}
                            </div>
                          </div>
                          <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-2 ml-6 pr-4">
                            {!hasFindings ? (
                              <div className="text-sm text-muted-foreground py-2">
                                No findings in this scope
                              </div>
                            ) : (
                              levelOrder.map((level) => {
                                const levelFindings = scope.findings.filter(
                                  (f) => f.level === level,
                                );
                                if (levelFindings.length === 0) return null;

                                return (
                                  <div key={level} className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground capitalize">
                                      {level}
                                    </div>
                                    {levelFindings.map((finding, index) => {
                                      const findingWithScope: DraftFindingWithScope = {
                                        ...finding,
                                        scope: {
                                          id: scope.id,
                                          code_version_node_id: scope.code_version_node_id,
                                          callable: scope.callable,
                                        },
                                      };
                                      const isSelected = selectedFinding?.id === finding.id;
                                      const isDraftDelete = finding.draft_type === "delete";

                                      if (isDraftDelete) {
                                        return (
                                          <div
                                            key={finding.id || index}
                                            className={cn(
                                              "w-full text-left p-2 rounded border flex items-center justify-between group",
                                              getSeverityColor(level),
                                              "border-dashed opacity-50",
                                            )}
                                          >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              {getSeverityIcon(level)}
                                              <span className="text-sm font-medium truncate line-through">
                                                {finding.name}
                                              </span>
                                              <Badge
                                                variant="destructive"
                                                className="text-xs shrink-0"
                                              >
                                                Deleting
                                              </Badge>
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={finding.id || index}
                                          onClick={() => {
                                            onSelectFinding(findingWithScope);
                                            if (!openGroups.has(scope.id)) {
                                              setOpenGroups(new Set([...openGroups, scope.id]));
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
                                            {finding.is_draft && finding.draft_type === "add" && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0"
                                              >
                                                New
                                              </Badge>
                                            )}
                                            {finding.is_draft &&
                                              finding.draft_type === "updated" && (
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs shrink-0"
                                                >
                                                  Modified
                                                </Badge>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })
                            )}
                            <AddFindingDialog
                              scopeId={scope.id}
                              scopeName={scope.callable.name}
                              open={openAddDialog === scope.id}
                              onOpenChange={(open) => setOpenAddDialog(open ? scope.id : null)}
                              onAdd={onAddFinding}
                              isLoading={false}
                            />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                },
              )
            : groupingMode === "severity"
              ? (
                  groupedData as {
                    mode: "severity";
                    groups: Array<{ key: FindingLevel; findings: DraftFindingWithScope[] }>;
                  }
                ).groups.map((group) => {
                  const isOpen = openGroups.has(group.key);
                  return (
                    <Collapsible
                      key={group.key}
                      open={isOpen}
                      onOpenChange={(open) => {
                        const newOpenGroups = new Set(openGroups);
                        if (open) {
                          newOpenGroups.add(group.key);
                        } else {
                          newOpenGroups.delete(group.key);
                        }
                        setOpenGroups(newOpenGroups);
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
                              {getSeverityIcon(group.key)}
                              <div className="font-medium truncate min-w-0 flex-1 capitalize">
                                {group.key}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs shrink-0",
                                  getSeverityBadgeClasses(group.key),
                                )}
                              >
                                {group.findings.length}
                              </Badge>
                            </div>
                          </div>
                          <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-2 ml-6 pr-4">
                            {group.findings.map((finding, index) => {
                              const isSelected = selectedFinding?.id === finding.id;
                              const isDraftDelete = finding.draft_type === "delete";

                              if (isDraftDelete) {
                                return (
                                  <div
                                    key={finding.id || index}
                                    className={cn(
                                      "w-full text-left p-2 rounded border flex items-center justify-between group",
                                      getSeverityColor(group.key),
                                      "border-dashed opacity-50",
                                    )}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {getSeverityIcon(group.key)}
                                      <span className="text-sm font-medium truncate line-through">
                                        {finding.name}
                                      </span>
                                      <Badge variant="destructive" className="text-xs shrink-0">
                                        Deleting
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={finding.id || index}
                                  onClick={() => {
                                    onSelectFinding(finding);
                                    if (!openGroups.has(group.key)) {
                                      setOpenGroups(new Set([...openGroups, group.key]));
                                    }
                                  }}
                                  className={cn(
                                    "w-full text-left p-2 rounded border transition-all duration-200 cursor-pointer",
                                    getSeverityColor(group.key),
                                    isSelected
                                      ? "border-opacity-60 bg-opacity-10"
                                      : "hover:bg-opacity-10 hover:border-opacity-40",
                                  )}
                                >
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="text-sm font-medium truncate">
                                        {finding.name}
                                      </span>
                                      {finding.is_draft && finding.draft_type === "add" && (
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          New
                                        </Badge>
                                      )}
                                      {finding.is_draft && finding.draft_type === "updated" && (
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          Modified
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono truncate">
                                      {finding.scope.callable.name}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              : (
                  groupedData as {
                    mode: "type";
                    groups: Array<{ key: string; findings: DraftFindingWithScope[] }>;
                  }
                ).groups.map((group) => {
                  const isOpen = openGroups.has(group.key);
                  const typeCounts = getFindingsCountByLevel(
                    group.findings.map((f) => ({ ...f, level: f.level })),
                  );
                  return (
                    <Collapsible
                      key={group.key}
                      open={isOpen}
                      onOpenChange={(open) => {
                        const newOpenGroups = new Set(openGroups);
                        if (open) {
                          newOpenGroups.add(group.key);
                        } else {
                          newOpenGroups.delete(group.key);
                        }
                        setOpenGroups(newOpenGroups);
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
                              <div className="font-medium truncate min-w-0 flex-1">
                                {group.key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {levelOrder.map((level) => {
                                  const count = typeCounts[level];
                                  if (count === 0) return null;
                                  return (
                                    <Badge
                                      key={level}
                                      variant="outline"
                                      className={cn("text-xs", getSeverityBadgeClasses(level))}
                                    >
                                      {count}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-2 ml-6 pr-4">
                            {levelOrder.map((level) => {
                              const levelFindings = group.findings.filter((f) => f.level === level);
                              if (levelFindings.length === 0) return null;

                              return (
                                <div key={level} className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground capitalize">
                                    {level}
                                  </div>
                                  {levelFindings.map((finding, index) => {
                                    const isSelected = selectedFinding?.id === finding.id;
                                    const isDraftDelete = finding.draft_type === "delete";

                                    if (isDraftDelete) {
                                      return (
                                        <div
                                          key={finding.id || index}
                                          className={cn(
                                            "w-full text-left p-2 rounded border flex items-center justify-between group",
                                            getSeverityColor(level),
                                            "border-dashed opacity-50",
                                          )}
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {getSeverityIcon(level)}
                                            <span className="text-sm font-medium truncate line-through">
                                              {finding.name}
                                            </span>
                                            <Badge
                                              variant="destructive"
                                              className="text-xs shrink-0"
                                            >
                                              Deleting
                                            </Badge>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={finding.id || index}
                                        onClick={() => {
                                          onSelectFinding(finding);
                                          if (!openGroups.has(group.key)) {
                                            setOpenGroups(new Set([...openGroups, group.key]));
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
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {getSeverityIcon(level)}
                                            <span className="text-sm font-medium truncate">
                                              {finding.name}
                                            </span>
                                            {finding.is_draft && finding.draft_type === "add" && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0"
                                              >
                                                New
                                              </Badge>
                                            )}
                                            {finding.is_draft &&
                                              finding.draft_type === "updated" && (
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs shrink-0"
                                                >
                                                  Modified
                                                </Badge>
                                              )}
                                          </div>
                                          <div className="text-xs text-muted-foreground font-mono truncate">
                                            {finding.scope.callable.name}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
        </div>
      </ScrollArea>
    </div>
  );
};

const EditFindingMetadata: React.FC<{
  finding: DraftFindingWithScope;
}> = ({ finding }) => {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold">{finding.name}</h3>
      <Badge variant="outline" className={cn("text-xs", getSeverityBadgeClasses(finding.level))}>
        {finding.level}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
      {finding.is_draft && (
        <Badge variant="secondary" size="sm">
          {finding.draft_type === "add"
            ? "New"
            : finding.draft_type === "updated"
              ? "Modified"
              : finding.draft_type === "delete"
                ? "Deleted"
                : ""}
        </Badge>
      )}
    </div>
  );
};

const EditCodeSnippet: React.FC<{
  teamSlug: string;
  codeVersionId: string;
  codeVersionNodeId: string;
  isEditing: boolean;
}> = ({ teamSlug, codeVersionId, codeVersionNodeId, isEditing }) => {
  const { data: nodeData, isLoading: isLoadingNode } = useQuery({
    queryKey: [QUERY_KEYS.CODES, codeVersionId, "nodes", codeVersionNodeId],
    queryFn: () => codeActions.getNode(teamSlug, codeVersionId, codeVersionNodeId),
    enabled: !!codeVersionNodeId && !isEditing,
  });

  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!nodeData?.content || isEditing) {
      setHtml("");
      return;
    }

    const highlightCode = async (): Promise<void> => {
      try {
        const result = await codeToHtml(nodeData.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${nodeData.content}</code></pre>`;
        setHtml(fallbackHtml);
      }
    };

    highlightCode();
  }, [nodeData?.content, isEditing]);

  return (
    <div className="border rounded-lg relative">
      <ScrollArea className="p-2 h-[200px]">
        {isLoadingNode || !html ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div
            className="shiki-container overflow-x-auto w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

const EditFindingTabs: React.FC<{
  finding: DraftFindingWithScope;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}> = ({ finding, onEdit, onDelete, isDeleting }) => {
  const [tab, setTab] = useState("description");

  return (
    <div className={cn("border rounded-lg p-4", getSeverityColor(finding.level), "finding")}>
      <Subnav className="w-fit px-0 mb-4">
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
      </Subnav>
      {tab === "description" && (
        <div className="space-y-4">
          {finding.explanation && (
            <p className="text-sm text-muted-foreground leading-relaxed">{finding.explanation}</p>
          )}
          {finding.reference && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Reference</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{finding.reference}</p>
            </div>
          )}
          {!finding.explanation && !finding.reference && (
            <p className="text-sm text-muted-foreground">No description or reference available.</p>
          )}
        </div>
      )}
      {tab === "recommendation" && (
        <div className="space-y-2">
          {finding.recommendation ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.recommendation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No recommendation available.</p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-border/50 mt-4">
        <div className="flex items-center justify-between">
          {finding.draft_type === "delete" ? (
            <div className="text-sm text-muted-foreground">This finding is staged for deletion</div>
          ) : (
            <>
              <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EditFindingDetail: React.FC<{
  teamSlug: string;
  nodeId: string;
  codeVersionId: string;
  finding: DraftFindingWithScope | null;
  onFindingDeleted?: (deletedFindingId: string) => void;
  setSelectedFinding: React.Dispatch<React.SetStateAction<DraftFindingWithScope | null>>;
  isLoading?: boolean;
}> = ({
  teamSlug,
  nodeId,
  codeVersionId,
  finding,
  onFindingDeleted,
  setSelectedFinding,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnalysisFindingBody | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId),
    onSuccess: ({ toInvalidate }, findingId) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (onFindingDeleted) {
        onFindingDeleted(findingId);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: AnalysisFindingBody }) =>
      analysisActions.updateStagedFinding(teamSlug, nodeId, findingId, data),
    onSuccess: (_, { findingId, data }) => {
      queryClient.setQueryData<DraftFindingSchemaI[]>(
        generateQueryKey.analysisVersionDraft(nodeId),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((scope) => ({
            ...scope,
            findings: scope.findings.map((f) => {
              if (f.id === findingId) {
                const newFinding = {
                  ...f,
                  ...data,
                  draft_type: f.draft_type || "updated",
                };
                setSelectedFinding({
                  ...newFinding,
                  scope: {
                    id: scope.id,
                    code_version_node_id: scope.code_version_node_id,
                    callable: scope.callable,
                  },
                });
                return newFinding;
              }
              return f;
            }),
          }));
        },
      );
      setIsEditing(false);
    },
  });

  React.useEffect(() => {
    if (finding) {
      setFormData({
        type: finding.type as FindingType,
        level: finding.level,
        name: finding.name,
        explanation: finding.explanation,
        recommendation: finding.recommendation,
        reference: finding.reference,
      });
      setIsEditing(false);
    }
  }, [finding]);

  const handleSave = (): void => {
    if (!finding || !formData) return;
    const result = analysisFindingBodySchema.safeParse(formData);
    if (result.success) {
      updateMutation.mutate({ findingId: finding.id, data: result.data });
    }
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
          <h3 className="text-lg font-medium mb-2">No Finding Selected</h3>
          <p className="text-muted-foreground">Select a finding to edit</p>
        </div>
      </div>
    );
  }

  if (isEditing && formData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Finding</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldContent>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <FieldContent>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as FindingType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FindingType).map(([, value]) => (
                  <SelectItem key={value} value={value}>
                    {value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Level</FieldLabel>
          <FieldContent>
            <Select
              value={formData.level}
              onValueChange={(value) => setFormData({ ...formData, level: value as FindingLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FindingLevel.CRITICAL}>Critical</SelectItem>
                <SelectItem value={FindingLevel.HIGH}>High</SelectItem>
                <SelectItem value={FindingLevel.MEDIUM}>Medium</SelectItem>
                <SelectItem value={FindingLevel.LOW}>Low</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Explanation</FieldLabel>
          <FieldContent>
            <Textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={4}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Recommendation</FieldLabel>
          <FieldContent>
            <Textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={4}
              required
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel>Reference</FieldLabel>
          <FieldContent>
            <Input
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
            />
          </FieldContent>
        </Field>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EditFindingMetadata finding={finding} />
      <EditCodeSnippet
        teamSlug={teamSlug}
        codeVersionId={codeVersionId}
        codeVersionNodeId={finding.scope.code_version_node_id}
        isEditing={isEditing}
      />
      <EditFindingTabs
        finding={finding}
        onEdit={() => setIsEditing(true)}
        onDelete={() => deleteMutation.mutate(finding.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

const AddFindingDialog: React.FC<{
  scopeId: string;
  scopeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: AddAnalysisFindingBody) => void;
  isLoading: boolean;
}> = ({ scopeId, scopeName, open, onOpenChange, onAdd, isLoading }) => {
  const [formData, setFormData] = useState<AnalysisFindingBody>({
    type: FindingType.LOGIC,
    level: FindingLevel.MEDIUM,
    name: "",
    explanation: "",
    recommendation: "",
    reference: "",
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const result = analysisFindingBodySchema.safeParse(formData);
    if (result.success) {
      onAdd({
        scope_id: scopeId,
        ...result.data,
      } as AddAnalysisFindingBody);
      setFormData({
        type: FindingType.LOGIC,
        level: FindingLevel.MEDIUM,
        name: "",
        explanation: "",
        recommendation: "",
        reference: "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mb-2">
          <Plus className="size-4" />
          Add Finding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Finding</DialogTitle>
          <DialogDescription>
            Add a new finding to scope: <span className="font-mono">{scopeName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter finding name"
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as FindingType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FindingType).map(([, value]) => (
                    <SelectItem key={value} value={value}>
                      {value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Level</FieldLabel>
            <FieldContent>
              <Select
                value={formData.level || FindingLevel.MEDIUM}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value as FindingLevel })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FindingLevel.CRITICAL}>Critical</SelectItem>
                  <SelectItem value={FindingLevel.HIGH}>High</SelectItem>
                  <SelectItem value={FindingLevel.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={FindingLevel.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Explanation</FieldLabel>
            <FieldContent>
              <Textarea
                value={formData.explanation || ""}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Enter explanation"
                rows={4}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Recommendation</FieldLabel>
            <FieldContent>
              <Textarea
                value={formData.recommendation || ""}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                placeholder="Enter recommendation"
                rows={4}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Reference</FieldLabel>
            <FieldContent>
              <Input
                value={formData.reference || ""}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Enter reference"
                required
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Finding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EditClient: React.FC<{
  teamSlug: string;
  nodeId: string;
  projectSlug: string;
}> = ({ teamSlug, nodeId, projectSlug }) => {
  const router = useRouter();
  const [selectedFinding, setSelectedFinding] = useState<DraftFindingWithScope | null>(null);
  const [openCommitDialog, setOpenCommitDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: analysisVersion } = useQuery({
    queryKey: generateQueryKey.analysisVersion(nodeId),
    queryFn: () => analysisActions.getAnalysisVersion(teamSlug, nodeId),
  });

  const { data: draftScopes = [] } = useQuery<DraftFindingSchemaI[]>({
    queryKey: generateQueryKey.analysisVersionDraft(nodeId),
    queryFn: () => analysisActions.getDraft(teamSlug, nodeId),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddAnalysisFindingBody) =>
      analysisActions.addStagedFinding(teamSlug, nodeId, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const commitMutation = useMutation({
    mutationFn: () => analysisActions.commitDraft(teamSlug, nodeId),
    onSuccess: ({ id }) => {
      setOpenCommitDialog(false);
      toast.success("Changes committed successfully");
      router.push(`/${teamSlug}/${projectSlug}/analyses/${id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to commit changes");
    },
  });

  const undoStagedMutation = useMutation({
    mutationFn: (findingId: string) =>
      analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Staged change undone");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to undo staged change");
    },
  });

  const allFindings = useMemo(() => {
    const flattened: MergedFindingWithScope[] = [];
    draftScopes.forEach((scope) => {
      scope.findings.forEach((finding) => {
        flattened.push({
          ...finding,
          scope: {
            id: scope.id,
            code_version_node_id: scope.code_version_node_id,
            callable: scope.callable,
          },
        });
      });
    });
    return flattened;
  }, [draftScopes]);

  const stagedFindings = useMemo(() => {
    const staged: StagedFindingWithScope[] = [];
    draftScopes.forEach((scope) => {
      scope.staged.forEach((finding) => {
        staged.push({
          ...finding,
          scope: {
            id: scope.id,
            callable: scope.callable,
            code_version_node_id: finding.code_version_node_id || scope.code_version_node_id,
          },
        });
      });
    });
    return staged;
  }, [draftScopes]);

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

  const handleFindingDeleted = (deletedFindingId: string): void => {
    if (selectedFinding?.id === deletedFindingId) {
      const nextFinding = allFindings.find((f) => f.id !== deletedFindingId) || null;
      setSelectedFinding(nextFinding);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Mode</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-w-0">
        <EditScopesList
          teamSlug={teamSlug}
          nodeId={nodeId}
          selectedFinding={selectedFinding}
          onSelectFinding={setSelectedFinding}
          onAddFinding={(data) => addMutation.mutate(data)}
        />
        <div className="space-y-4">
          {!selectedFinding ? (
            <div className="flex items-center justify-center text-center py-12">
              <div>
                <Shield className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Finding Selected</h3>
                <p className="text-muted-foreground">Select a finding to edit</p>
              </div>
            </div>
          ) : (
            <EditFindingDetail
              teamSlug={teamSlug}
              nodeId={nodeId}
              codeVersionId={analysisVersion?.code_version_id ?? ""}
              finding={selectedFinding}
              onFindingDeleted={handleFindingDeleted}
              setSelectedFinding={setSelectedFinding}
              isLoading={false}
            />
          )}
          {stagedFindings.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    {stagedFindings.length} staged change{stagedFindings.length !== 1 ? "s" : ""}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {stagedFindings.filter((f) => f.draft_type === "add").length} to add,{" "}
                    {stagedFindings.filter((f) => f.draft_type === "updated").length} to update,{" "}
                    {stagedFindings.filter((f) => f.draft_type === "delete").length} to delete
                  </p>
                </div>
                <AlertDialog open={openCommitDialog} onOpenChange={setOpenCommitDialog}>
                  <Button
                    onClick={() => setOpenCommitDialog(true)}
                    disabled={commitMutation.isPending}
                    size="sm"
                  >
                    {commitMutation.isPending ? "Committing..." : "Commit Changes"}
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Commit Changes</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will create a new analysis version with your staged changes and set the
                        current version as its parent. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => commitMutation.mutate()}
                        disabled={commitMutation.isPending}
                      >
                        {commitMutation.isPending ? "Committing..." : "Commit Changes"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {levelOrder.map((level) => {
                  const levelFindings = stagedFindings.filter((f) => f.level === level);
                  if (levelFindings.length === 0) return null;

                  return (
                    <div key={level} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground capitalize">
                        {level}
                      </div>
                      {levelFindings.map((finding) => {
                        const isDraftDelete = finding.draft_type === "delete";
                        const isSelected = selectedFinding?.id === finding.id;
                        const stagedFindingAsDraft: DraftFindingWithScope = {
                          ...finding,
                          scope: {
                            id: finding.scope.id,
                            code_version_node_id: finding.scope.code_version_node_id,
                            callable: finding.scope.callable,
                          },
                        };
                        return (
                          <div
                            key={finding.id}
                            onClick={() => setSelectedFinding(stagedFindingAsDraft)}
                            className={cn(
                              "w-full text-left p-2 rounded border text-sm cursor-pointer transition-all duration-200",
                              getSeverityColor(level),
                              isDraftDelete && "border-dashed opacity-50",
                              isSelected
                                ? "border-opacity-60 bg-opacity-10"
                                : "hover:bg-opacity-10 hover:border-opacity-40",
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getSeverityIcon(level)}
                              <span
                                className={cn(
                                  "font-medium truncate flex-1",
                                  isDraftDelete && "line-through",
                                )}
                              >
                                {finding.name}
                              </span>
                              {finding.draft_type === "add" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  New
                                </Badge>
                              )}
                              {finding.draft_type === "updated" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Modified
                                </Badge>
                              )}
                              {isDraftDelete && (
                                <Badge variant="destructive" className="text-xs shrink-0">
                                  Deleting
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  undoStagedMutation.mutate(finding.id);
                                }}
                                disabled={undoStagedMutation.isPending}
                                title="Undo staged change"
                              >
                                <RotateCcw className="size-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {finding.scope.callable.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
