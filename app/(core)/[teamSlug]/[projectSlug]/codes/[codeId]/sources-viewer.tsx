"use client";

import NodeSearch from "@/app/(core)/[teamSlug]/[projectSlug]/codes/[codeId]/search";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import {
  CodeContent,
  CodeCounter,
  CodeHeader,
  CodeHolder,
  CodeSource,
  CodeSources,
} from "@/components/ui/code";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { TreeResponseI } from "@/utils/types";
import React from "react";

interface SourcesViewerProps {
  tree: TreeResponseI[];
  teamSlug: string;
  codeId: string;
}

const SourcesViewer: React.FC<SourcesViewerProps> = ({ tree, teamSlug, codeId }) => {
  const { handleSourceChange, sourceQuery, containerRef, isSticky } = useCode();

  if (tree.length === 0) {
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

  return (
    <CodeHolder ref={containerRef} className="pr-2">
      <CodeCounter>
        <Badge variant="green" size="sm">
          {tree.length} sources
        </Badge>
      </CodeCounter>
      <CodeHeader path={sourceQuery.data?.path}>
        {isSticky && (
          <NodeSearch
            teamSlug={teamSlug}
            codeId={codeId}
            className={cn(
              "basis-1/3 shrink min-w-[150px] h-full border-0 border-l",
              isSticky ? "animate-appear" : "hidden animate-disappear",
            )}
          />
        )}
      </CodeHeader>
      <CodeSources>
        {tree.map((source) => (
          <CodeSource
            key={source.id}
            source={source}
            isActive={source.id === sourceQuery.data?.id}
            onClick={() => handleSourceChange(source.id)}
          />
        ))}
      </CodeSources>
      <CodeContent>
        <ShikiViewer className={sourceQuery.isLoading ? "opacity-50" : ""} />
      </CodeContent>
    </CodeHolder>
  );
};

export default SourcesViewer;
