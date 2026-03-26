"use client";

import { codeActions } from "@/actions/bevor";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

const AnalysisCodeSnippet: React.FC<{
  teamSlug: string;
  codeId: string;
  nodeId: string;
}> = ({ teamSlug, codeId, nodeId }) => {
  const [html, setHtml] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.CODES, "node", nodeId, "content"],
    queryFn: () =>
      codeActions.getNodeContent(teamSlug, codeId, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  useEffect(() => {
    if (!data) {
      setHtml("");
      return;
    }

    const highlightCode = async (): Promise<void> => {
      try {
        const result = await codeToHtml(data, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${data}</code></pre>`;
        setHtml(fallbackHtml);
      }
    };

    highlightCode();
  }, [data]);

  return (
    <div className="p-4">
      {isLoading || !html ? (
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
        <pre className="overflow-x-auto">
          <div className="shiki-container w-full" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      )}
    </div>
  );
};

export default AnalysisCodeSnippet;
