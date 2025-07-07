import { cn } from "@/lib/utils";
import { TreeResponseI } from "@/utils/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ContractTreeProps {
  tree: TreeResponseI;
  selectedScope?: { identifier: string; level: string }[];
  onScopeSelect?: (scope: { identifier: string; level: string }) => void;
  className?: string;
}

const ContractTree = ({
  tree,
  selectedScope = [],
  onScopeSelect,
  className,
}: ContractTreeProps): JSX.Element => {
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

  return (
    <div className={cn("font-mono text-sm", className)}>
      {tree.sources.map((source) => {
        const isSourceSelected = selectedScope.some(
          (scope) => scope.identifier === source.id && scope.level === "source",
        );
        const isSourceExpanded = expandedSources[source.id] ?? false;
        const hasAuditableFcts =
          source.contracts.reduce(
            (acc, contract) =>
              acc + contract.functions.reduce((acc, func) => acc + Number(func.is_auditable), 0),
            0,
          ) > 0;

        return (
          <div key={source.id} className="mb-2">
            <div className="flex items-center">
              {hasAuditableFcts ? (
                <button
                  onClick={() => toggleSource(source.id)}
                  className="mr-1 p-1 hover:bg-gray-700/50 rounded"
                >
                  {isSourceExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <div className="mr-1 p-1 w-3 h-3" />
              )}
              <span
                className={cn(
                  hasAuditableFcts ? "cursor-pointer" : "cursor-not-allowed text-gray-500",
                  isSourceSelected
                    ? "text-green-400"
                    : hasAuditableFcts
                      ? "text-white"
                      : "text-gray-500",
                )}
                onClick={() =>
                  hasAuditableFcts && onScopeSelect
                    ? onScopeSelect({ identifier: source.id, level: "source" })
                    : toggleSource(source.id)
                }
              >
                {source.path}
              </span>
            </div>
            {isSourceExpanded && hasAuditableFcts && (
              <div className="ml-4">
                {source.contracts.map((contract) => {
                  const isContractSelected = selectedScope.some(
                    (scope) => scope.identifier === contract.id && scope.level === "contract",
                  );
                  const isContractExpanded = expandedContracts[contract.id] ?? false;
                  const hasAuditableFcts =
                    contract.functions.reduce((acc, func) => acc + Number(func.is_auditable), 0) >
                    0;

                  return (
                    <div key={contract.id} className="mb-1">
                      <div className="flex items-center">
                        {hasAuditableFcts && (
                          <button
                            onClick={() => toggleContract(contract.id)}
                            className="mr-1 p-1 hover:bg-gray-700/50 rounded"
                          >
                            {isContractExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        <span
                          className={cn(
                            hasAuditableFcts
                              ? "cursor-pointer"
                              : "cursor-not-allowed text-gray-500",
                            isContractSelected
                              ? "text-green-400"
                              : hasAuditableFcts
                                ? "text-white"
                                : "text-gray-500",
                          )}
                          onClick={() =>
                            onScopeSelect
                              ? onScopeSelect({ identifier: contract.id, level: "contract" })
                              : toggleContract(contract.id)
                          }
                        >
                          {contract.name}
                        </span>
                      </div>
                      {isContractExpanded && (
                        <div className="ml-4">
                          {contract.functions
                            .filter((func) => func.is_auditable)
                            .map((func) => {
                              const isFunctionSelected = selectedScope.some(
                                (scope) =>
                                  scope.identifier === func.id && scope.level === "function",
                              );
                              return (
                                <div key={func.id} className="mb-1">
                                  <span
                                    className={cn(
                                      "cursor-pointer",
                                      isFunctionSelected ? "text-green-400" : "text-white",
                                    )}
                                    onClick={() =>
                                      func.is_auditable &&
                                      onScopeSelect &&
                                      onScopeSelect({ identifier: func.id, level: "function" })
                                    }
                                  >
                                    {func.name}{" "}
                                    {func.is_inherited &&
                                      `(inherited from ${func.contract_name_defined})`}
                                  </span>
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
