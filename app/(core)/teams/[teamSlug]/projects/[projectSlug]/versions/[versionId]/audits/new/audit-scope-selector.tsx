"use client";

import { bevorAction } from "@/actions";
import SolidityViewer from "@/components/code-viewer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScopeHookResponse, useScopeHandler } from "@/hooks/useScopeHandler";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import {
  CodeProjectSchema,
  ContractScopeI,
  FunctionScopeI,
  TeamSchemaI,
  TreeResponseI,
} from "@/utils/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Eye,
  FileText,
  Info,
  Play,
  Replace,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuditScopeSelectorProps {
  tree: TreeResponseI[];
  team: TeamSchemaI;
  project: CodeProjectSchema;
  versionId: string;
}

const getDirectoryPath = (path: string): string => {
  const parts = path.split("/");
  return parts.slice(0, -1).join("/");
};

const getFileName = (path: string): string => {
  const parts = path.split("/");
  return parts[parts.length - 1];
};

const AuditScopeSelector: React.FC<AuditScopeSelectorProps> = ({
  tree,
  team,
  project,
  versionId,
}) => {
  const [selectedScopes, setSelectedScopes] = useState<{ identifier: string; level: string }[]>([]);
  const router = useRouter();

  const scopeHandler = useScopeHandler({
    versionId,
    scope: tree,
    sourceTriggerOn: "function",
  });

  const {
    mutate: initiateAudit,
    isPending,
    data: evalData,
  } = useMutation({
    mutationFn: async () => {
      return await bevorAction.initiateAudit(versionId, selectedScopes);
    },
  });

  // Poll for audit status
  const { data: pollingData } = useQuery({
    queryKey: ["polling", evalData?.id],
    queryFn: async () => bevorAction.getAuditStatus(evalData!.id),
    refetchInterval: (query) => {
      const { data } = query.state;
      if (!data) return 1000;
      if (["success", "failed"].includes(data.status)) {
        return false;
      }
      return 1000;
    },
    enabled: !!evalData?.id,
  });

  useEffect(() => {
    if (pollingData?.status === "success" && evalData?.id) {
      router.push(
        navigation.audit.overview({
          teamSlug: team.slug,
          projectSlug: project.slug,
          auditId: evalData.id,
        }),
      );
    }
  }, [pollingData?.status, evalData?.id, project.slug, router, team.slug]);

  const handleScopeSelect = (scope: { identifier: string; level: string }): void => {
    setSelectedScopes((prev) => {
      const isSelected = prev.some(
        (s) => s.identifier === scope.identifier && s.level === scope.level,
      );
      if (isSelected) {
        return prev.filter((s) => !(s.identifier === scope.identifier && s.level === scope.level));
      } else {
        return [...prev, scope];
      }
    });
  };

  const getAuditableCount = (source: TreeResponseI): number => {
    return source.contracts.reduce(
      (acc, contract) =>
        acc + contract.functions.reduce((acc, func) => acc + Number(func.is_auditable), 0),
      0,
    );
  };

  // Show loading state while audit is processing
  if (evalData?.id && pollingData?.status === "processing") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">Audit in Progress</h1>
            <p className="text-neutral-400">
              Your audit is being processed. This may take a few minutes depending on the code size.
            </p>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <div>
              <div className="text-sm font-medium text-neutral-100">Processing...</div>
              <div className="text-xs text-neutral-500">Audit ID: {evalData.id}</div>
            </div>
          </div>
          <div className="text-sm text-neutral-400">
            Analyzing smart contract(s) for vulnerabilities...
          </div>
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border border-neutral-800 rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">Audit Scope Selection</h1>
            <p className="text-neutral-400">No source files found for this version.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="space-y-4">
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">
              Audit Scope Selection
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-neutral-500 cursor-help ml-2" />
                </TooltipTrigger>
                <TooltipContent className="w-[400px]">
                  A function is consider &quot;auditable&quot; if it is an external function that is
                  considered an entry point to a contract. All other functions, variables, etc...
                  are only relevant within the context of these entry point functions.
                  <br />
                  Within the context of a contract of interest, functions might be inherited from
                  other contracts and become entry points as well.
                </TooltipContent>
              </Tooltip>
            </h1>
            <div>
              <p className="text-neutral-400">
                Select which parts of the code you want to audit. If no scope is selected, all
                auditable functions will be included.
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="size-4 text-neutral-500 cursor-help ml-2" />
                  </TooltipTrigger>
                  <TooltipContent className="w-[400px]">
                    Selecting an entire source or contract will include all of its inherited
                    functions by default
                  </TooltipContent>
                </Tooltip>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-6 text-xs text-neutral-500 bg-neutral-800/50 rounded-lg px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span>Auditable items</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
          <span>Non-auditable items</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Click to select/deselect</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Check className="size-4 text-green-400" />
          <span className="text-sm font-medium text-neutral-100">
            {selectedScopes.length > 0
              ? `${selectedScopes.length} scope${selectedScopes.length === 1 ? "" : "s"} selected`
              : "All auditable functions will be included"}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {selectedScopes.length > 0 && (
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => setSelectedScopes([])}
            >
              <span>Deselect All</span>
            </Button>
          )}
          <Button
            className="flex items-center space-x-2"
            onClick={() => initiateAudit()}
            disabled={isPending}
          >
            <Play className="size-4" />
            <span>{isPending ? "Starting Audit..." : "Start Audit"}</span>
          </Button>
        </div>
      </div>
      <div className="grow border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div
          className="grid flex-1 h-full"
          style={{ gridTemplateColumns: "250px 1fr", gridTemplateRows: "auto 1fr" }}
        >
          <div className="flex items-center space-x-2 p-3 border-b border-r border-neutral-800">
            <span className="text-sm font-medium text-neutral-100">Sources</span>
            <span className="text-xs text-neutral-500">({tree.length})</span>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <FileText className="size-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">
                {getFileName(scopeHandler.selectedSource?.path ?? "")}
              </span>
              <span className="text-xs text-neutral-500">{scopeHandler.selectedSource?.path}</span>
            </div>
          </div>
          <div className="border-r border-neutral-800 overflow-y-auto min-h-0">
            {tree.map((source) => (
              <TreeSource
                key={source.id}
                source={source}
                scopeHandler={scopeHandler}
                getAuditableCount={getAuditableCount}
                onScopeSelect={handleScopeSelect}
                selectedScopes={selectedScopes}
              >
                <div className="ml-4 space-y-1">
                  {source.contracts.map((contract) => (
                    <TreeContract
                      key={contract.id}
                      contract={contract}
                      scopeHandler={scopeHandler}
                      onScopeSelect={handleScopeSelect}
                      selectedScopes={selectedScopes}
                    >
                      <div className="ml-4 space-y-1">
                        {contract.functions
                          .filter((func) => func.is_auditable)
                          .map((func) => (
                            <TreeFunction
                              key={func.id}
                              func={func}
                              scopeHandler={scopeHandler}
                              onScopeSelect={handleScopeSelect}
                              selectedScopes={selectedScopes}
                            />
                          ))}
                      </div>
                    </TreeContract>
                  ))}
                </div>
              </TreeSource>
            ))}
          </div>
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            {scopeHandler.selectedSource ? (
              scopeHandler.sourceResponse.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400"></div>
                </div>
              ) : scopeHandler.sourceResponse.error ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 m-4">
                  <div className="text-red-400 mb-2">Error loading source</div>
                  <div className="text-sm text-neutral-500">
                    {scopeHandler.sourceResponse.error.message}
                  </div>
                </div>
              ) : scopeHandler.sourceResponse.data ? (
                <SolidityViewer
                  sourceContent={scopeHandler.sourceResponse.data}
                  targets={scopeHandler.targets}
                  selectedScope={scopeHandler.selectedScope}
                  onSelectScope={scopeHandler.handleScopeToggle}
                  overlayEnabled={false}
                />
              ) : (
                <div className="text-center text-neutral-500 py-12">
                  No source content available
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                Select a source file to view code
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TreeSource = ({
  source,
  scopeHandler,
  getAuditableCount,
  onScopeSelect,
  selectedScopes,
  children,
}: {
  source: TreeResponseI;
  scopeHandler: ScopeHookResponse;
  getAuditableCount: (source: TreeResponseI) => number;
  onScopeSelect: (scope: { identifier: string; level: string }) => void;
  selectedScopes: { identifier: string; level: string }[];
  children: React.ReactNode;
}): JSX.Element => {
  const isInScope = source.is_within_scope;
  const isSelected = scopeHandler.selectedSource?.id === source.id;
  const isScopeSelected = selectedScopes.some(
    (s) => s.identifier === source.id && s.level === "source",
  );
  const [isExpanded, setIsExpanded] = useState(isInScope && isSelected);
  const auditableCount = getAuditableCount(source);
  const hasAuditableFcts = auditableCount > 0;

  const toggleSource = (source: TreeResponseI): void => {
    setIsExpanded(!isExpanded);
    scopeHandler.handleSourceChange(source);
  };

  const handleSourceScopeSelect = (): void => {
    onScopeSelect({ identifier: source.id, level: "source" });
  };

  return (
    <div key={source.id} className="space-y-1">
      <div
        className={cn(
          "px-3 py-2 rounded-lg transition-colors flex justify-between items-center",
          isInScope ? "text-white" : "text-neutral-400",
          !hasAuditableFcts && "opacity-50",
        )}
      >
        <div
          className="flex flex-col min-w-0 flex-1 cursor-pointer"
          onClick={() => hasAuditableFcts && toggleSource(source)}
        >
          <div className="flex items-center space-x-2 mb-1">
            {hasAuditableFcts && (
              <div className="p-1 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                )}
              </div>
            )}
            <span className="text-sm font-medium truncate">{getFileName(source.path)}</span>
            {isInScope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-neutral-500 truncate ml-6">
            {getDirectoryPath(source.path)}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <span className="text-xs text-neutral-500">{auditableCount}</span>
          {hasAuditableFcts && (
            <button
              onClick={handleSourceScopeSelect}
              className={cn(
                "size-4 rounded transition-colors flex items-center justify-center",
                isScopeSelected
                  ? "bg-[rgba(56,139,253,0.8)]"
                  : "bg-neutral-700 hover:bg-neutral-600",
              )}
            >
              {isScopeSelected && <Check className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
      {isExpanded && children}
    </div>
  );
};

const TreeContract = ({
  contract,
  scopeHandler,
  onScopeSelect,
  selectedScopes,
  children,
}: {
  contract: ContractScopeI;
  scopeHandler: ScopeHookResponse;
  onScopeSelect: (scope: { identifier: string; level: string }) => void;
  selectedScopes: { identifier: string; level: string }[];
  children: React.ReactNode;
}): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isScopeSelected = selectedScopes.some(
    (s) => s.identifier === contract.id && s.level === "contract",
  );

  const toggleContractHandler = (contract: ContractScopeI): void => {
    setIsExpanded(!isExpanded);
    scopeHandler.handleContractChange(contract);
  };

  const handleContractScopeSelect = (): void => {
    onScopeSelect({ identifier: contract.id, level: "contract" });
  };

  const isInScope = contract.is_within_scope;

  return (
    <div key={contract.id} className="space-y-1">
      <div
        className={cn(
          "w-full flex items-center space-x-2 p-2 rounded-lg transition-colors",
          isInScope ? "text-white" : "text-neutral-400",
          isScopeSelected && "bg-[rgba(56,139,253,0.25)] border border-[rgba(56,139,253,0.8)]",
        )}
      >
        <div
          className="flex items-center space-x-2 flex-1 cursor-pointer"
          onClick={() => toggleContractHandler(contract)}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="size-4 flex-shrink-0" />
          )}
          <Code className="size-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{contract.name}</span>
          {isInScope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
        </div>
        <button
          onClick={handleContractScopeSelect}
          className={cn(
            "size-4 rounded transition-colors flex items-center justify-center",
            isScopeSelected ? "bg-[rgba(56,139,253,0.8)]" : "bg-neutral-700 hover:bg-neutral-600",
          )}
        >
          {isScopeSelected && <Check className="w-3 h-3" />}
        </button>
      </div>
      {isExpanded && children}
    </div>
  );
};

const TreeFunction = ({
  func,
  scopeHandler,
  onScopeSelect,
  selectedScopes,
}: {
  func: FunctionScopeI;
  scopeHandler: ScopeHookResponse;
  onScopeSelect: (scope: { identifier: string; level: string }) => void;
  selectedScopes: { identifier: string; level: string }[];
}): JSX.Element => {
  const isSelected = selectedScopes.some((s) => s.identifier === func.id && s.level === "function");

  return (
    <div key={func.id} className="space-y-1">
      <div
        className={cn(
          "w-full flex items-center space-x-2 p-2 rounded-lg transition-colors border border-transparent",
          func.is_within_scope ? "text-white" : "text-neutral-400",
          scopeHandler.selectedScopes.some((s) => s.id === func.id)
            ? "bg-[rgba(56,139,253,0.25)] border border-[rgba(56,139,253,0.8)]"
            : "hover:bg-neutral-800/50",
        )}
      >
        <div
          className="flex items-center space-x-2 flex-1 cursor-pointer"
          onClick={() => scopeHandler.handleFunctionChange(func)}
        >
          {func.is_within_scope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
          {func.is_override && <Replace className="w-3 h-3 text-red-400 flex-shrink-0" />}
          <span className="text-sm truncate">{func.name}</span>
        </div>
        <button
          onClick={() => onScopeSelect({ identifier: func.id, level: "function" })}
          className={cn(
            "size-4 rounded transition-colors flex items-center justify-center",
            isSelected ? "bg-[rgba(56,139,253,0.8)]" : "bg-neutral-700 hover:bg-neutral-600",
          )}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};

export default AuditScopeSelector;
