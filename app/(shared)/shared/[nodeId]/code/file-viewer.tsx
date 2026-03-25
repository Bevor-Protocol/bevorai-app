"use client";

import {
  CodeContent,
  CodeDisplay,
  CodeFileItem,
  CodeFiles,
  CodeFileToggle,
  CodeHeader,
  CodeHolder,
  CodeMetadata,
  CodeNodeList,
  getFileColor,
} from "@/components/ui/code";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GraphSnapshotFile, GraphSnapshotNode } from "@/types/api/responses/graph";
import React from "react";
import { useCode } from "./provider";
import NodeSearch from "./search";
import ShikiViewer from "./viewer";

interface FilesViewerProps {
  sources: GraphSnapshotFile[];
  nodeId: string;
}

const FilesViewer: React.FC<FilesViewerProps> = ({ sources, nodeId }) => {
  const { handleFileChange, fileQuery, nodesQuery, containerRef, fileId } = useCode();

  if (sources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pr-2">
        <div className="border border-border rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Version Files</h1>
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

  const currentFile = sources.find((s) => s.id === fileId);
  const currentFileName = currentFile?.path.split("/").pop() ?? "";
  const currentFileColor = currentFile ? getFileColor(currentFile) : "";

  const handleNodeClick = (node: GraphSnapshotNode): void => {
    handleFileChange(node.id, {
      start: node.src_start_pos,
      end: node.src_end_pos,
    });
  };

  return (
    <CodeHolder ref={containerRef} className="pr-2">
      <CodeMetadata>
        <CodeFileToggle>
          <NodeSearch nodeId={nodeId} className="w-full" />
          <Select value={fileId!} onValueChange={(fileId) => handleFileChange(fileId)}>
            <SelectTrigger className="max-w-full w-full px-2">
              <SelectValue>
                <div className="flex gap-2 items-center">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", currentFileColor)} />
                  {currentFileName}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-[300px] overflow-hidden">
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  <CodeFileItem source={source} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CodeFileToggle>
        <CodeFiles>
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
                    <CodeNodeList key={node.id} node={node} onNodeClick={handleNodeClick} />
                  ))}
                </div>
              )}
              {callables.length > 0 && (
                <div className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Callables ({callables.length})
                  </div>
                  {callables.map((node) => (
                    <CodeNodeList key={node.id} node={node} onNodeClick={handleNodeClick} />
                  ))}
                </div>
              )}
              {declarations.length > 0 && (
                <div className="py-2 w-full">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Declarations ({declarations.length})
                  </div>
                  {declarations.map((node) => (
                    <CodeNodeList key={node.id} node={node} onNodeClick={handleNodeClick} />
                  ))}
                </div>
              )}
            </>
          )}
        </CodeFiles>
      </CodeMetadata>
      <CodeDisplay>
        <CodeHeader path={fileQuery.data?.path} />
        <CodeContent>
          <ShikiViewer className={fileQuery.isLoading ? "opacity-50" : ""} />
        </CodeContent>
      </CodeDisplay>
    </CodeHolder>
  );
};

export default FilesViewer;
