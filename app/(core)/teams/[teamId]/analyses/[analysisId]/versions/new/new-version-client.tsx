"use client";

import { securityAnalysisActions, versionActions } from "@/actions/bevor";
import { Pointer } from "@/assets/icons";
import { CodeCounter, CodeHeader, CodeHolder, CodeSource, CodeSources } from "@/components/code";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AnalysisSchemaI, FunctionScopeI, TreeResponseI } from "@/utils/types";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Check, Eye, Replace } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

interface AnalysisScopeSelectorProps {
  tree: TreeResponseI[];
  teamId: string;
  analysis: AnalysisSchemaI;
}

const NewVersionClient: React.FC<AnalysisScopeSelectorProps> = ({ tree, teamId, analysis }) => {
  const [selectedSource, setSelectedSource] = useState<TreeResponseI | null>(
    tree.length ? tree[0] : null,
  );

  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    data: sourceContent,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["source", analysis.current_code_head?.id, selectedSource?.id ?? ""],
    queryFn: () =>
      versionActions.getCodeVersionSource(
        teamId,
        analysis.current_code_head?.id ?? "",
        selectedSource?.id ?? "",
      ),
    enabled: !!selectedSource,
    placeholderData: keepPreviousData,
  });

  const createAnalysisVersionMutation = useMutation({
    mutationFn: async () => {
      return await securityAnalysisActions.createSecurityAnalysisVersion(teamId, {
        security_analysis_id: analysis.id,
        scopes: selectedScopes,
        retain_scope: false,
      });
    },
  });

  // // Poll for audit status
  const { data: pollingData } = useQuery({
    queryKey: ["polling", createAnalysisVersionMutation.data],
    queryFn: async () =>
      securityAnalysisActions.getStatus(teamId, createAnalysisVersionMutation.data!),
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
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between">
        <div className="flex items-center gap-6 text-xs px-4 py-2 border rounded-lg my-2 w-fit">
          <div className="flex items-center gap-2">
            <Eye className="size-3 text-green-400 shrink-0" />
            <span>Analysisable items</span>
          </div>
          <div className="flex items-center gap-2">
            <Replace className="size-3 text-red-400 shrink-0" />
            <span>Override</span>
          </div>
        </div>
        <div className="flex items-center justify-start gap-6">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-green-400" />
            <span className="text-sm font-medium text-foreground">
              {selectedScopes.length > 0
                ? `${selectedScopes.length} scope${selectedScopes.length === 1 ? "" : "s"} selected`
                : "All auditable functions will be included"}
            </span>
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
      <CodeHolder style={{ gridTemplateColumns: "300px 1fr", gridTemplateRows: "auto 1fr" }}>
        <CodeCounter>
          <Badge variant="green" size="sm">
            {tree.length} sources
          </Badge>
        </CodeCounter>
        <CodeHeader path={selectedSource?.path} />
        <CodeSources className="[&_svg]:size-4 [&_svg]:shrink-0 h-[calc(100svh-(42px+3rem+1rem+2.75rem))]">
          {tree.map((source) => (
            <Collapsible key={source.id} className="group/source">
              <CollapsibleTrigger asChild>
                <div className="flex items-center cursor-pointer group">
                  <Pointer className="mr-1 transition-transform group-data-[state=open]:rotate-90" />
                  <CodeSource
                    key={source.id}
                    path={source.path}
                    isImported={source.is_imported}
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
                        className="flex gap-2 cursor-pointer max-w-10/12"
                        onClick={() => setSelectedSource(source)}
                      >
                        {fct.is_auditable && <Eye className="size-3 text-green-400 shrink-0" />}
                        {fct.is_override && <Replace className="size-3 text-red-400 shrink-0" />}
                        <span className="truncate">{fct.name}</span>
                      </div>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CodeSources>
        <div className="overflow-x-scroll border-r border-b rounded-br-lg" ref={ref} id="the-ref">
          {sourceContent ? (
            <ShikiViewer
              sourceContent={sourceContent}
              className={isLoading || isFetching ? "opacity-50" : ""}
            />
          ) : isLoading ? (
            <div className="flex items-center justify-center size-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <div className="text-red-400 mb-2">Error loading source</div>
                <div className="text-sm text-neutral-500">{error.message}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center text-neutral-500">No source content available</div>
            </div>
          )}
        </div>
      </CodeHolder>
    </div>
  );
};

export default NewVersionClient;
