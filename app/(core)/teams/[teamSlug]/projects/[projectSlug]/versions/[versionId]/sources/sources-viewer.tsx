"use client";

import { bevorAction } from "@/actions";
import SolidityViewer from "@/components/code-viewer";
import { cn } from "@/lib/utils";
import { CodeVersionSchema, ContractVersionSourceTrimI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import React, { useState } from "react";

interface SourcesViewerProps {
  version: CodeVersionSchema;
  sources: ContractVersionSourceTrimI[];
}

const SourcesViewer: React.FC<SourcesViewerProps> = ({ version, sources }) => {
  const [selectedSource, setSelectedSourceId] = useState<ContractVersionSourceTrimI | null>(
    sources.length ? sources[0] : null,
  );

  const {
    data: sourceContent,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["source", selectedSource?.id ?? "", version.id],
    queryFn: () => bevorAction.getContractVersionSource(selectedSource?.id ?? "", version.id),
    enabled: !!selectedSource,
  });

  // Parse path to show only the filename
  const getFileName = (path: string): string => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  // Get directory path (everything except filename)
  const getDirectoryPath = (path: string): string => {
    const parts = path.split("/");
    return parts.slice(0, -1).join("/");
  };

  if (sources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border border-neutral-800 rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-100 mb-2">Version Sources</h1>
            <p className="text-neutral-400">No source files found for this version.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grow border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div
          className="grid flex-1 h-full"
          style={{ gridTemplateColumns: "250px 1fr", gridTemplateRows: "auto 1fr" }}
        >
          <div className="flex items-center space-x-2 p-3 border-b border-neutral-800 bg-neutral-900">
            <span className="text-sm font-medium text-neutral-100">Sources</span>
            <span className="text-xs text-neutral-500">({sources.length})</span>
          </div>
          <div className="flex items-center space-x-2 p-3 border-b border-neutral-800 bg-neutral-900">
            <FileText className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-100">
              {getFileName(selectedSource?.path ?? "")}
            </span>
            <span className="text-xs text-neutral-500">{selectedSource?.path}</span>
          </div>
          <div className="border-r border-neutral-800 overflow-y-auto min-h-0">
            {sources.map((source) => (
              <div
                key={source.id}
                className={cn(
                  "px-3 h-14 border-b border-neutral-800 cursor-pointer transition-colors flex justify-center flex-col",
                  selectedSource?.id === source.id
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-300 hover:bg-neutral-800/50",
                )}
                onClick={() => setSelectedSourceId(source)}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      source.is_imported_dependency ? "bg-orange-500" : "bg-green-500",
                    )}
                  />
                  <span className="text-sm font-medium truncate">{getFileName(source.path)}</span>
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  {getDirectoryPath(source.path)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
            {sourceContent ? (
              <div className="flex-1 overflow-auto">
                <SolidityViewer sourceContent={sourceContent} />
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center flex-1">
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
        </div>
      </div>
    </div>
  );
};

export default SourcesViewer;
