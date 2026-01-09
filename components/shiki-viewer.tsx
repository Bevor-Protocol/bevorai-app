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
    codeVersionId,
  } = useCode();
  const lastHtmlRef = useRef<string>("");
  const lastSourceIdRef = useRef<string | null>(null);
  const lastCodeVersionIdRef = useRef<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const isInitialRenderRef = useRef(true);

  const charToByteIndex = (source: string, charIndex: number): number => {
    const encoder = new TextEncoder();
    return encoder.encode(source.slice(0, charIndex)).length;
  };

  useEffect(() => {
    const codeVersionChanged = lastCodeVersionIdRef.current !== codeVersionId;
    if (codeVersionChanged) {
      lastCodeVersionIdRef.current = codeVersionId;
      lastSourceIdRef.current = null;
      isInitialRenderRef.current = true;
      setHtml("");
      setHtmlLoaded(false);
    }

    if (!sourceQuery.data) {
      if (!codeVersionChanged) {
        setHtml("");
        setHtmlLoaded(false);
        lastSourceIdRef.current = null;
      }
      return;
    }

    const sourceData = sourceQuery.data;
    const highlightCode = async (): Promise<void> => {
      const currentSourceId = sourceData.id;
      const sourceChanged = lastSourceIdRef.current !== currentSourceId;

      if (sourceChanged && !isInitialRenderRef.current) {
        setHtmlLoaded(false);
      }

      try {
        const result = await codeToHtml(sourceData.content, {
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
                const charStartPos = token.offset;
                const charEndPos = charStartPos + token.content.length;
                const byteStartPos = charToByteIndex(sourceData.content, charStartPos);
                const byteEndPos = charToByteIndex(sourceData.content, charEndPos);
                node.properties["data-token"] = `token:${byteStartPos}:${byteEndPos}`;
              },
            },
          ],
        });
        setHtml(result);
        lastSourceIdRef.current = currentSourceId;
        isInitialRenderRef.current = false;
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${sourceData.content}</code></pre>`;
        setHtml(fallbackHtml);
        lastSourceIdRef.current = currentSourceId;
        isInitialRenderRef.current = false;
      }
    };

    highlightCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceQuery.data, codeVersionId, setHtmlLoaded]);

  useLayoutEffect(() => {
    // CodeProvider state updates cause a re-render. Since the className updates are not done
    // via JSX, we lose the class information when ANYTHING changes since we're just rendering an html string.
    // Doing this prevents that from happening.
    if (!html) {
      if (codeRef.current) {
        codeRef.current.innerHTML = "";
      }
      return;
    }
    if (!codeRef.current) return;
    codeRef.current.innerHTML = html;
    setHtmlLoaded(true);
  }, [html, codeVersionId, setHtmlLoaded]);

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
