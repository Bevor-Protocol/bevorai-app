"use client";

import { analysisActions } from "@/actions/bevor";
import { Pointer } from "@/assets/icons";
import { CodeCounter, CodeHeader, CodeHolder, CodeSource, CodeSources } from "@/components/code";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { QUERY_KEYS } from "@/utils/constants";
import { AnalysisSchemaI, FunctionScopeI, TreeResponseI } from "@/utils/types";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface AnalysisScopeSelectorProps {
  tree: TreeResponseI[];
  teamId: string;
  analysis: AnalysisSchemaI;
}

const NewVersionClient: React.FC<AnalysisScopeSelectorProps> = ({ tree, teamId, analysis }) => {
  const queryClient = useQueryClient();
  const { handleSourceChange, sourceQuery, scrollRef, containerRef, isSticky } = useCode();

  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const router = useRouter();

  // const { data: prevScope } = useQuery({
  //   queryKey: [QUERY_KEYS.ANALYSIS_VERSION, analysis.current_security_head?.id],
  //   queryFn: () => analysisActions.getScope(teamId, analysis.current_security_head!.id),
  //   enabled: !!analysis.current_security_head,
  // });

  const createAnalysisVersionMutation = useMutation({
    mutationFn: async () => {
      return await analysisActions.createanalysisVersion(teamId, {
        analysis_id: analysis.id,
        scopes: selectedScopes,
        retain_scope: false,
      });
    },
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSIS_VERSION, teamId] });
    },
  });

  const { data: pollingData } = useQuery({
    queryKey: ["polling", createAnalysisVersionMutation.data],
    queryFn: async () => analysisActions.getStatus(teamId, createAnalysisVersionMutation.data!),
    refetchInterval: (query) => {
      const { data } = query.state;
      if (!data) return 1000;
      if (["success", "failed"].includes(data.status)) {
        return false;
      }
      return 1000;
    },
    enabled: !!createAnalysisVersionMutation.data,
  });

  useEffect(() => {
    if (!createAnalysisVersionMutation.data) return;
    const evalId = createAnalysisVersionMutation.data;
    if (pollingData?.status === "success" && evalId) {
      router.push(`/teams/${teamId}/analysis-versions/${evalId}`);
    }
  }, [pollingData?.status, createAnalysisVersionMutation.data, router, teamId, analysis.id]);

  const handleScopeSelect = (fct: FunctionScopeI): void => {
    if (!fct.is_auditable) return;
    if (selectedScopes.some((fctId) => fctId == fct.merkle_hash)) {
      const filtered = selectedScopes.filter((fctId) => fctId != fct.merkle_hash);
      setSelectedScopes(filtered);
    } else {
      setSelectedScopes((prev) => [...prev, fct.merkle_hash]);
    }
  };

  // Show loading state while audit is processing
  if (createAnalysisVersionMutation.isPending || pollingData?.status === "processing") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Security Analysis in Progress
            </h1>
            <p className="text-muted-foreground">
              Your audit is being processed. This may take a few minutes depending on the code size.
            </p>
          </div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <div>
              <div className="text-sm font-medium text-foreground">Processing...</div>
              <div className="text-xs text-neutral-500">
                Security Analysis ID: {createAnalysisVersionMutation.data}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Analyzing smart contract(s) for vulnerabilities...
          </div>
        </div>
      </div>
    );
  }

  if (createAnalysisVersionMutation.data) {
    return <p>{createAnalysisVersionMutation.data}</p>;
  }

  if (tree.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Analysis Scope Selection</h1>
          <p className="text-muted-foreground">No source files found for this version.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" viewportRef={scrollRef}>
      <h3 className="my-4">Analysis Scope</h3>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-between">
          <div className="flex items-center gap-6 text-xs px-4 py-2 border rounded-lg my-2 w-fit">
            <div className="flex items-center gap-2">
              <Eye className="size-3 text-green-400 shrink-0" />
              <span>Analyzable</span>
            </div>
          </div>
          <div className="flex items-center justify-start gap-6">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-green-400" />
                <span className="text-sm font-medium text-foreground">
                  {selectedScopes.length > 0
                    ? `${selectedScopes.length} scope${selectedScopes.length === 1 ? "" : "s"} selected`
                    : "All auditable functions will be included"}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="size-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[350px]">
                  <p className="text-muted-foreground leading-[1.5] my-4 text-sm">
                    Select which functions you want to be within scope of this analysis. If no scope
                    is selected, all auditable functions will be included. An auditable function is
                    one that is considered an entry point, meaning its externally callable. Child
                    functions will automatically be included if they are part of the call chain.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedScopes([])}
              disabled={selectedScopes.length === 0}
            >
              Deselect All
            </Button>
            <Button onClick={() => createAnalysisVersionMutation.mutate()}>Submit Analysis</Button>
          </div>
        </div>
      </div>
      <CodeHolder ref={containerRef}>
        <CodeCounter>
          <Badge variant="green" size="sm">
            {tree.length} sources
          </Badge>
        </CodeCounter>
        <CodeHeader path={sourceQuery.data?.path}>
          <div
            className={cn(
              "flex items-center justify-start gap-6",
              isSticky ? "animate-appear" : "hidden animate-disappear",
            )}
          >
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-green-400" />
                <span className="text-sm font-medium text-foreground">
                  {selectedScopes.length > 0
                    ? `${selectedScopes.length} scope${selectedScopes.length === 1 ? "" : "s"} selected`
                    : "All auditable functions will be included"}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedScopes([])}
              disabled={selectedScopes.length === 0}
            >
              Deselect All
            </Button>
            <Button onClick={() => createAnalysisVersionMutation.mutate()}>Submit Analysis</Button>
          </div>
        </CodeHeader>
        <CodeSources className="[&_svg]:size-4 [&_svg]:shrink-0">
          {tree.map((source) => (
            <Collapsible key={source.id} className="group/source w-full">
              <CollapsibleTrigger asChild>
                <div className="flex items-center cursor-pointer group w-full">
                  <Pointer className="mr-1 transition-transform group-data-[state=open]:rotate-90" />
                  <CodeSource
                    key={source.id}
                    path={source.path}
                    isImported={source.is_imported}
                    isActive={source.id === sourceQuery.data?.id}
                    nFcts={source.contracts.reduce(
                      (agg, contract) =>
                        agg +
                        contract.functions.reduce((agg, fct) => agg + Number(fct.is_auditable), 0),
                      0,
                    )}
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
                        checked={selectedScopes.some((scope) => scope == fct.merkle_hash)}
                        onCheckedChange={() => handleScopeSelect(fct)}
                      />
                      <div
                        className="flex gap-2 cursor-pointer max-w-10/12 text-sm"
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
        <div className="overflow-x-scroll border-r border-b rounded-br-lg">
          <ShikiViewer className={sourceQuery.isLoading ? "opacity-50" : ""} />
        </div>
      </CodeHolder>
    </ScrollArea>
  );
};

export default NewVersionClient;
