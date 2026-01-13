"use client";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FindingLevel, FindingType } from "@/utils/enums";
import {
  AnalysisNodeSchemaI,
  AnalysisScopesVersionI,
  DraftFindingSchemaI,
  FindingSchemaI,
  ScopeSchemaI,
} from "@/utils/types";
import { AlertCircle, AlertTriangle, ChevronDown, Info, XCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const isDraftFinding = (
  finding: FindingSchemaI | DraftFindingSchemaI,
): finding is DraftFindingSchemaI => {
  return "is_draft" in finding && finding.is_draft === true;
};

const renderDraftBadges = (finding: FindingSchemaI | DraftFindingSchemaI): React.ReactNode => {
  if (!isDraftFinding(finding)) return null;

  return (
    <>
      {finding.draft_type === "add" && (
        <Badge variant="secondary" className="text-xs shrink-0">
          New
        </Badge>
      )}
      {finding.draft_type === "update" && (
        <Badge variant="secondary" className="text-xs shrink-0">
          Modified
        </Badge>
      )}
    </>
  );
};

const renderDraftDelete = (
  finding: FindingSchemaI | DraftFindingSchemaI,
  level: FindingLevel,
): React.ReactNode | null => {
  if (!isDraftFinding(finding) || finding.draft_type !== "delete") return null;

  return (
    <div
      className={cn(
        "w-full text-left p-2 rounded border flex items-center justify-between group",
        getSeverityColor(level),
        "border-dashed opacity-50",
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getSeverityIcon(level)}
        <span className="text-sm font-medium truncate line-through">{finding.name}</span>
        <Badge variant="destructive" className="text-xs shrink-0">
          Deleting
        </Badge>
      </div>
    </div>
  );
};

export const getSeverityIcon = (level: FindingLevel): React.ReactElement => {
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

export const getSeverityColor = (level: FindingLevel): string => {
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

export const getSeverityBadgeClasses = (level: FindingLevel): string => {
  switch (level.toLowerCase()) {
    case "critical":
      return "border-red-500/20 text-red-600 dark:text-red-400";
    case "high":
      return "border-orange-500/20 text-orange-600 dark:text-orange-400";
    case "medium":
      return "border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    case "low":
      return "border-blue-500/20 text-blue-600 dark:text-blue-400";
    default:
      return "border-neutral-500/20 text-neutral-600 dark:text-neutral-400";
  }
};

export const levelOrder = [
  FindingLevel.CRITICAL,
  FindingLevel.HIGH,
  FindingLevel.MEDIUM,
  FindingLevel.LOW,
];

const severityScoreMap: Record<FindingLevel, number> = {
  [FindingLevel.CRITICAL]: 6,
  [FindingLevel.HIGH]: 4,
  [FindingLevel.MEDIUM]: 2,
  [FindingLevel.LOW]: 1,
};

export const getScopeForFinding = (
  finding: FindingSchemaI | DraftFindingSchemaI,
  version: FindingData,
): ScopeSchemaI => {
  const scope = version.scopes.find((s) => s.code_version_node_id === finding.code_version_node_id);
  if (!scope) {
    throw new Error(`Scope not found for finding ${finding.id}`);
  }
  return scope;
};

const getScopeStatusIndicator = (status: ScopeSchemaI["status"]): React.ReactNode => {
  switch (status) {
    case "waiting":
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="size-2 rounded-full shrink-0 pulse text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">Waiting</span>
        </div>
      );
    case "processing":
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="size-2 rounded-full shrink-0 pulse text-primary" />
          <span className="text-xs text-muted-foreground capitalize">Processing</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <XCircle className="size-2 text-destructive shrink-0" />
          <span className="text-xs text-muted-foreground capitalize">Failed</span>
        </div>
      );
    case "partial":
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertCircle className="size-3 text-yellow-400 shrink-0" />
          <span className="text-xs text-muted-foreground capitalize">Partial</span>
        </div>
      );
    case "success":
    default:
      return null;
  }
};

type GroupingMode = "scope" | "severity" | "type";

const getFindingsCountByLevel = (
  findings: (FindingSchemaI | DraftFindingSchemaI)[],
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

type FindingData =
  | { scopes: ScopeSchemaI[]; findings: FindingSchemaI[] }
  | { scopes: ScopeSchemaI[]; findings: DraftFindingSchemaI[] };

type GroupingProps<T extends FindingSchemaI | DraftFindingSchemaI> = {
  version: FindingData;
  selectedFinding?: T;
  onSelectFinding: (finding: T) => void;
  openGroups: Set<string>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  renderAddFinding?: (scopeId: string, scopeName: string) => React.ReactNode;
  checkScopeStatus?: boolean;
};

const ScopeGrouping = <T extends FindingSchemaI | DraftFindingSchemaI>({
  version,
  selectedFinding,
  onSelectFinding,
  openGroups,
  setOpenGroups,
  renderAddFinding,
  checkScopeStatus = true,
}: GroupingProps<T>): React.ReactElement => {
  const groups = version.scopes.map((scope) => ({
    scope,
    findings: version.findings.filter((f) => f.code_version_node_id === scope.code_version_node_id),
  }));

  return (
    <>
      {groups.map(({ scope, findings }) => {
        const counts = getFindingsCountByLevel(findings);
        const hasFindings = findings.length > 0;
        const isOpen = openGroups.has(scope.id);
        const isSuccess = checkScopeStatus ? scope.status === "success" : true;

        return (
          <Collapsible
            key={scope.id}
            open={isSuccess ? isOpen : isOpen}
            onOpenChange={(open) => {
              if (checkScopeStatus && !isSuccess) return;
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
            <div className="space-y-2 pr-2">
              <CollapsibleTrigger
                disabled={checkScopeStatus && !isSuccess}
                className={cn(
                  "w-full text-left flex items-start gap-2 p-2 data-[state=open]:[&>svg]:rotate-180",
                  "rounded-lg transition-colors",
                  isSuccess ? "hover:bg-accent cursor-pointer" : "cursor-default opacity-60",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate min-w-0 flex-1 text-sm">{scope.name}</div>
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
                    ) : scope.status === "success" ? (
                      <div className="text-xs text-muted-foreground shrink-0">No findings</div>
                    ) : (
                      getScopeStatusIndicator(scope.status)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                    {scope.signature}
                  </div>
                </div>
                <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 ml-6 pr-4">
                  {!hasFindings ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      {scope.status === "waiting" ||
                      scope.status === "processing" ||
                      scope.status === "failed" ||
                      scope.status === "partial" ? (
                        <>
                          {getScopeStatusIndicator(scope.status)}
                          <span>
                            {scope.status === "waiting" && "Waiting for analysis..."}
                            {scope.status === "processing" && "Analyzing scope..."}
                            {scope.status === "failed" && "Analysis failed"}
                            {scope.status === "partial" && "Partial analysis"}
                          </span>
                        </>
                      ) : (
                        "No findings in this scope"
                      )}
                    </div>
                  ) : (
                    levelOrder.map((level) => {
                      const levelFindings = findings.filter((f) => f.level === level);
                      if (levelFindings.length === 0) return null;

                      return (
                        <div key={level} className="space-y-2">
                          {levelFindings.map((finding, index) => {
                            const isSelected = selectedFinding?.id === finding.id;
                            const findingTyped = finding as T;

                            const deleteRender = renderDraftDelete(finding, level);
                            if (deleteRender)
                              return (
                                <React.Fragment key={finding.id || index}>
                                  {deleteRender}
                                </React.Fragment>
                              );

                            return (
                              <div
                                key={finding.id || index}
                                onClick={() => {
                                  onSelectFinding(findingTyped);
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
                                  {renderDraftBadges(finding)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                  {renderAddFinding && (
                    <div className="mt-2">{renderAddFinding(scope.id, scope.name)}</div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </>
  );
};

const SeverityGrouping = <T extends FindingSchemaI | DraftFindingSchemaI>({
  version,
  selectedFinding,
  onSelectFinding,
  openGroups,
  setOpenGroups,
}: GroupingProps<T>): React.ReactElement => {
  const groups = levelOrder.map((level) => ({
    key: level,
    findings: version.findings.filter((f) => f.level === level),
  }));

  return (
    <>
      {groups.map((group) => {
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
                      className={cn("text-xs shrink-0", getSeverityBadgeClasses(group.key))}
                    >
                      {group.findings.length}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="size-4 mt-1 transition-transform shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 ml-6 pr-4">
                  {group.findings.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">No findings</div>
                  ) : (
                    group.findings.map((finding, index) => {
                      const isSelected = selectedFinding?.id === finding.id;
                      const findingTyped = finding as T;
                      const findingScope = getScopeForFinding(finding, version);

                      const deleteRender = renderDraftDelete(finding, group.key);
                      if (deleteRender)
                        return (
                          <React.Fragment key={finding.id || index}>{deleteRender}</React.Fragment>
                        );

                      return (
                        <div
                          key={finding.id || index}
                          onClick={() => {
                            onSelectFinding(findingTyped);
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
                              <span className="text-sm font-medium truncate">{finding.name}</span>
                              {renderDraftBadges(finding)}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {findingScope.name}
                            </div>
                          </div>
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
    </>
  );
};

const TypeGrouping = <T extends FindingSchemaI | DraftFindingSchemaI>({
  version,
  selectedFinding,
  onSelectFinding,
  openGroups,
  setOpenGroups,
}: GroupingProps<T>): React.ReactElement => {
  // Initialize all types with empty arrays
  const typeGroups = new Map<string, FindingSchemaI[]>();
  Object.values(FindingType).forEach((type) => {
    typeGroups.set(type, []);
  });

  // Populate with actual findings
  version.findings.forEach((finding) => {
    const type = finding.type;
    if (typeGroups.has(type)) {
      typeGroups.get(type)!.push(finding);
    }
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

  return (
    <>
      {groups.map((group) => {
        const isOpen = openGroups.has(group.key);
        const typeCounts = getFindingsCountByLevel(group.findings);
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
                      {group.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                  {group.findings.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">No findings</div>
                  ) : (
                    levelOrder.map((level) => {
                      const levelFindings = group.findings.filter((f) => f.level === level);
                      if (levelFindings.length === 0) return null;

                      return (
                        <div key={level} className="space-y-2">
                          {levelFindings.map((finding, index) => {
                            const isSelected = selectedFinding?.id === finding.id;
                            const findingTyped = finding as T;
                            const findingScope = getScopeForFinding(finding, version);

                            const deleteRender = renderDraftDelete(finding, level);
                            if (deleteRender)
                              return (
                                <React.Fragment key={finding.id || index}>
                                  {deleteRender}
                                </React.Fragment>
                              );

                            return (
                              <div
                                key={finding.id || index}
                                onClick={() => {
                                  onSelectFinding(findingTyped);
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
                                    {renderDraftBadges(finding)}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono truncate">
                                    {findingScope.name}
                                  </div>
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
    </>
  );
};

const AnalysisScopes = <T extends FindingSchemaI | DraftFindingSchemaI>({
  version,
  selectedFinding,
  onSelectFinding,
  disableGrouping = false,
  renderAddFinding,
  checkScopeStatus = true,
}: {
  version?: AnalysisNodeSchemaI | AnalysisScopesVersionI;
  selectedFinding?: T;
  onSelectFinding: (finding: T) => void;
  disableGrouping?: boolean;
  renderAddFinding?: (scopeId: string, scopeName: string) => React.ReactNode;
  checkScopeStatus?: boolean;
}): React.ReactElement => {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("scope");
  const lastSelectedFindingIdRef = useRef<string | undefined>(undefined);

  const isLoading = !version;

  useEffect(() => {
    if (!selectedFinding || !version) {
      lastSelectedFindingIdRef.current = undefined;
      return;
    }

    const currentFindingId = selectedFinding.id;
    const isNewSelection = lastSelectedFindingIdRef.current !== currentFindingId;

    if (isNewSelection) {
      lastSelectedFindingIdRef.current = currentFindingId;

      setOpenGroups((prevOpenGroups) => {
        const newOpenGroups = new Set(prevOpenGroups);

        if (groupingMode === "scope") {
          const scope = getScopeForFinding(selectedFinding, version);
          newOpenGroups.add(scope.id);
        } else if (groupingMode === "severity") {
          const groupKey = selectedFinding.level;
          newOpenGroups.add(groupKey);
        } else if (groupingMode === "type") {
          const groupKey = selectedFinding.type;
          newOpenGroups.add(groupKey);
        }

        return newOpenGroups;
      });
    }
  }, [selectedFinding, groupingMode, version]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!version) {
    return (
      <div className="flex flex-col space-y-4 pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (version.scopes.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No scopes found</div>;
  }

  const groupingProps: GroupingProps<T> = {
    version: version!,
    selectedFinding,
    onSelectFinding,
    openGroups,
    setOpenGroups,
    renderAddFinding,
    checkScopeStatus,
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-start gap-2 h-8">
        <h2 className="text-lg font-semibold">Findings</h2>
        <div className="h-4 w-px bg-border mx-2" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{version.n_scopes}</span>
          <span className="text-muted-foreground/70">
            {version.n_scopes === 1 ? "scope" : "scopes"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{version.n_findings}</span>
          <span className="text-muted-foreground/70">
            {version.n_findings === 1 ? "finding" : "findings"}
          </span>
        </div>
      </div>
      {!disableGrouping && (
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
      )}
      <ScrollArea className="flex flex-col space-y-4 pr-2 overflow-y-auto max-h-[calc(100svh-var(--spacing-header)-var(--spacing-subheader)-9rem-1.5rem-2rem)]">
        <div className="w-[300px]">
          {groupingMode === "scope" && <ScopeGrouping<T> {...groupingProps} />}
          {groupingMode === "severity" && <SeverityGrouping<T> {...groupingProps} />}
          {groupingMode === "type" && <TypeGrouping<T> {...groupingProps} />}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AnalysisScopes;
