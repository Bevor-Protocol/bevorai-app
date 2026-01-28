"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CodeContent,
  CodeDisplay,
  CodeHeader,
  CodeHolder,
  CodeMetadata,
  CodeNodeCheckList,
  CodeSourceItem,
  CodeSources,
  CodeSourceToggle,
  getSourceColor,
} from "@/components/ui/code";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import NodeSearch from "@/components/views/code/search";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { createAnalysisFormValues, createAnalysisSchema } from "@/utils/schema";
import { AnalysisNodeSchemaI, CodeSourceSchemaI, NodeSchemaI, ScopeSchemaI } from "@/utils/types";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { InfoIcon, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AnalysisStatusDisplay from "./status";

interface AnalysisScopeSelectorProps {
  teamSlug: string;
  projectSlug: string;
  codeId: string;
  parentScopes: ScopeSchemaI[];
  parentAnalysis?: AnalysisNodeSchemaI;
}

const ScopeSelectionControls: React.FC<{
  selectedNodes: NodeSchemaI[];
  onDeselectAll: () => void;
  onSubmit: () => void;
  mutation: UseMutationResult<
    { id: string; toInvalidate: unknown[] },
    Error,
    createAnalysisFormValues,
    unknown
  >;
  className?: string;
  canSubmit?: boolean;
  scopeStrategy: "all" | "explicit" | "parent";
  onScopeStrategyChange: (value: "all" | "explicit" | "parent") => void;
  hasParentVersion: boolean;
}> = ({
  selectedNodes,
  onDeselectAll,
  onSubmit,
  mutation,
  className,
  canSubmit = true,
  scopeStrategy,
  onScopeStrategyChange,
  hasParentVersion,
}) => {
  const selectedScopesCount = selectedNodes.length;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-end gap-6 flex-1">
        <Select
          value={scopeStrategy}
          onValueChange={(value) => onScopeStrategyChange(value as "all" | "explicit" | "parent")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="explicit">Explicit Selection</SelectItem>
            <SelectItem value="all">All Auditable Functions</SelectItem>
            {hasParentVersion && <SelectItem value="parent">Use Parent Scope</SelectItem>}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={onDeselectAll}
          disabled={selectedScopesCount === 0 || mutation.isPending || mutation.isSuccess}
        >
          Deselect All
        </Button>
        <Button
          onClick={onSubmit}
          disabled={mutation.isPending || mutation.isSuccess || !canSubmit}
        >
          Submit Analysis
        </Button>
      </div>
    </div>
  );
};

const nodeTypeGroups = [
  {
    key: "contracts",
    title: "Contracts",
    nodeType: "ContractDefinition",
  },
  {
    key: "functions",
    title: "Functions",
    nodeType: "FunctionDefinition",
  },
  {
    key: "modifiers",
    title: "Modifiers",
    nodeType: "ModifierDefinition",
  },
  {
    key: "variables",
    title: "State Variables",
    nodeType: "VariableDeclaration",
  },
  {
    key: "structs",
    title: "Structs",
    nodeType: "StructDefinition",
  },
  {
    key: "errors",
    title: "Errors",
    nodeType: "ErrorDefinition",
  },
  {
    key: "events",
    title: "Events",
    nodeType: "EventDefinition",
  },
];

const CodeTreeViewer: React.FC<{
  teamSlug: string;
  codeId: string;
  sources: CodeSourceSchemaI[];
  selectedNodes: NodeSchemaI[];
  onNodeToggle: (node: NodeSchemaI) => void;
  onSelectAllForSource?: (sourceId: string) => void;
  onDeselectAllForSource?: (sourceId: string) => void;
}> = ({
  teamSlug,
  codeId,
  sources,
  selectedNodes,
  onNodeToggle,
  onSelectAllForSource,
  onDeselectAllForSource,
}) => {
  const { handleSourceChange, sourceQuery, containerRef, nodesQuery, sourceId } = useCode();

  const nodeGroups = useMemo(() => {
    if (!nodesQuery.data) return [];
    return nodeTypeGroups.map((group) => {
      const values = nodesQuery.data.filter((n) => n.node_type === group.nodeType);
      return {
        ...group,
        values,
      };
    });
  }, [nodesQuery.data]);

  const sourceAuditableNodes = useMemo(() => {
    if (!nodesQuery.data) return [];
    return nodesQuery.data.filter((node) => node.is_auditable);
  }, [nodesQuery.data]);

  const selectedNodesForSource = useMemo(() => {
    if (!sourceId) return [];
    return selectedNodes.filter((node) => node.source_id === sourceId);
  }, [selectedNodes, sourceId]);

  const hasAuditableNodes = sourceAuditableNodes.length > 0;
  const hasSelectedNodes = selectedNodesForSource.length > 0;
  const showSourceControls = hasAuditableNodes || hasSelectedNodes;

  if (sources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pr-2">
        <div className="border border-border rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Version Sources</h1>
            <p className="text-muted-foreground">No source files found for this version.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSource = sources.find((s) => s.id === sourceId);
  const currentFileName = currentSource?.path.split("/").pop() ?? "";
  const currentSourceColor = currentSource ? getSourceColor(currentSource) : "";

  const selectedNodeIds = selectedNodes.map((n) => n.id);

  const handleNodeClick = (node: NodeSchemaI): void => {
    handleSourceChange(node.source_id, {
      start: node.src_start_pos,
      end: node.src_end_pos,
    });
  };

  return (
    <CodeHolder ref={containerRef} className="pr-2">
      <CodeMetadata>
        <CodeSourceToggle>
          <NodeSearch teamSlug={teamSlug} codeId={codeId} className="w-full" />
          <Select value={sourceId!} onValueChange={(sourceId) => handleSourceChange(sourceId)}>
            <SelectTrigger className="max-w-full w-full px-2">
              <SelectValue>
                <div className="flex gap-2 items-center">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", currentSourceColor)} />
                  {currentFileName}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-[300px] overflow-hidden">
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  <CodeSourceItem source={source} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CodeSourceToggle>
        {showSourceControls && (
          <div className="px-2 py-1.5 flex items-center gap-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSelectAllForSource?.(sourceId!)}
              disabled={!hasAuditableNodes}
            >
              Select All ({sourceAuditableNodes.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onDeselectAllForSource?.(sourceId!)}
              disabled={!hasSelectedNodes}
            >
              Deselect All ({selectedNodesForSource.length})
            </Button>
          </div>
        )}
        <CodeSources>
          {nodesQuery.isLoading ? (
            <>
              {nodeTypeGroups.map((group) => (
                <div key={group.key} className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="px-2 py-1.5">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {nodeGroups.map(
                (group) =>
                  group.values.length > 0 && (
                    <div key={group.key} className="py-2 w-full">
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        {group.title} ({group.values.length})
                      </div>
                      {group.values.map((node) => (
                        <CodeNodeCheckList
                          key={node.id}
                          node={node}
                          isChecked={selectedNodeIds.includes(node.id)}
                          isDisabled={false}
                          onNodeToggle={onNodeToggle}
                          onNodeClick={handleNodeClick}
                        />
                      ))}
                    </div>
                  ),
              )}
            </>
          )}
        </CodeSources>
      </CodeMetadata>
      <CodeDisplay>
        <CodeHeader path={sourceQuery.data?.path} />
        <CodeContent>
          <ShikiViewer className={sourceQuery.isLoading ? "opacity-50" : ""} />
        </CodeContent>
      </CodeDisplay>
    </CodeHolder>
  );
};

const NewVersionClient: React.FC<AnalysisScopeSelectorProps> = ({
  parentScopes,
  teamSlug,
  projectSlug,
  codeId,
  parentAnalysis,
}) => {
  const queryClient = useQueryClient();

  const toastRefId = useRef<string | undefined>(undefined);

  const [selectedNodes, setSelectedNodes] = useState<NodeSchemaI[]>([]);
  const [scopeStrategy, setScopeStrategy] = useState<"all" | "explicit" | "parent">(
    parentAnalysis ? "parent" : "explicit",
  );

  const { data: sources } = useSuspenseQuery({
    queryKey: generateQueryKey.codeSources(codeId),
    queryFn: () =>
      codeActions.getSources(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: code } = useSuspenseQuery({
    queryKey: generateQueryKey.code(codeId),
    queryFn: () =>
      codeActions.getCodeVersion(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: allNodes } = useQuery({
    queryKey: generateQueryKey.codeNodes(codeId),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    staleTime: Infinity,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (data: createAnalysisFormValues) => {
      const payload = createAnalysisSchema.parse(data);
      return analysisActions.createAnalysis(teamSlug, payload).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    },
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toastRefId.current = id;
      toast.loading("Analyzing functions...", { id });
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Try again...",
      });
    },
  });

  useEffect(() => {
    // someone might navigate away, and the toast could remain in a loading state. Just kill it.
    return (): void => {
      if (toastRefId.current) {
        toast.dismiss(toastRefId.current);
      }
    };
  }, []);

  const analysisNodeId = createAnalysisMutation.data?.id;

  const { data: analysis } = useQuery({
    queryKey: generateQueryKey.analysisDetailed(analysisNodeId ?? ""),
    queryFn: async () =>
      analysisActions.getAnalysisDetailed(teamSlug, analysisNodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!analysisNodeId,
    staleTime: Infinity,
  });

  const allAuditableNodes = useMemo(() => {
    if (!allNodes) return [];
    return allNodes.filter((node) => node.is_auditable);
  }, [allNodes]);

  const overlappingScopes = useMemo(() => {
    if (!parentScopes.length || !allAuditableNodes) return [];
    const existingGenericIds = parentScopes.map((s) => s.generic_id).filter(Boolean);
    return allAuditableNodes.filter((node) => existingGenericIds.includes(node.generic_id));
  }, [parentScopes, allAuditableNodes]);

  useEffect(() => {
    if (scopeStrategy === "all") {
      setSelectedNodes(allAuditableNodes as NodeSchemaI[]);
    } else if (scopeStrategy === "parent" && parentAnalysis) {
      setSelectedNodes(overlappingScopes as NodeSchemaI[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeStrategy, overlappingScopes, allAuditableNodes]);

  const handleNodeToggle = (node: NodeSchemaI): void => {
    if (!node.is_auditable) return;
    let newScopes: NodeSchemaI[];
    if (selectedNodes.some((n) => n.id === node.id)) {
      newScopes = selectedNodes.filter((n) => n.id !== node.id);
    } else {
      newScopes = [...selectedNodes, node];
    }
    setSelectedNodes(newScopes);

    // Check if all auditable nodes are selected
    const allSelected =
      allAuditableNodes.length > 0 &&
      newScopes.length === allAuditableNodes.length &&
      allAuditableNodes.every((node) => newScopes.some((n) => n.id === node.id));

    if (scopeStrategy === "parent" && parentScopes.length) {
      const scopesMatch =
        JSON.stringify([...newScopes].sort()) === JSON.stringify([...parentScopes].sort());
      if (!scopesMatch) {
        setScopeStrategy(allSelected ? "all" : "explicit");
      }
    } else if (scopeStrategy == "all") {
      if (allAuditableNodes.length !== newScopes.length) {
        setScopeStrategy("explicit");
      }
    } else if (allSelected) {
      // If all auditable nodes are selected, switch to "all" strategy
      setScopeStrategy("all");
    }
  };

  const handleSelectAllForSource = useCallback(
    (sourceId: string): void => {
      if (!allNodes) return;
      const sourceAuditableNodes = allNodes.filter(
        (node) => node.source_id === sourceId && node.is_auditable,
      );
      const newSelectedNodes = [
        ...selectedNodes.filter((n) => n.source_id !== sourceId),
        ...sourceAuditableNodes,
      ];
      setSelectedNodes(newSelectedNodes);

      // Check if all auditable nodes are now selected
      const allSelected =
        allAuditableNodes.length > 0 &&
        newSelectedNodes.length === allAuditableNodes.length &&
        allAuditableNodes.every((node) => newSelectedNodes.some((n) => n.id === node.id));

      if (scopeStrategy === "parent" && parentScopes.length) {
        const scopesMatch =
          JSON.stringify([...newSelectedNodes].sort()) === JSON.stringify([...parentScopes].sort());
        if (!scopesMatch) {
          setScopeStrategy(allSelected ? "all" : "explicit");
        }
      } else if (scopeStrategy == "all") {
        if (allAuditableNodes.length !== newSelectedNodes.length) {
          setScopeStrategy("explicit");
        }
      } else if (allSelected) {
        // If all auditable nodes are selected, switch to "all" strategy
        setScopeStrategy("all");
      }
    },
    [allNodes, selectedNodes, scopeStrategy, parentScopes, allAuditableNodes],
  );

  const handleDeselectAllForSource = useCallback(
    (sourceId: string): void => {
      const newSelectedNodes = selectedNodes.filter((n) => n.source_id !== sourceId);
      setSelectedNodes(newSelectedNodes);

      if (scopeStrategy === "parent" && parentScopes.length) {
        const scopesMatch =
          JSON.stringify([...newSelectedNodes].sort()) === JSON.stringify([...parentScopes].sort());
        if (!scopesMatch) {
          setScopeStrategy("explicit");
        }
      } else if (scopeStrategy == "all") {
        if (allAuditableNodes.length !== newSelectedNodes.length) {
          setScopeStrategy("explicit");
        }
      }
    },
    [selectedNodes, scopeStrategy, parentScopes, allAuditableNodes],
  );

  const canSubmit = selectedNodes.length > 0;

  const handleSubmit = (): void => {
    const scopeIds = selectedNodes.map((n) => n.id);
    createAnalysisMutation.mutate({
      project_id: code.project_id,
      scopes: scopeIds,
      scope_strategy: scopeStrategy,
      code_version_id: codeId,
      ...(parentAnalysis?.id ? { parent_version_id: parentAnalysis.id } : {}),
    });
  };

  if (analysis) {
    return (
      <AnalysisStatusDisplay
        analysis={analysis}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        toastRefId={toastRefId.current}
      />
    );
  }

  return (
    <>
      <ScopeSelectionControls
        selectedNodes={selectedNodes}
        onDeselectAll={() => setSelectedNodes([])}
        onSubmit={handleSubmit}
        mutation={createAnalysisMutation}
        canSubmit={canSubmit}
        scopeStrategy={scopeStrategy}
        onScopeStrategyChange={setScopeStrategy}
        hasParentVersion={!!parentAnalysis}
      />
      <div className="py-2 sticky top-0 z-10 bg-background border border-background w-full h-subheader">
        <ScrollArea>
          <div className="flex gap-4 items-center justify-start">
            <div className="text-xs font-medium text-muted-foreground flex gap-1 items-center">
              <span>Selected scopes:</span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="size-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[350px] text-muted-foreground">
                  <p className="text-muted-foreground leading-[1.5] text-sm">
                    Scopes define the entry point functions that you want to analyze. You must
                    select at least one scope to proceed. Child functions will automatically be
                    included if they are part of the call chain.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2 flex-nowrap min-w-max">
              {selectedNodes.map((node) => (
                <Badge
                  key={node.id}
                  variant="outline"
                  className="text-xs font-mono flex items-center gap-1.5 shrink-0"
                >
                  <span>{node.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeToggle(node);
                    }}
                    className="hover:bg-muted rounded-full p-0.5 transition-colors"
                  >
                    <XCircle className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <CodeTreeViewer
        teamSlug={teamSlug}
        codeId={codeId}
        sources={sources}
        selectedNodes={selectedNodes}
        onNodeToggle={handleNodeToggle}
        onSelectAllForSource={handleSelectAllForSource}
        onDeselectAllForSource={handleDeselectAllForSource}
      />
    </>
  );
};

export default NewVersionClient;
