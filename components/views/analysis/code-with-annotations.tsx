"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { FindingSchema } from "@/types/api/responses/security";
import { FileText } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import InlineFindingCard from "./inline-finding-card";

export interface FindingWithNode {
  finding: FindingSchema;
  node: GraphSnapshotNode;
}

interface CodeWithAnnotationsProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  findingsWithNodes: FindingWithNode[];
  selectedFindingId: string | null;
  expandedFindingIds: Set<string>;
  onToggleFinding: (findingId: string) => void;
  onAddFindingToContext?: (finding: FindingSchema) => void;
}

/** Build a Uint32Array of byte offsets where each line starts. */
function buildLineStartMap(content: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const lineStarts: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) lineStarts.push(i + 1);
  }
  return lineStarts;
}

/** Return 1-indexed line number for a given byte position. */
function byteToLine(lineStarts: number[], bytePos: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (lineStarts[mid] <= bytePos) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/** Extract individual line innerHTML strings from a shiki HTML output. */
function extractLines(html: string): { lines: string[]; preStyle: React.CSSProperties } {
  const div = document.createElement("div");
  div.innerHTML = html;

  const pre = div.querySelector("pre");
  const bg = pre?.style.backgroundColor ?? "#24292e";
  const color = pre?.style.color ?? "#e1e4e8";
  const preStyle: React.CSSProperties = { backgroundColor: bg, color };

  const lineEls = div.querySelectorAll(".line");
  const lines = Array.from(lineEls).map((el) => el.innerHTML);
  return { lines, preStyle };
}

const CodeWithAnnotations: React.FC<CodeWithAnnotationsProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeVersionId,
  findingsWithNodes,
  selectedFindingId,
  expandedFindingIds,
  onToggleFinding,
  onAddFindingToContext,
}) => {
  const { fileId, fileQuery, fileContentQuery, positions } = useCode();
  const [lines, setLines] = useState<string[]>([]);
  const [preStyle, setPreStyle] = useState<React.CSSProperties>({});
  const [lineStarts, setLineStarts] = useState<number[]>([0]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const findingRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string | null>(null);

  // Highlight code and parse lines
  useEffect(() => {
    const content = fileContentQuery.data;
    if (!content) {
      setLines([]);
      lastContentRef.current = null;
      return;
    }
    if (lastContentRef.current === content) return;
    lastContentRef.current = content;

    setIsHighlighting(true);

    const run = async (): Promise<void> => {
      try {
        const html = await codeToHtml(content, {
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
              span(node, _line, _col, _lineEl, token): void {
                const charStart = token.offset;
                const charEnd = charStart + token.content.length;
                const encoder = new TextEncoder();
                const bs = encoder.encode(content.slice(0, charStart)).length;
                const be = encoder.encode(content.slice(0, charEnd)).length;
                node.properties["data-token"] = `token:${bs}:${be}`;
              },
            },
          ],
        });
        const { lines: parsedLines, preStyle: ps } = extractLines(html);
        setLines(parsedLines);
        setPreStyle(ps);
        setLineStarts(buildLineStartMap(content));
      } catch (err) {
        console.error("CodeWithAnnotations: highlight error", err);
        setLines(content.split("\n"));
        setPreStyle({ backgroundColor: "#24292e", color: "#e1e4e8" });
        setLineStarts(buildLineStartMap(content));
      } finally {
        setIsHighlighting(false);
      }
    };

    run();
  }, [fileContentQuery.data]);

  // Map finding end-line -> findings to insert annotation after that line
  const findingsByEndLine = useMemo(() => {
    if (!fileId || lineStarts.length === 0) return new Map<number, FindingWithNode[]>();
    const map = new Map<number, FindingWithNode[]>();
    for (const fw of findingsWithNodes) {
      if (fw.node.file_id !== fileId) continue;
      const endLine = byteToLine(lineStarts, fw.node.src_end_pos);
      const arr = map.get(endLine) ?? [];
      arr.push(fw);
      map.set(endLine, arr);
    }
    return map;
  }, [findingsWithNodes, fileId, lineStarts]);

  // Scroll to selected finding's card
  useEffect(() => {
    if (!selectedFindingId || lines.length === 0) return;
    // Small delay to ensure the card is rendered
    const timer = setTimeout(() => {
      const el = findingRefs.current.get(selectedFindingId);
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
    return (): void => clearTimeout(timer);
  }, [selectedFindingId, lines]);

  // Scroll to node position (from NodeSearch)
  useEffect(() => {
    if (!positions || lines.length === 0 || lineStarts.length === 0 || !scrollContainerRef.current)
      return;
    const timer = setTimeout(() => {
      const lineNum = byteToLine(lineStarts, positions.start);
      const el = scrollContainerRef.current?.querySelector(`[data-line="${lineNum}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return (): void => clearTimeout(timer);
  }, [positions, lines, lineStarts]);

  const setFindingRef = useCallback(
    (findingId: string): ((el: HTMLDivElement | null) => void) =>
      (el: HTMLDivElement | null): void => {
        if (el) findingRefs.current.set(findingId, el);
        else findingRefs.current.delete(findingId);
      },
    [],
  );

  const filePath = fileQuery.data?.path;
  const fileName = filePath?.split("/").pop();
  const isLoading = fileContentQuery.isLoading || isHighlighting;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* File path header */}
      <div className="h-subheader shrink-0">
        <div className="flex items-center gap-2 border border-border rounded-t-lg pl-3 pr-1.5 bg-background size-full">
          <FileText className="size-3.5 text-zinc-500 shrink-0" />
          {!filePath ? (
            <Skeleton className="h-3.5 w-36 bg-zinc-700" />
          ) : (
            <>
              <span className="text-[13px] font-medium text-zinc-200">{fileName}</span>
              <span className="text-[11px] text-zinc-600 font-mono truncate">{filePath}</span>
            </>
          )}
        </div>
      </div>

      {/* Scrollable code content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto border border-t-0 border-border rounded-b-lg"
        id="code-holder"
      >
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-2/3" : "w-1/3"}`}
              />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No content</div>
        ) : (
          /*
           * Code + inline annotations.
           *
           * We render an outer div (font reset for annotation cards) that contains:
           *   1. A single pre>code.language-sol for all lines – needed so CSS
           *      counters (line numbers via ::before) work correctly.
           *   2. Annotation cards injected as block spans after their target line.
           *
           * Each .line span gets display:block so lines stack vertically
           * (they'd be inline inside <pre> otherwise, running together).
           *
           * The shiki-container class provides token dim/highlight effects.
           */
          <div className="min-h-full bg-background">
            <pre
              className="m-0 p-0 shiki github-dark shiki-container"
              style={{
                backgroundColor: "transparent",
                color: preStyle.color,
                fontFamily: "inherit",
              }}
            >
              <code
                className="language-sol"
                style={{
                  fontFamily:
                    "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
                  fontSize: "0.8125rem",
                  lineHeight: "1.6",
                }}
              >
                {lines.map((lineInner, idx) => {
                  const lineNum = idx + 1;
                  const lineFindings = findingsByEndLine.get(lineNum) ?? [];

                  return (
                    <React.Fragment key={lineNum}>
                      <span
                        className="line"
                        data-line={lineNum}
                        style={{ display: "block" }}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: lineInner }}
                      />
                      {lineFindings.length > 0 && (
                        <span
                          style={{
                            display: "block",
                            fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
                            fontSize: "1rem",
                            lineHeight: "1.5",
                          }}
                        >
                          {lineFindings.map(({ finding }) => (
                            <InlineFindingCard
                              key={finding.id}
                              ref={setFindingRef(finding.id)}
                              finding={finding}
                              teamSlug={teamSlug}
                              projectSlug={projectSlug}
                              nodeId={nodeId}
                              codeVersionId={codeVersionId}
                              isExpanded={expandedFindingIds.has(finding.id)}
                              onToggle={() => onToggleFinding(finding.id)}
                              onAddFindingToContext={onAddFindingToContext}
                            />
                          ))}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeWithAnnotations;
