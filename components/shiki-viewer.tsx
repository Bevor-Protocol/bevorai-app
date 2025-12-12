"use client";

import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";

interface ShikiViewerProps {
  className?: string;
}

const ShikiViewer: React.FC<ShikiViewerProps> = ({ className }) => {
  const [html, setHtml] = useState<string>("");
  const {
    positions,
    sourceQuery,
    clearHighlight,
    applyHighlight,
    scrollToElement,
    htmlLoaded,
    setHtmlLoaded,
  } = useCode();
  const lastHtmlRef = useRef<string>("");
  const lastSourceIdRef = useRef<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const highlightCode = async (): Promise<void> => {
      if (!sourceQuery.data) return;
      try {
        setHtmlLoaded(false);
        const result = await codeToHtml(sourceQuery.data.content, {
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
        setHtml(`<pre><code>${sourceQuery.data.content}</code></pre>`);
      }
    };
    if (!sourceQuery.data) return;
    highlightCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceQuery.data, setHtmlLoaded]);

  useEffect(() => {
    // CodeProvider state updates cause a re-render. Since the className updates are not done
    // via JSX, we lose the class information when ANYTHING changes since we're just rendering an html string.
    // Doing this prevents that from happening.
    if (!html || !codeRef.current) return;
    codeRef.current.innerHTML = html;
    setHtmlLoaded(true);
  }, [html, setHtmlLoaded]);

  useLayoutEffect(() => {
    // on html changes, we need to wait for the paint in order to apply class changes.
    if (!positions || !htmlLoaded || !html) return;

    const htmlChanged = lastHtmlRef.current !== html;
    const sourceId = sourceQuery.data?.id ?? null;
    const sourceChanged = lastSourceIdRef.current !== sourceId;

    applyHighlight(positions);

    if (!sourceChanged || htmlChanged) {
      scrollToElement(positions);
    }

    lastHtmlRef.current = html;
    lastSourceIdRef.current = sourceId;
  }, [html, htmlLoaded, positions, applyHighlight, scrollToElement, sourceQuery.data?.id]);

  return (
    <div className="relative grow">
      {!htmlLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border" />
        </div>
      )}
      <div
        ref={codeRef}
        className={cn("shiki-container", className, !htmlLoaded && "opacity-0")}
        onClick={clearHighlight}
      />
    </div>
  );
};

// I don't love this, but otherwise search triggers re-renders, which wipes any
// class adjustments we made to the inner HTML.
export default ShikiViewer;
