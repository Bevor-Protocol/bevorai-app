"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { NodeWithContentSchemaI } from "@/utils/types";
import { UseQueryResult } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

const AnalysisCodeSnippet: React.FC<{
  nodeQuery: UseQueryResult<NodeWithContentSchemaI, Error>;
}> = ({ nodeQuery }) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!nodeQuery.data?.content) {
      setHtml("");
      return;
    }

    const highlightCode = async (): Promise<void> => {
      try {
        const result = await codeToHtml(nodeQuery.data.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${nodeQuery.data.content}</code></pre>`;
        setHtml(fallbackHtml);
      }
    };

    highlightCode();
  }, [nodeQuery.data?.content]);

  return (
    <div className="border rounded-lg flex-1 min-h-0 flex flex-col">
      <ScrollArea className="p-2 flex-1 min-h-[300px]">
        {nodeQuery.isLoading || !html ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/6" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/6" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : (
          <div
            className="shiki-container overflow-x-auto w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AnalysisCodeSnippet;
