"use client";

import { cn } from "@/lib/utils";
import { TreeResponseI } from "@/utils/types";
import {
  ChevronDown,
  ChevronRight,
  Code,
  Eye,
  Folder,
  FolderOpen,
  Shield,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

interface ContractTreeProps {
  tree: TreeResponseI[];
  selectedScope?: { identifier: string; level: string }[];
  onScopeSelect?: (scope: { identifier: string; level: string }) => void;
  className?: string;
  readOnly?: boolean;
}

const ContractTree: React.FC<ContractTreeProps> = ({
  tree,
  selectedScope = [],
  onScopeSelect,
  className,
  readOnly = false,
}) => {
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [expandedContracts, setExpandedContracts] = useState<Record<string, boolean>>({});

  const toggleSource = (sourceId: string): void => {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceId]: !prev[sourceId],
    }));
  };

  const toggleContract = (contractId: string): void => {
    setExpandedContracts((prev) => ({
      ...prev,
      [contractId]: !prev[contractId],
    }));
  };

  const isSelected = (identifier: string, level: string): boolean => {
    return selectedScope.some((scope) => scope.identifier === identifier && scope.level === level);
  };

  const getAnalysisableCount = (source: TreeResponseI): number => {
    return source.contracts.reduce(
      (acc, contract) =>
        acc + contract.functions.reduce((acc, func) => acc + Number(func.is_auditable), 0),
      0,
    );
  };

  const getContractAnalysisableCount = (contract: TreeResponseI["contracts"][0]): number => {
    return contract.functions.reduce((acc, func) => acc + Number(func.is_auditable), 0);
  };

  const getScopeCount = (source: TreeResponseI): number => {
    return source.contracts.reduce(
      (acc, contract) =>
        acc + contract.functions.reduce((acc, func) => acc + Number(func.is_within_scope), 0),
      0,
    );
  };

  const getContractScopeCount = (contract: TreeResponseI["contracts"][0]): number => {
    return contract.functions.reduce((acc, func) => acc + Number(func.is_within_scope), 0);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {tree
        .sort((a, b) => {
          // Sort by auditable content first, then alphabetically
          const aHasAnalysisable = getAnalysisableCount(a) > 0;
          const bHasAnalysisable = getAnalysisableCount(b) > 0;

          if (aHasAnalysisable && !bHasAnalysisable) return -1;
          if (!aHasAnalysisable && bHasAnalysisable) return 1;
          return a.path.localeCompare(b.path);
        })
        .map((source) => {
          const isSourceSelected = isSelected(source.id, "source");
          const isSourceExpanded = expandedSources[source.id] ?? false;
          const auditableCount = getAnalysisableCount(source);
          const scopeCount = getScopeCount(source);
          const hasAnalysisableFcts = auditableCount > 0;

          return (
            <div
              key={source.id}
              className="bg-neutral-900/50 border border-border rounded-lg overflow-hidden"
            >
              {/* Source Header */}
              <div
                className={cn(
                  "flex items-center justify-between p-3 transition-all duration-200",
                  !readOnly && "cursor-pointer",
                  isSourceSelected || source.is_within_scope
                    ? "bg-purple-500/10 border-l-4 border-l-purple-500"
                    : "hover:bg-neutral-800/50",
                  !hasAnalysisableFcts && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => {
                  if (!readOnly && hasAnalysisableFcts && onScopeSelect) {
                    onScopeSelect({ identifier: source.id, level: "source" });
                  } else if (hasAnalysisableFcts) {
                    toggleSource(source.id);
                  }
                }}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {hasAnalysisableFcts ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSource(source.id);
                        }}
                        className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                      >
                        {isSourceExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      <div className="size-6" />
                    )}
                    {isSourceExpanded ? (
                      <FolderOpen className="size-5 text-blue-400" />
                    ) : (
                      <Folder className="size-5 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-purple-400 uppercase tracking-wide flex-shrink-0">
                        Source
                      </span>
                      <span className="font-medium text-foreground truncate">{source.path}</span>
                      {source.is_imported && (
                        <span className="px-2 py-0.5 bg-neutral-700 text-xs text-foreground rounded flex-shrink-0">
                          Imported
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                  <div className="text-center min-w-[80px]">
                    <div className="font-medium text-foreground">{source.contracts.length}</div>
                    <div>Contracts</div>
                  </div>
                  {hasAnalysisableFcts && (
                    <div className="text-center min-w-[80px]">
                      <div className="font-medium text-foreground flex items-center justify-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>{auditableCount}</span>
                      </div>
                      <div>Analysisable</div>
                    </div>
                  )}
                  {readOnly && (
                    <div className="text-center min-w-[80px]">
                      <div className="font-medium text-foreground flex items-center justify-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{scopeCount}</span>
                      </div>
                      <div>In Scope</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!readOnly && isSourceSelected && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                  {readOnly && source.is_within_scope && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </div>
              </div>

              {/* Contracts */}
              {isSourceExpanded && hasAnalysisableFcts && (
                <div className="border-t border-border bg-neutral-950/30">
                  {source.contracts.map((contract) => {
                    const isContractSelected = isSelected(contract.id, "contract");
                    const isContractExpanded = expandedContracts[contract.id] ?? false;
                    const contractAnalysisableCount = getContractAnalysisableCount(contract);
                    const contractScopeCount = getContractScopeCount(contract);
                    const hasAnalysisableFcts = contractAnalysisableCount > 0;

                    return (
                      <div key={contract.id} className="border-b border-border/50 last:border-b-0">
                        {/* Contract Header */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-3 transition-all duration-200 ml-6",
                            !readOnly && "cursor-pointer",
                            isContractSelected || contract.is_within_scope
                              ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                              : "hover:bg-neutral-800/30",
                            !hasAnalysisableFcts && "opacity-50 cursor-not-allowed",
                          )}
                          onClick={() => {
                            if (!readOnly && onScopeSelect) {
                              onScopeSelect({ identifier: contract.id, level: "contract" });
                            } else if (hasAnalysisableFcts) {
                              toggleContract(contract.id);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {hasAnalysisableFcts && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleContract(contract.id);
                                  }}
                                  className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                                >
                                  {isContractExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </button>
                              )}
                              <Code className="size-4 text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-blue-400 uppercase tracking-wide flex-shrink-0">
                                  Contract
                                </span>
                                <span className="font-medium text-foreground truncate">
                                  {contract.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                            <div className="text-center min-w-[80px]">
                              <div className="font-medium text-foreground">
                                {contract.functions.length}
                              </div>
                              <div>Functions</div>
                            </div>
                            {hasAnalysisableFcts && (
                              <div className="text-center min-w-[80px]">
                                <div className="font-medium text-foreground flex items-center justify-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <span>{contractAnalysisableCount}</span>
                                </div>
                                <div>Analysisable</div>
                              </div>
                            )}
                            {readOnly && (
                              <div className="text-center min-w-[80px]">
                                <div className="font-medium text-foreground flex items-center justify-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{contractScopeCount}</span>
                                </div>
                                <div>In Scope</div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {!readOnly && isContractSelected && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            {readOnly && contract.is_within_scope && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                        </div>
                        {isContractExpanded && (
                          <div className="bg-neutral-950/50">
                            {contract.functions
                              .filter((func) => func.is_auditable)
                              .map((func) => {
                                const isFunctionSelected = isSelected(func.id, "function");
                                return (
                                  <div
                                    key={func.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 transition-all duration-200 border-b border-border/30 last:border-b-0 ml-12",
                                      !readOnly && "cursor-pointer",
                                      isFunctionSelected || func.is_within_scope
                                        ? "bg-green-500/10 border-l-4 border-l-green-500"
                                        : "hover:bg-neutral-800/30",
                                    )}
                                    onClick={() =>
                                      !readOnly &&
                                      func.is_auditable &&
                                      onScopeSelect &&
                                      onScopeSelect({ identifier: func.id, level: "function" })
                                    }
                                  >
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                      <Zap className="size-4 text-yellow-400 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs font-medium text-green-400 uppercase tracking-wide flex-shrink-0">
                                            Function
                                          </span>
                                          <span className="font-medium text-foreground truncate">
                                            {func.name}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                                      <div className="text-center min-w-[80px]">
                                        <div className="font-medium text-foreground">
                                          {func.is_override ? "Yes" : "No"}
                                        </div>
                                        <div>Override</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      {!readOnly && isFunctionSelected && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      )}
                                      {readOnly && func.is_within_scope && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default ContractTree;
