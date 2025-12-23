"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { AnalysisVersionPreviewElement } from "@/components/analysis/element";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { CodeVersionElementCompact } from "@/components/versions/element";
import NodeSearch from "@/components/views/code/search";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { createAnalysisFormValues, createAnalysisSchema } from "@/utils/schema";
import {
  AnalysisNodeSchemaI,
  CodeMappingSchemaI,
  CodeSourceSchemaI,
  NodeSchemaI,
  ScopeSchemaI,
} from "@/utils/types";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Code, InfoIcon, XCircle } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AnalysisStatusDisplay from "./status";

interface AnalysisScopeSelectorProps {
  sources: CodeSourceSchemaI[];
  parentScopes: ScopeSchemaI[];
  teamSlug: string;
  projectSlug: string;
  defaultParentVersion?: AnalysisNodeSchemaI;
  defaultCodeVersion: CodeMappingSchemaI;
  allowCodeVersionChange: boolean;
}

const CodeVersionSelector: React.FC<{
  defaultCodeVersion?: CodeMappingSchemaI;
  teamSlug: string;
  projectSlug: string;
  allowCodeVersionChange: boolean;
}> = ({ defaultCodeVersion, teamSlug, projectSlug, allowCodeVersionChange }) => {
  const [open, setOpen] = useState(false);
  const { codeVersionId, setCodeVersionId, setSourceId } = useCode();

  const { data: codeVersions } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, { project_slug: projectSlug }),
    queryFn: () => codeActions.getVersions(teamSlug, { project_slug: projectSlug }),
    enabled: allowCodeVersionChange,
  });

  const selectedVersion =
    codeVersions?.results.find((v) => v.id === codeVersionId) ?? defaultCodeVersion;

  const handleSelect = async (codeId: string): Promise<void> => {
    setOpen(false);
    const tree = await codeActions.getTree(teamSlug, codeId);
    // update this after. Otherwise a request will fire for a new codeVersionId, and an old sourceId
    setCodeVersionId(codeId);
    if (tree.length > 0) {
      setSourceId(tree[0].id);
    }
  };

  return (
    <div className="w-fit">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-sm font-medium">Code Version</Label>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="size-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] text-muted-foreground">
            <p className="text-sm">
              Select the code version you want to analyze. This is the smart contract code that will
              be scanned for security issues.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="border flex items-center justify-between gap-4 rounded-lg pr-2 w-[380px]"
          disabled={!allowCodeVersionChange}
        >
          {selectedVersion ? (
            <CodeVersionElementCompact
              version={selectedVersion}
              className={cn(!allowCodeVersionChange && "opacity-75")}
            />
          ) : (
            <span className="text-sm text-muted-foreground h-14">
              Select code version (required)
            </span>
          )}
          {allowCodeVersionChange && <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />}
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-1" align="start">
          <ScrollArea className="h-[400px]">
            <div className="space-y-0.5">
              {codeVersions?.results.map((version) => (
                <div
                  key={version.id}
                  onClick={() => handleSelect(version.id)}
                  className={cn(
                    "cursor-pointer rounded-md transition-colors",
                    codeVersionId === version.id ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <CodeVersionElementCompact version={version} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const AnalysisVersionSelector: React.FC<{
  defaultParentVersion?: AnalysisNodeSchemaI;
  teamSlug: string;
}> = ({ defaultParentVersion }) => {
  if (!defaultParentVersion) {
    return <></>;
  }

  return (
    <div className="w-fit">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-sm font-medium">Reference Analysis Version</Label>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="size-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[400px] text-muted-foreground">
            <p className="text-sm">
              Prior analysis version used as a reference. By default, your new analysis will use the
              same scope, but can be updated. This helps track changes and enforce versioning.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <AnalysisVersionPreviewElement
        analysisVersion={defaultParentVersion}
        className="border rounded-lg w-[380px] opacity-75"
      />
    </div>
  );
};

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

const CodeTreeViewer: React.FC<{
  teamSlug: string;
  sources: CodeSourceSchemaI[];
  selectedNodes: NodeSchemaI[];
  onNodeToggle: (node: NodeSchemaI) => void;
}> = ({ teamSlug, sources, selectedNodes, onNodeToggle }) => {
  const { handleSourceChange, sourceQuery, containerRef, codeVersionId, nodesQuery, sourceId } =
    useCode();

  if (!codeVersionId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Code className="size-12 text-muted-foreground mb-4" />
        <h4 className="text-lg font-medium mb-2">Select a Code Version</h4>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Choose a code version above to view the source files and select which functions to
          analyze.
        </p>
      </div>
    );
  }

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

  const contracts = nodesQuery.data?.filter((n) => n.node_type === "ContractDefinition") ?? [];
  const callables =
    nodesQuery.data?.filter(
      (n) => n.node_type === "FunctionDefinition" || n.node_type === "ModifierDefinition",
    ) ?? [];
  const declarations =
    nodesQuery.data?.filter(
      (n) =>
        n.node_type !== "ContractDefinition" &&
        n.node_type !== "FunctionDefinition" &&
        n.node_type !== "ModifierDefinition",
    ) ?? [];

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
          <NodeSearch teamSlug={teamSlug} codeId={codeVersionId} className="w-full" />
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
        <CodeSources>
          {nodesQuery.isLoading ? (
            <>
              <div className="py-2 w-full">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Contracts</div>
                <div className="space-y-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-2 py-1.5">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="py-2 w-full">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Callables</div>
                <div className="space-y-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-2 py-1.5">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="py-2 w-full">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Declarations
                </div>
                <div className="space-y-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-2 py-1.5">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {contracts.length > 0 && (
                <div className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Contracts ({contracts.length})
                  </div>
                  {contracts.map((node) => (
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
              )}
              {callables.length > 0 && (
                <div className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Callables ({callables.length})
                  </div>
                  {callables.map((node) => (
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
              )}
              {declarations.length > 0 && (
                <div className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Declarations ({declarations.length})
                  </div>
                  {declarations.map((node) => (
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
  sources,
  parentScopes,
  teamSlug,
  projectSlug,
  defaultParentVersion,
  defaultCodeVersion,
  allowCodeVersionChange,
}) => {
  const queryClient = useQueryClient();

  const { codeVersionId, nodesQuery } = useCode();
  const toastRefId = useRef<string | undefined>(undefined);

  const [selectedNodes, setSelectedNodes] = useState<NodeSchemaI[]>([]);
  const [scopeStrategy, setScopeStrategy] = useState<"all" | "explicit" | "parent">(
    defaultParentVersion ? "parent" : "explicit",
  );

  const createAnalysisMutation = useMutation({
    mutationFn: async (data: createAnalysisFormValues) => {
      const payload = createAnalysisSchema.parse(data);
      return analysisActions.createAnalysis(teamSlug, payload);
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
    queryFn: async () => analysisActions.getAnalysisDetailed(teamSlug, analysisNodeId!),
    enabled: !!analysisNodeId,
    staleTime: Infinity,
  });

  const allAuditableNodes = useMemo(() => {
    if (!nodesQuery.data) return [];
    return nodesQuery.data.filter((node) => node.is_auditable);
  }, [nodesQuery.data]);

  const overlappingScopes = useMemo(() => {
    if (!parentScopes.length || !allAuditableNodes) return [];
    const existingGenericIds = parentScopes.map((s) => s.generic_id).filter(Boolean);
    return allAuditableNodes.filter((node) => existingGenericIds.includes(node.generic_id));
  }, [parentScopes, allAuditableNodes]);

  React.useEffect(() => {
    if (scopeStrategy === "all" && codeVersionId) {
      setSelectedNodes(allAuditableNodes as NodeSchemaI[]);
    } else if (scopeStrategy === "parent" && defaultParentVersion) {
      setSelectedNodes(overlappingScopes as NodeSchemaI[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeStrategy, codeVersionId, overlappingScopes]);

  const handleNodeToggle = (node: NodeSchemaI): void => {
    if (!node.is_auditable) return;
    let newScopes: NodeSchemaI[];
    if (selectedNodes.some((n) => n.id === node.id)) {
      newScopes = selectedNodes.filter((n) => n.id !== node.id);
    } else {
      newScopes = [...selectedNodes, node];
    }
    setSelectedNodes(newScopes);

    if (scopeStrategy === "parent" && parentScopes.length) {
      const scopesMatch =
        JSON.stringify([...newScopes].sort()) === JSON.stringify([...parentScopes].sort());
      if (!scopesMatch) {
        setScopeStrategy("explicit");
      }
    } else if (scopeStrategy == "all") {
      if (allAuditableNodes.length !== newScopes.length) {
        setScopeStrategy("explicit");
      }
    }
  };

  const canSubmit = selectedNodes.length > 0;

  const handleSubmit = (): void => {
    const scopeIds = selectedNodes.map((n) => n.id);
    createAnalysisMutation.mutate({
      project_id: defaultCodeVersion?.project_id,
      scopes: scopeIds,
      scope_strategy: scopeStrategy,
      ...(defaultParentVersion?.id ? { parent_version_id: defaultParentVersion.id } : {}),
      ...(codeVersionId ? { code_version_id: codeVersionId } : {}),
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
      <div className="flex items-start gap-4 flex-wrap justify-between mb-2">
        <div className="flex items-start gap-4 flex-wrap">
          <CodeVersionSelector
            defaultCodeVersion={defaultCodeVersion}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            allowCodeVersionChange={allowCodeVersionChange}
          />
          <AnalysisVersionSelector
            defaultParentVersion={defaultParentVersion}
            teamSlug={teamSlug}
          />
        </div>
      </div>
      <ScopeSelectionControls
        selectedNodes={selectedNodes}
        onDeselectAll={() => setSelectedNodes([])}
        onSubmit={handleSubmit}
        mutation={createAnalysisMutation}
        canSubmit={canSubmit}
        scopeStrategy={scopeStrategy}
        onScopeStrategyChange={setScopeStrategy}
        hasParentVersion={!!defaultParentVersion}
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
        sources={sources}
        selectedNodes={selectedNodes}
        onNodeToggle={handleNodeToggle}
      />
    </>
  );
};

export default NewVersionClient;
