"use client";

import { versionActions } from "@/actions/bevor";
import { CodeCounter, CodeHeader, CodeHolder, CodeSource, CodeSources } from "@/components/code";
import ShikiViewer from "@/components/shiki-viewer";
import { Badge } from "@/components/ui/badge";
import { CodeVersionSchema, ContractVersionSourceTrimI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import React, { useRef, useState } from "react";

interface SourcesViewerProps {
  version: CodeVersionSchema;
  sources: ContractVersionSourceTrimI[];
}

const SourcesViewer: React.FC<SourcesViewerProps> = ({ version, sources }) => {
  const [selectedSource, setSelectedSource] = useState<ContractVersionSourceTrimI | null>(
    sources.length ? sources[0] : null,
  );
  const ref = useRef<HTMLDivElement>(null);

  const {
    data: sourceContent,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["source", selectedSource?.id ?? "", version.id],
    queryFn: () => versionActions.getContractVersionSource(selectedSource?.id ?? "", version.id),
    enabled: !!selectedSource,
  });

  if (sources.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border border-border rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Version Sources</h1>
            <p className="text-muted-foreground">No source files found for this version.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSourceChange = (source: ContractVersionSourceTrimI): void => {
    if (!ref.current) return;
    const { top } = ref.current.getBoundingClientRect();
    if (top <= 44) {
      // scroll such that we're at the start of the sticky container
      window.scrollTo({
        top: window.pageYOffset + top - 44,
      });
    }

    setSelectedSource(source);
  };

  return (
    <CodeHolder>
      <CodeCounter>
        <Badge variant="green">{sources.length} sources</Badge>
      </CodeCounter>
      <CodeHeader path={selectedSource?.path} />
      <CodeSources>
        {sources.map((source) => (
          <CodeSource
            key={source.id}
            path={source.path}
            isActive={source.id === selectedSource?.id}
            isImported={source.is_imported_dependency}
            nFcts={source.n_auditable_fcts}
            onClick={() => handleSourceChange(source)}
          />
        ))}
      </CodeSources>
      <div className="flex flex-col overflow-x-scroll" ref={ref} id="the-ref">
        {sourceContent ? (
          <div className="flex-1">
            <ShikiViewer sourceContent={sourceContent} />
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
    </CodeHolder>
  );
};

export default SourcesViewer;
