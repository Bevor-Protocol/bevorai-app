"use client";

import SolidityViewer from "@/components/code-viewer";
import * as Tooltip from "@/components/ui/tooltip";
import { ScopeHookResponse, useScopeHandler } from "@/hooks/useScopeHandler";
import { cn } from "@/lib/utils";
import { AuditSchemaI, ContractScopeI, FunctionScopeI, TreeResponseI } from "@/utils/types";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Code,
  Eye,
  FileText,
  Replace,
} from "lucide-react";
import React, { useRef, useState } from "react";

interface ScopeOverlayClientProps {
  scope: TreeResponseI[];
  audit: AuditSchemaI;
}

const getDirectoryPath = (path: string): string => {
  const parts = path.split("/");
  return parts.slice(0, -1).join("/");
};

const getFileName = (path: string): string => {
  const parts = path.split("/");
  return parts[parts.length - 1];
};

const ScopeOverlayClient: React.FC<ScopeOverlayClientProps> = ({ scope, audit }) => {
  const overlayEnabledRef = useRef<boolean>(true);
  const [, forceUpdate] = useState({});
  const scopeHandler = useScopeHandler({
    versionId: audit.code_version_mapping_id,
    scope,
    sourceTriggerOn: "function",
  });

  const toggleOverlay = (): void => {
    overlayEnabledRef.current = !overlayEnabledRef.current;
    forceUpdate({}); // Trigger re-render for button styling
  };

  if (scope.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">Audit Scope Overlay</h1>
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
          <div className="flex flex-row gap-6 text-sm justify-between">
            <div className="flex items-center space-x-2 text-neutral-300">
              <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-medium text-neutral-400">Source Type:</span>
              <span className="text-neutral-200">{audit.code_version.version_method}</span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-300">
              <Code className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="font-medium text-neutral-400">Identifier:</span>
              <span className="text-neutral-200 break-all">
                {audit.code_version.version_identifier}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-6 text-xs text-neutral-500 bg-neutral-800/50 rounded-lg px-4 py-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-3 h-3 text-green-400" />
          <span>In scope</span>
        </div>
        <div className="flex items-center space-x-2">
          <ArrowUpRight className="w-3 h-3 text-purple-400" />
          <span>Inherited</span>
        </div>
        <div className="flex items-center space-x-2">
          <Replace className="w-3 h-3 text-red-400" />
          <span>Override</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>No icon = Not in scope</span>
        </div>
      </div>
      <div className="grow border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div
          className="grid flex-1 h-full"
          style={{ gridTemplateColumns: "250px 1fr", gridTemplateRows: "auto 1fr" }}
        >
          <div className="flex items-center space-x-2 p-3 border-b border-r border-neutral-800">
            <span className="text-sm font-medium text-neutral-100">Sources</span>
            <span className="text-xs text-neutral-500">({scope.length})</span>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-100">
                {getFileName(scopeHandler.selectedSource?.path ?? "")}
              </span>
              <span className="text-xs text-neutral-500">{scopeHandler.selectedSource?.path}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleOverlay}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all duration-200 border",
                  overlayEnabledRef.current
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50"
                    : "bg-neutral-700/50 text-neutral-400 border-neutral-600/50 hover:bg-neutral-600/50 hover:border-neutral-500/70",
                )}
              >
                {overlayEnabledRef.current ? "Hide Overlay" : "Show Overlay"}
              </button>
            </div>
          </div>
          <div className="border-r border-neutral-800 overflow-y-auto min-h-0">
            {scope.map((source) => (
              <TreeSource
                key={source.id}
                source={source}
                currentSource={scopeHandler.selectedSource}
                scopeHandler={scopeHandler}
              >
                <div className="ml-4 space-y-1">
                  {source.contracts.map((contract) => (
                    <TreeContract key={contract.id} contract={contract} scopeHandler={scopeHandler}>
                      <div className="ml-4 space-y-1">
                        {contract.functions.map((func) => (
                          <TreeFunction key={func.id} func={func} scopeHandler={scopeHandler} />
                        ))}
                      </div>
                    </TreeContract>
                  ))}
                </div>
              </TreeSource>
            ))}
          </div>
          <div className="flex-1min-w-0 min-h-0 overflow-hidden">
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
                  overlayEnabled={overlayEnabledRef.current}
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
  currentSource,
  scopeHandler,
  children,
}: {
  source: TreeResponseI;
  currentSource: TreeResponseI | null;
  scopeHandler: ScopeHookResponse;
  children: React.ReactNode;
}): JSX.Element => {
  const isInScope = source.is_within_scope;
  const isSelected = currentSource?.id === source.id;
  const [isExpanded, setIsExpanded] = useState(isInScope && isSelected);
  const toggleSource = (source: TreeResponseI): void => {
    setIsExpanded(!isExpanded);
    scopeHandler.handleSourceChange(source);
  };

  return (
    <div key={source.id} className="space-y-1">
      <div
        className={cn(
          "px-3 py-2 rounded-lg transition-colors flex justify-center flex-col cursor-pointer",
          isInScope ? "text-neutral-300 hover:bg-neutral-800/50" : "text-neutral-500",
          isSelected && "bg-neutral-800 text-neutral-100",
        )}
        onClick={() => toggleSource(source)}
      >
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium truncate">{getFileName(source.path)}</span>
          {isInScope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
        </div>
        <div className="text-xs text-neutral-500 truncate">{getDirectoryPath(source.path)}</div>
      </div>
      {isExpanded && children}
    </div>
  );
};

const TreeContract = ({
  contract,
  scopeHandler,
  children,
}: {
  contract: ContractScopeI;
  scopeHandler: ScopeHookResponse;
  children: React.ReactNode;
}): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleContract = (contract: ContractScopeI): void => {
    setIsExpanded(!isExpanded);
    scopeHandler.handleContractChange(contract);
  };

  const isInScope = contract.is_within_scope;

  return (
    <div key={contract.id} className="space-y-1">
      <button
        onClick={() => toggleContract(contract)}
        className={cn(
          "w-full flex items-center space-x-2 p-2 rounded-lg text-left transition-colors",
          isInScope
            ? "hover:bg-neutral-800 text-neutral-300"
            : "hover:bg-neutral-800/50 text-neutral-500",
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Code className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{contract.name}</span>
        {isInScope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
      </button>
      {isExpanded && children}
    </div>
  );
};

const TreeFunction = ({
  func,
  scopeHandler,
}: {
  func: FunctionScopeI;
  scopeHandler: ScopeHookResponse;
}): JSX.Element => {
  return (
    <div key={func.id} className="space-y-1">
      <button
        onClick={() => scopeHandler.handleFunctionChange(func)}
        className={cn(
          "w-full flex items-center space-x-2 p-2 rounded-lg text-left transition-colors border border-transparent",
          scopeHandler.selectedScopes.some((s) => s.id === func.id)
            ? "bg-[rgba(56,139,253,0.25)] border border-[rgba(56,139,253,0.8)]"
            : func.is_within_scope
              ? "hover:bg-neutral-800 text-neutral-400"
              : "hover:bg-neutral-800/50 text-neutral-500",
        )}
      >
        {func.is_within_scope && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
        {func.is_override && <Replace className="w-3 h-3 text-red-400 flex-shrink-0" />}
        {func.is_inherited && (
          <Tooltip.Reference>
            <Tooltip.Trigger>
              <ArrowUpRight className="w-3 h-3 text-purple-400 flex-shrink-0" />
            </Tooltip.Trigger>
            <Tooltip.Content align="start">
              <div className="whitespace-nowrap">
                Inherited from <br />
                {func.contract_name_defined}
              </div>
            </Tooltip.Content>
          </Tooltip.Reference>
        )}
        <span className="text-sm truncate">{func.name}</span>
      </button>
    </div>
  );
};

export default ScopeOverlayClient;
