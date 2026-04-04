"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { DraftFindingSchema, FindingLevelEnum } from "@/types/api/responses/security";
import { FileText, ShieldAlert } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { codeToHtml } from "shiki";

export interface FindingWithNode {
  finding: DraftFindingSchema;
  node: GraphSnapshotNode;
}

interface CodeWithAnnotationsProps {
  findingsWithNodes: FindingWithNode[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
}

function buildLineStartMap(content: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const lineStarts: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 10) lineStarts.push(i + 1);
  }
  return lineStarts;
}

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

const LEVEL_RANK: Record<string, number> = {
  [FindingLevelEnum.CRITICAL]: 0,
  [FindingLevelEnum.HIGH]: 1,
  [FindingLevelEnum.MEDIUM]: 2,
  [FindingLevelEnum.LOW]: 3,
};

function worstSeverityLevel(findings: FindingWithNode[]): string {
  let bestRank = 999;
  let level = FindingLevelEnum.LOW;
  for (const { finding } of findings) {
    const r = LEVEL_RANK[finding.level] ?? 99;
    if (r < bestRank) {
      bestRank = r;
      level = finding.level;
    }
  }
  return level.toLowerCase();
}

const MARKER_STYLES: Record<string, string> = {
  critical: "border-red-500/45 bg-red-950/35 text-red-200/95",
  high: "border-orange-500/40 bg-orange-950/30 text-orange-200/90",
  medium: "border-amber-500/35 bg-amber-950/25 text-amber-100/90",
  low: "border-blue-500/40 bg-blue-950/30 text-blue-200/90",
};

const CodeWithAnnotations: React.FC<CodeWithAnnotationsProps> = ({
  findingsWithNodes,
  selectedFindingId,
  onSelectFinding,
}) => {
  const { fileId, fileQuery, fileContentQuery, positions } = useCode();
  const [lines, setLines] = useState<string[]>([]);
  const [preStyle, setPreStyle] = useState<React.CSSProperties>({});
  const [lineStarts, setLineStarts] = useState<number[]>([0]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string | null>(null);

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

  const findingsByStartLine = useMemo(() => {
    if (!fileId || lineStarts.length === 0) return new Map<number, FindingWithNode[]>();
    const map = new Map<number, FindingWithNode[]>();
    for (const fw of findingsWithNodes) {
      if (fw.node.file_id !== fileId) continue;
      const startLine = byteToLine(lineStarts, fw.node.src_start_pos);
      const arr = map.get(startLine) ?? [];
      arr.push(fw);
      map.set(startLine, arr);
    }
    return map;
  }, [findingsWithNodes, fileId, lineStarts]);

  const selectedStartLine = useMemo(() => {
    if (!selectedFindingId || !fileId || lineStarts.length === 0) return null;
    const fw = findingsWithNodes.find((x) => x.finding.id === selectedFindingId);
    if (!fw || fw.node.file_id !== fileId) return null;
    return byteToLine(lineStarts, fw.node.src_start_pos);
  }, [selectedFindingId, findingsWithNodes, fileId, lineStarts]);

  useEffect(() => {
    if (!selectedFindingId || lines.length === 0 || lineStarts.length === 0 || !fileId) return;
    const fw = findingsWithNodes.find((x) => x.finding.id === selectedFindingId);
    if (!fw || fw.node.file_id !== fileId) return;
    const lineNum = byteToLine(lineStarts, fw.node.src_start_pos);
    const timer = setTimeout(() => {
      const el = scrollContainerRef.current?.querySelector(`[data-line="${lineNum}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return (): void => clearTimeout(timer);
  }, [selectedFindingId, lines, lineStarts, findingsWithNodes, fileId]);

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

  const filePath = fileQuery.data?.path;
  const fileName = filePath?.split("/").pop();
  const isLoading = fileContentQuery.isLoading || isHighlighting;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
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
          <div className="min-h-full min-w-0 max-w-full bg-background language-sol">
            {lines.map((lineInner, idx) => {
              const lineNum = idx + 1;
              const lineFindings = findingsByStartLine.get(lineNum) ?? [];
              const hasMarker = lineFindings.length > 0;
              const sev = hasMarker ? worstSeverityLevel(lineFindings) : "";
              const markerStyle = MARKER_STYLES[sev] ?? MARKER_STYLES.low;
              const isSelectedLine = selectedStartLine === lineNum;
              const primaryId = lineFindings[0]?.finding.id;

              return (
                <div
                  key={lineNum}
                  className={cn("flex min-w-0 items-stretch", isSelectedLine && "bg-blue-500/8")}
                >
                  <div className="min-w-0 flex-1 overflow-x-auto">
                    <div
                      className="m-0 shiki github-dark shiki-container p-0"
                      style={{
                        backgroundColor: "transparent",
                        color: preStyle.color,
                      }}
                    >
                      <span
                        className={cn(
                          "line block whitespace-pre font-mono text-[0.8125rem] leading-[1.6]",
                          isSelectedLine && "ring-1 ring-inset ring-blue-500/25 rounded-sm",
                        )}
                        data-line={lineNum}
                        style={{
                          fontFamily:
                            "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
                        }}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: lineInner }}
                      />
                    </div>
                  </div>
                  {hasMarker && primaryId && (
                    <button
                      type="button"
                      title={
                        lineFindings.length === 1
                          ? "Open finding"
                          : `${lineFindings.length} findings — open first`
                      }
                      onClick={() => onSelectFinding(primaryId)}
                      className={cn(
                        "shrink-0 self-stretch flex items-center gap-1 px-2 border-l border-zinc-800/90",
                        "text-[10px] font-medium uppercase tracking-wide transition-colors hover:brightness-110",
                        markerStyle,
                      )}
                    >
                      <ShieldAlert className="size-3.5 shrink-0 opacity-90" aria-hidden />
                      <span className="hidden sm:inline">
                        {lineFindings.length === 1 ? "Finding" : `${lineFindings.length}`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeWithAnnotations;
