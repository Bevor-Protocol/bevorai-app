"use client";

import { ContractVersionSourceI } from "@/utils/types";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface ShikiViewerProps {
  sourceContent: ContractVersionSourceI;
}

const ShikiViewer: React.FC<ShikiViewerProps> = ({ sourceContent }) => {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true);
        const result = await codeToHtml(sourceContent.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
          transformers: [
            {
              code(node) {
                this.addClassToHast(node, "language-sol");
              },
              line(node, line) {
                node.properties["data-line"] = line;
              },
              span(node, line, col, lineElement, token) {
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
    <div className="h-full overflow-auto">
      <div
        className="shiki-container"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      />
    </div>
  );
};

export default ShikiViewer;
