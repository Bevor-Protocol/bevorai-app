"use client";

import { cn } from "@/lib/utils";
import { ContractVersionSourceI } from "@/utils/types";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface ShikiViewerProps {
  sourceContent: ContractVersionSourceI;
  className?: string;
}

const ShikiViewer: React.FC<ShikiViewerProps> = ({ sourceContent, className }) => {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const result = await codeToHtml(sourceContent.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
          transformers: [
            {
              code(node): void {
                this.addClassToHast(node, "language-sol");
              },
              line(node, line): void {
                node.properties["data-line"] = line;
              },
              span(node, line, col, lineElement, token): void {
                const startPos = token.offset;
                const endPos = startPos + token.content.length;
                node.properties["data-token"] = `token:${startPos}:${endPos}`;
              },
            },
          ],
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHtml(`<pre><code>${sourceContent.content}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [sourceContent.content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
      </div>
    );
  }

  return (
    <div
      className={cn("shiki-container", className)}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        fontFamily:
          "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
    />
  );
};

export default ShikiViewer;
