"use client";

import NodeSearch from "@/app/(core)/[teamSlug]/[projectSlug]/codes/[codeId]/search";
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
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { CodeSourceSchemaI, NodeSearchResponseI } from "@/utils/types";
import React from "react";

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

  const contracts = nodesQuery.data?.filter((n) => n.node_type === "ContractDefinition");
  const callables = nodesQuery.data?.filter(
    (n) => n.node_type === "FunctionDefinition" || n.node_type === "ModifierDefinition",
  );
  const declarations = nodesQuery.data?.filter(
    (n) =>
      n.node_type !== "ContractDefinition" &&
      n.node_type !== "FunctionDefinition" &&
      n.node_type !== "ModifierDefinition",
  );

  const currentSource = sources.find((s) => s.id === sourceId)!;
  const currentFileName = currentSource.path.split("/").pop() ?? "";
  const currentSourceColor = getSourceColor(currentSource);

  const handleNodeClick = (node: NodeSearchResponseI): void => {
    handleSourceChange(node.code_version_source_id, {
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
          <CodeNodeList
            title="Contracts"
            nodes={contracts}
            onNodeClick={handleNodeClick}
            isLoading={nodesQuery.isLoading}
          />
          <CodeNodeList
            title="Callables"
            nodes={callables}
            onNodeClick={handleNodeClick}
            isLoading={nodesQuery.isLoading}
          />
          <CodeNodeList
            title="Declarations"
            nodes={declarations}
            onNodeClick={handleNodeClick}
            isLoading={nodesQuery.isLoading}
          />
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
