"use client";

import NodeSearch from "@/app/(core)/teams/[teamSlug]/codes/[codeId]/search";
import { CodeCounter, CodeHeader, CodeHolder, CodeSource, CodeSources } from "@/components/code";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { CodeSourceSchemaI } from "@/utils/types";
import React from "react";

interface SourcesViewerProps {
  sources: CodeSourceSchemaI[];
  teamSlug: string;
  codeId: string;
}

const SourcesViewer: React.FC<SourcesViewerProps> = ({ sources, teamSlug, codeId }) => {
  const { handleSourceChange, sourceQuery, containerRef, isSticky } = useCode();

  if (sources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pr-2">
        <div className="border border-border rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Version Sources</h1>
            <p className="text-muted-foreground">No source files found for this version.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CodeHolder ref={containerRef} className="pr-2" id="me">
      <CodeCounter>
        <Badge variant="green" size="sm">
          {sources.length} sources
        </Badge>
      </CodeCounter>
      <CodeHeader path={sourceQuery.data?.path}>
        <NodeSearch
          teamSlug={teamSlug}
          codeId={codeId}
          className={cn(
            "basis-1/3 shrink min-w-[150px]",
            isSticky ? "animate-appear" : "hidden animate-disappear",
          )}
        />
      </CodeHeader>
      <CodeSources>
        {sources.map((source) => (
          <CodeSource
            key={source.id}
            path={source.path}
            isActive={source.id === sourceQuery.data?.id}
            isImported={source.is_imported_dependency}
            nFcts={source.n_auditable_fcts}
            onClick={() => handleSourceChange(source.id)}
          />
        ))}
      </CodeSources>
      <div className="overflow-x-scroll border-r border-b rounded-br-lg">
        <ShikiViewer className={sourceQuery.isLoading ? "opacity-50" : ""} />
      </div>
    </CodeHolder>
  );
};

export default SourcesViewer;
