"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Pointer } from "@/assets/icons";
import { AnalysisVersionElementCompact } from "@/components/analysis/element";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CodeContent,
  CodeCounter,
  CodeHeader,
  CodeHolder,
  CodeSource,
  CodeSources,
} from "@/components/ui/code";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { CreateAnalysisVersionFormValues, createAnalysisVersionSchema } from "@/utils/schema";
import {
  AnalysisNodeSchemaI,
  AnalysisStatusSchemaI,
  AnalysisThreadSchemaI,
  CodeMappingSchemaI,
  FunctionScopeI,
  TreeResponseI,
} from "@/utils/types";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Code,
  Eye,
  InfoIcon,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

interface AnalysisScopeSelectorProps {
  tree: TreeResponseI[];
  scope?: TreeResponseI[];
  teamSlug: string;
  projectSlug: string;
  threadId: string;
  analysis: AnalysisThreadSchemaI;
  defaultParentVersion?: AnalysisNodeSchemaI;
  defaultCodeVersion?: CodeMappingSchemaI;
  allowCodeVersionChange: boolean;
}

const getStatusIcon = (
  scopeStatus: AnalysisStatusSchemaI["scopes"][0]["status"],
): React.ReactNode => {
  switch (scopeStatus) {
    case "waiting":
      return <Loader2 className="size-4 text-neutral-400 animate-spin shrink-0" />;
    case "processing":
      return <Loader2 className="size-4 text-blue-400 animate-spin shrink-0" />;
    case "success":
      return <CheckCircle2 className="size-4 text-green-400 shrink-0" />;
    case "failed":
      return <XCircle className="size-4 text-destructive shrink-0" />;
    case "partial":
      return <AlertCircle className="size-4 text-yellow-400 shrink-0" />;
    default:
      return null;
  }
};

const AnalysisStatusDisplay: React.FC<{
  status: AnalysisStatusSchemaI;
  teamSlug: string;
  projectSlug: string;
  threadId: string;
  nodeId: string;
}> = ({ status, teamSlug, projectSlug, threadId, nodeId }) => {
  const newAnalysisRoute = `/${teamSlug}/${projectSlug}/analysis-threads/${threadId}/nodes/${nodeId}`;
  return (
    <div className="flex flex-col gap-4 my-8 max-w-5xl m-auto">
      <div className="space-y-4">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex gap-2 items-center pl-3">
            {getStatusIcon(status.status)}
            <span className="text-lg font-semibold">
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </span>
          </div>
          {(status.status === "partial" || status.status === "success") && (
            <Button asChild>
              <Link href={newAnalysisRoute}>
                View Results
                <Eye />
              </Link>
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {status.scopes.map((scope) => (
            <div key={scope.id} className="flex items-center gap-3 p-3 rounded-lg border">
              {getStatusIcon(scope.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{scope.callable.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {scope.callable.signature}
                </p>
              </div>
              <Badge variant="outline" size="sm" className="shrink-0">
                {scope.n_findings} finding{scope.n_findings !== 1 ? "s" : ""}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CodeVersionSelector: React.FC<{
  defaultCodeVersion?: CodeMappingSchemaI;
  teamSlug: string;
  projectSlug: string;
  allowCodeVersionChange: boolean;
}> = ({ defaultCodeVersion, teamSlug, projectSlug, allowCodeVersionChange }) => {
  const [open, setOpen] = useState(false);
  const { codeVersionId, setCodeVersionId, setSourceId } = useCode();

  const { data: codeVersions } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, { project_id: projectSlug }),
    queryFn: () => codeActions.getVersions(teamSlug, { project_id: projectSlug }),
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
      <AnalysisVersionElementCompact
        analysisVersion={defaultParentVersion}
        className="border rounded-lg w-[380px] opacity-75"
      />
    </div>
  );
};

const ScopeSelectionControls: React.FC<{
  selectedScopesCount: number;
  onDeselectAll: () => void;
  onSubmit: () => void;
  mutation: UseMutationResult<
    { id: string; toInvalidate: unknown[] },
    Error,
    CreateAnalysisVersionFormValues,
    unknown
  >;
  className?: string;
  showAnalyzable?: boolean;
  canSubmit?: boolean;
  scopeStrategy: "all" | "explicit" | "parent";
  onScopeStrategyChange: (value: "all" | "explicit" | "parent") => void;
  hasParentVersion: boolean;
}> = ({
  selectedScopesCount,
  onDeselectAll,
  onSubmit,
  mutation,
  className,
  showAnalyzable = true,
  canSubmit = true,
  scopeStrategy,
  onScopeStrategyChange,
  hasParentVersion,
}) => {
  return (
    <div className={cn("flex justify-between", className)}>
      {showAnalyzable && (
        <div className="flex items-center gap-6 text-xs px-4 py-2 border rounded-lg my-2 w-fit">
          <div className="flex items-center gap-2">
            <Eye className="size-3 text-green-400 shrink-0" />
            <span>Analyzable</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-start gap-6">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-400" />
            <span className="text-sm font-medium text-foreground">
              {selectedScopesCount > 0
                ? `${selectedScopesCount} scope${selectedScopesCount === 1 ? "" : "s"} selected`
                : "All auditable functions will be included"}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <InfoIcon className="size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[350px] text-muted-foreground">
              <p className="text-muted-foreground leading-[1.5] text-sm">
                Scopes define the entry point functions that you want to analyze. If no scope is
                selected, all auditable functions will be included. Child functions will
                automatically be included if they are part of the call chain.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
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
  initialTree: TreeResponseI[];
  selectedScopes: string[];
  onScopeSelect: (fct: FunctionScopeI) => void;
  onDeselectAll: () => void;
  onSubmit: () => void;
  mutation: UseMutationResult<
    { id: string; toInvalidate: unknown[] },
    Error,
    CreateAnalysisVersionFormValues,
    unknown
  >;
  canSubmit?: boolean;
  scopeStrategy: "all" | "explicit" | "parent";
  onScopeStrategyChange: (value: "all" | "explicit" | "parent") => void;
  hasParentVersion: boolean;
}> = ({
  teamSlug,
  initialTree,
  selectedScopes,
  onScopeSelect,
  onDeselectAll,
  onSubmit,
  mutation,
  canSubmit = true,
  scopeStrategy,
  onScopeStrategyChange,
  hasParentVersion,
}) => {
  const { handleSourceChange, sourceQuery, containerRef, isSticky, codeVersionId } = useCode();

  const { data: tree = [] } = useQuery({
    queryKey: generateQueryKey.codeTree(codeVersionId ?? ""),
    queryFn: () => codeActions.getTree(teamSlug, codeVersionId ?? ""),
    enabled: !!codeVersionId,
    placeholderData: codeVersionId ? initialTree : [],
  });

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

  return (
    <CodeHolder ref={containerRef} className="pr-2">
      <CodeCounter>
        <Badge variant="green" size="sm">
          {tree.length} sources
        </Badge>
      </CodeCounter>
      <CodeHeader path={sourceQuery.data?.path}>
        <ScopeSelectionControls
          selectedScopesCount={selectedScopes.length}
          onDeselectAll={onDeselectAll}
          onSubmit={onSubmit}
          mutation={mutation}
          className={cn(
            "flex items-center justify-start gap-6 w-full",
            isSticky ? "animate-appear" : "hidden animate-disappear",
          )}
          showAnalyzable={false}
          canSubmit={canSubmit}
          scopeStrategy={scopeStrategy}
          onScopeStrategyChange={onScopeStrategyChange}
          hasParentVersion={hasParentVersion}
        />
      </CodeHeader>
      <CodeSources className="[&_svg]:size-4 [&_svg]:shrink-0">
        {tree.map((source) => (
          <Collapsible key={source.id} className="group/source w-full">
            <CollapsibleTrigger asChild>
              <div className="flex items-center cursor-pointer group w-full">
                <Pointer className="mr-1 transition-transform group-data-[state=open]:rotate-90" />
                <CodeSource
                  key={source.id}
                  source={source}
                  isActive={source.id === sourceQuery.data?.id}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 space-y-1 border-l border-border/50 pl-2">
              {source.contracts
                .flatMap((contract) => contract.functions)
                .map((fct) => (
                  <div key={fct.id} className="flex items-center gap-2 py-1.5">
                    <Checkbox
                      disabled={!fct.is_auditable}
                      checked={selectedScopes.some((scope) => scope == fct.id)}
                      onCheckedChange={() => onScopeSelect(fct)}
                    />
                    <div
                      className="flex gap-2 cursor-pointer max-w-10/12 text-sm items-center"
                      onClick={() =>
                        handleSourceChange(source.id, {
                          start: fct.src_start_pos,
                          end: fct.src_end_pos,
                        })
                      }
                    >
                      {fct.is_auditable && <Eye className="size-3 text-green-400 shrink-0" />}
                      <span className="truncate">{fct.name}</span>
                    </div>
                  </div>
                ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CodeSources>
      <CodeContent>
        <ShikiViewer className={sourceQuery.isLoading ? "opacity-50" : ""} />
      </CodeContent>
    </CodeHolder>
  );
};

const NewVersionClient: React.FC<AnalysisScopeSelectorProps> = ({
  tree: initialTree,
  scope,
  teamSlug,
  projectSlug,
  threadId,
  analysis,
  defaultParentVersion,
  defaultCodeVersion,
  allowCodeVersionChange,
}) => {
  const queryClient = useQueryClient();
  const { codeVersionId } = useCode();

  const initialScopeState = useMemo(
    () =>
      scope?.flatMap((s) =>
        s.contracts.flatMap((c) => c.functions.filter((f) => f.is_within_scope).map((f) => f.id)),
      ) ?? [],
    [scope],
  );

  const [selectedScopes, setSelectedScopes] = useState<string[]>(initialScopeState);
  const [scopeStrategy, setScopeStrategy] = useState<"all" | "explicit" | "parent">(
    defaultParentVersion ? "parent" : "explicit",
  );

  const createAnalysisVersionMutation = useMutation({
    mutationFn: async (data: CreateAnalysisVersionFormValues) => {
      const payload = createAnalysisVersionSchema.parse(data);
      return analysisActions.createAnalysisVersion(teamSlug, payload);
    },
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Try again...",
      });
    },
  });

  const { data: status } = useQuery({
    queryKey: generateQueryKey.analysisVersionStatus(createAnalysisVersionMutation.data?.id ?? ""),
    queryFn: async () =>
      analysisActions.getStatus(teamSlug, createAnalysisVersionMutation.data!.id),
    refetchInterval: (query) => {
      const { data } = query.state;
      if (!data) return 1000;
      if (data.status === "success" || data.status === "partial") {
        return false;
      }
      if (data.status === "failed") {
        return false;
      }
      return 1000;
    },
    enabled: !!createAnalysisVersionMutation.data?.id,
  });

  const { data: tree = [] } = useQuery({
    queryKey: generateQueryKey.codeTree(codeVersionId ?? ""),
    queryFn: () => codeActions.getTree(teamSlug, codeVersionId ?? ""),
    enabled: !!codeVersionId,
    placeholderData: codeVersionId ? initialTree : [],
  });

  const allAuditableScopes = useMemo(() => {
    return (
      tree
        .flatMap((source) => source.contracts.flatMap((contract) => contract.functions))
        .filter((fct) => fct.is_auditable)
        .map((fct) => fct.id) ?? []
    );
  }, [tree]);

  React.useEffect(() => {
    if (scopeStrategy === "all" && codeVersionId) {
      setSelectedScopes(allAuditableScopes);
    } else if (scopeStrategy === "parent" && defaultParentVersion) {
      // construct the overlap, in order to set the scopes available w.r.t. the parent.
      const overlappingScopes = selectedScopes.filter((scope) =>
        allAuditableScopes.includes(scope),
      );
      setSelectedScopes(overlappingScopes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeStrategy, codeVersionId, allAuditableScopes, defaultParentVersion, initialScopeState]);

  const handleScopeSelect = (fct: FunctionScopeI): void => {
    if (!fct.is_auditable) return;
    let newScopes: string[];
    if (selectedScopes.some((fctId) => fctId == fct.id)) {
      newScopes = selectedScopes.filter((fctId) => fctId != fct.id);
    } else {
      newScopes = [...selectedScopes, fct.id];
    }
    setSelectedScopes(newScopes);

    if (scopeStrategy === "parent") {
      const scopesMatch =
        JSON.stringify([...newScopes].sort()) === JSON.stringify([...initialScopeState].sort());
      if (!scopesMatch) {
        setScopeStrategy("explicit");
      }
    }
  };

  const canSubmit = selectedScopes.length > 0;

  const handleSubmit = (): void => {
    createAnalysisVersionMutation.mutate({
      analysis_thread_id: analysis.id,
      scopes: selectedScopes,
      scope_strategy: scopeStrategy,
      ...(defaultParentVersion?.id ? { parent_version_id: defaultParentVersion.id } : {}),
      ...(codeVersionId ? { code_version_id: codeVersionId } : {}),
    });
  };

  if (status) {
    return (
      <AnalysisStatusDisplay
        status={status}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        threadId={threadId}
        nodeId={createAnalysisVersionMutation.data?.id ?? ""}
      />
    );
  }

  return (
    <>
      <div className="my-6">
        <div className="flex items-start gap-4 flex-wrap justify-between mb-2">
          <div className="flex items-start gap-4 flex-wrap">
            <CodeVersionSelector
              defaultCodeVersion={defaultCodeVersion}
              teamSlug={teamSlug}
              projectSlug={analysis.project_id}
              allowCodeVersionChange={allowCodeVersionChange}
            />
            <AnalysisVersionSelector
              defaultParentVersion={defaultParentVersion}
              teamSlug={teamSlug}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 mb-6">
        {codeVersionId && (
          <ScopeSelectionControls
            selectedScopesCount={selectedScopes.length}
            onDeselectAll={() => setSelectedScopes([])}
            onSubmit={handleSubmit}
            mutation={createAnalysisVersionMutation}
            canSubmit={canSubmit}
            scopeStrategy={scopeStrategy}
            onScopeStrategyChange={setScopeStrategy}
            hasParentVersion={!!defaultParentVersion}
          />
        )}
      </div>
      <CodeTreeViewer
        teamSlug={teamSlug}
        initialTree={initialTree}
        selectedScopes={selectedScopes}
        onScopeSelect={handleScopeSelect}
        onDeselectAll={() => setSelectedScopes([])}
        onSubmit={handleSubmit}
        mutation={createAnalysisVersionMutation}
        canSubmit={canSubmit}
        scopeStrategy={scopeStrategy}
        onScopeStrategyChange={setScopeStrategy}
        hasParentVersion={!!defaultParentVersion}
      />
    </>
  );
};

export default NewVersionClient;
