"use client";

import ShikiViewer from "@/components/shiki-viewer";
import {
  CodeContent,
  CodeDisplay,
  CodeHeader,
  CodeHolder,
  CodeMetadata,
  CodeNodeList,
  CodeSourceItem,
  CodeSources,
  CodeSourceToggle,
  getSourceColor,
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
import { useCode } from "@/providers/code";
import { CodeSourceSchemaI, NodeSchemaI } from "@/utils/types";
import React from "react";
import NodeSearch from "./search";

interface SourcesViewerProps {
  sources: CodeSourceSchemaI[];
  teamSlug: string;
  codeId: string;
}

const SourcesViewer: React.FC<SourcesViewerProps> = ({ sources, teamSlug, codeId }) => {
  const { handleSourceChange, sourceQuery, nodesQuery, containerRef, sourceId } = useCode();

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
          <NodeSearch teamSlug={teamSlug} codeId={codeId} className="w-full" />
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

export default SourcesViewer;
