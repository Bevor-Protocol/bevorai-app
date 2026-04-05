"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { FindingLevelEnum, FindingSchema } from "@/types/api/responses/security";
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen, Plus } from "lucide-react";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import NodeSearch from "../code/search";
import { FindingWithNode } from "./code-with-annotations";
import { FindingFormDialog } from "./finding-form-dialog";
import InlineFindingCard from "./inline-finding-card";

/** Sized so findings stay readable without crowding code + chat (was 40rem max before, ~21rem felt tight). */
const SIDEBAR_WIDTH_CLASS = "shrink-0 grow-0 min-w-[17rem] w-[min(28rem,36vw)] max-w-[30rem]";

/** Matches `nodeTypeGroups` in file-viewer (graph API uses snake_case). */
const FINDING_FORM_CALLABLE_NODE_TYPES = new Set<string>([
  "function_definition",
  "constructor_definition",
  "modifier_definition",
  "FunctionDefinition",
  "ModifierDefinition",
]);

interface FileTreeFindingsProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeId: string;
  isOwner: boolean;
  allFindingsWithNodes: FindingWithNode[];
  /** Full graph nodes for the code version (same query as finding locations). Resolves scope ids to paths. */
  codeVersionNodes: GraphSnapshotNode[];
  findingsGraphLoading: boolean;
  selectedFindingId: string | null;
  expandedFindingIds: Set<string>;
  onFindingClick: (finding: FindingSchema) => void;
  onShowFindingInCode: (finding: FindingSchema) => void;
  onToggleFinding: (findingId: string) => void;
  onAddFindingToContext?: (finding: FindingSchema) => void;
  /** When the next selection matches this finding id, skip auto-opening folders in the file tree (cleared after skip). */
  skipTreeExpandForFindingRef: React.MutableRefObject<string | null>;
}

interface FileLeaf {
  kind: "file";
  name: string;
  fileId: string;
  fullPath: string;
  findings: FindingWithNode[];
}

interface FolderNode {
  kind: "folder";
  name: string;
  children: TreeEntry[];
}

type TreeEntry = FolderNode | FileLeaf;

function buildTree(
  files: {
    path: string;
    fileId: string;
    findings: FindingWithNode[];
  }[],
): TreeEntry[] {
  const root: FolderNode = { kind: "folder", name: "", children: [] };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts[i];
      let child = current.children.find(
        (c): c is FolderNode => c.kind === "folder" && c.name === segment,
      );
      if (!child) {
        child = { kind: "folder", name: segment, children: [] };
        current.children.push(child);
      }
      current = child;
    }

    const fileName = parts[parts.length - 1] ?? file.path;
    current.children.push({
      kind: "file",
      name: fileName,
      fileId: file.fileId,
      fullPath: file.path,
      findings: file.findings,
    });
  }

  return root.children;
}

function getFolderPathsWithFindings(entries: TreeEntry[], prefix = ""): string[] {
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.kind !== "folder") continue;
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (folderHasFindings(entry)) paths.push(fullPath);
    paths.push(...getFolderPathsWithFindings(entry.children, fullPath));
  }
  return paths;
}

function folderHasFindings(folder: FolderNode): boolean {
  for (const child of folder.children) {
    if (child.kind === "file" && child.findings.length > 0) return true;
    if (child.kind === "folder" && folderHasFindings(child)) return true;
  }
  return false;
}

function sortTree(entries: TreeEntry[]): TreeEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) =>
      entry.kind === "folder" ? { ...entry, children: sortTree(entry.children) } : entry,
    );
}

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

/** All findings under this tree slice, rolled up by severity (nested files + subfolders). */
function aggregateFindingCountsByLevel(entries: TreeEntry[]): {
  level: FindingLevelEnum;
  count: number;
}[] {
  const map = new Map<FindingLevelEnum, number>();
  const visit = (e: TreeEntry): void => {
    if (e.kind === "file") {
      for (const fw of e.findings) {
        const lvl = fw.finding.level;
        map.set(lvl, (map.get(lvl) ?? 0) + 1);
      }
      return;
    }
    for (const child of e.children) visit(child);
  };
  for (const entry of entries) visit(entry);
  return Object.values(FindingLevelEnum)
    .map((level) => ({ level, count: map.get(level) ?? 0 }))
    .filter((c) => c.count > 0);
}

const FindingSeverityBadges: React.FC<{
  counts: { level: FindingLevelEnum; count: number }[];
}> = ({ counts }) => {
  if (counts.length === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {counts.map(({ level, count }) => (
        <span
          key={level}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
            SEVERITY_DOT[level] ?? "bg-zinc-500",
          )}
          title={`${count} ${level}`}
        >
          {count}
        </span>
      ))}
    </div>
  );
};

const FolderRow: React.FC<{
  node: FolderNode;
  depth: number;
  openPaths: Set<string>;
  pathPrefix: string;
  togglePath: (path: string) => void;
  currentFileId: string | null;
  onFileClick: (fileId: string) => void;
}> = ({ node, depth, openPaths, pathPrefix, togglePath, currentFileId, onFileClick }) => {
  const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
  const isOpen = openPaths.has(fullPath);
  const indent = depth * 16;
  const folderAggregatedCounts = aggregateFindingCountsByLevel(node.children);

  return (
    <div>
      <div
        className="group flex h-7 min-w-0 cursor-pointer items-center gap-1 hover:bg-white/5 select-none transition-colors"
        style={{ paddingLeft: `${6 + indent}px` }}
        onClick={() => togglePath(fullPath)}
      >
        <span className="text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors">
          {isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </span>
        {isOpen ? (
          <FolderOpen className="size-3.5 shrink-0 text-[#e8b84b]" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-[#c9a227]" />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 ml-0.5">
          <span className="min-w-0 truncate text-[12.5px] leading-none text-zinc-300">
            {node.name}
          </span>
          {!isOpen ? <FindingSeverityBadges counts={folderAggregatedCounts} /> : null}
        </div>
      </div>

      {isOpen && (
        <div>
          {node.children.map((child) =>
            child.kind === "folder" ? (
              <FolderRow
                key={child.name}
                node={child}
                depth={depth + 1}
                openPaths={openPaths}
                pathPrefix={fullPath}
                togglePath={togglePath}
                currentFileId={currentFileId}
                onFileClick={onFileClick}
              />
            ) : (
              <FileRow
                key={child.fileId}
                leaf={child}
                depth={depth + 1}
                currentFileId={currentFileId}
                onFileClick={onFileClick}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

const FileRow: React.FC<{
  leaf: FileLeaf;
  depth: number;
  currentFileId: string | null;
  onFileClick: (fileId: string) => void;
}> = ({ leaf, depth, currentFileId, onFileClick }) => {
  const isCurrentFile = currentFileId === leaf.fileId;
  const indent = depth * 16;

  const counts = Object.values(FindingLevelEnum)
    .map((level) => ({
      level,
      count: leaf.findings.filter((fw) => fw.finding.level === level).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 h-7 cursor-pointer select-none transition-colors",
          isCurrentFile
            ? "bg-white/5 border-l-2 border-blue-500"
            : "hover:bg-white/3 border-l-2 border-transparent",
        )}
        style={{ paddingLeft: `${6 + indent}px` }}
        onClick={() => onFileClick(leaf.fileId)}
      >
        <span className="shrink-0 w-3" aria-hidden />
        <FileCode
          className={cn("size-3.5 shrink-0", isCurrentFile ? "text-blue-400" : "text-zinc-500")}
        />
        <div className="flex min-w-0 flex-1 items-center gap-1.5 ml-0.5">
          <span
            className={cn(
              "text-[12.5px] min-w-0 shrink truncate leading-none",
              isCurrentFile ? "text-zinc-100 font-medium" : "text-zinc-400",
            )}
          >
            {leaf.name}
          </span>
          <FindingSeverityBadges counts={counts} />
        </div>
      </div>
    </div>
  );
};

const FileTreeFindings: React.FC<FileTreeFindingsProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  codeId,
  isOwner,
  allFindingsWithNodes,
  codeVersionNodes,
  findingsGraphLoading,
  selectedFindingId,
  expandedFindingIds,
  onFindingClick,
  onShowFindingInCode,
  onToggleFinding,
  onAddFindingToContext,
  skipTreeExpandForFindingRef,
}) => {
  const { treeQuery, fileId, handleFileChange, nodesQuery } = useCode();
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set());
  const hasAutoExpandedRef = useRef(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const functionNodes = useMemo((): GraphSnapshotNode[] => {
    const nodes = nodesQuery.data ?? [];
    return nodes
      .filter((n) => FINDING_FORM_CALLABLE_NODE_TYPES.has(n.node_type))
      .slice()
      .sort((a, b) => a.src_start_pos - b.src_start_pos);
  }, [nodesQuery.data]);

  const findingsByFileId = useMemo(() => {
    const map = new Map<string, FindingWithNode[]>();
    for (const fwn of allFindingsWithNodes) {
      const arr = map.get(fwn.node.file_id) ?? [];
      arr.push(fwn);
      map.set(fwn.node.file_id, arr);
    }
    return map;
  }, [allFindingsWithNodes]);

  const tree = useMemo(() => {
    const treeFiles = treeQuery.data ?? [];
    const flatFiles = treeFiles.map((f) => ({
      path: f.path,
      fileId: f.id,
      findings: findingsByFileId.get(f.id) ?? [],
    }));
    return sortTree(buildTree(flatFiles));
  }, [treeQuery.data, findingsByFileId]);

  useEffect(() => {
    if (hasAutoExpandedRef.current || tree.length === 0) return;
    hasAutoExpandedRef.current = true;
    const paths = getFolderPathsWithFindings(tree);
    if (paths.length > 0) setOpenPaths(new Set(paths));
  }, [tree]);

  const togglePath = (path: string): void => {
    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  React.useEffect(() => {
    if (!selectedFindingId) return;
    if (skipTreeExpandForFindingRef.current === selectedFindingId) {
      skipTreeExpandForFindingRef.current = null;
      return;
    }
    const fwn = allFindingsWithNodes.find((x) => x.finding.id === selectedFindingId);
    if (!fwn) return;
    const { node } = fwn;
    const treeFile = treeQuery.data?.find((f) => f.id === node.file_id);
    if (!treeFile) return;
    const parts = treeFile.path.split("/").filter(Boolean);
    const pathsToOpen: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      pathsToOpen.push(parts.slice(0, i + 1).join("/"));
    }
    setOpenPaths((prev) => {
      if (pathsToOpen.every((p) => prev.has(p))) return prev;
      const next = new Set(prev);
      pathsToOpen.forEach((p) => next.add(p));
      return next;
    });
  }, [selectedFindingId, allFindingsWithNodes, treeQuery.data, skipTreeExpandForFindingRef]);

  const sortedAllFindings = useMemo(() => {
    const orderIdx = (level: FindingLevelEnum): number => {
      const i = Object.values(FindingLevelEnum).indexOf(level);
      return i === -1 ? 999 : i;
    };
    const copy = [...allFindingsWithNodes];
    copy.sort((a, b) => {
      const d = orderIdx(a.finding.level) - orderIdx(b.finding.level);
      if (d !== 0) return d;
      return a.finding.name.localeCompare(b.finding.name);
    });
    return copy;
  }, [allFindingsWithNodes]);

  useLayoutEffect(() => {
    if (!selectedFindingId) return;
    const root = sidebarScrollRef.current;
    if (!root) return;
    const el = Array.from(root.querySelectorAll("[data-finding-id]")).find(
      (node) => node.getAttribute("data-finding-id") === selectedFindingId,
    ) as HTMLElement | undefined;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedFindingId, expandedFindingIds, sortedAllFindings.length]);

  if (treeQuery.isLoading) {
    return (
      <div className={cn("flex h-full min-w-0 shrink-0 flex-col", SIDEBAR_WIDTH_CLASS)}>
        <div className="h-subheader flex items-center gap-2 border-b border-border shrink-0">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Files</p>
          <NodeSearch
            teamSlug={teamSlug}
            codeId={codeId}
            className="flex-1 h-8 text-xs"
            findings={allFindingsWithNodes}
            onFindingSelect={onFindingClick}
          />
        </div>
        <div className="p-3 space-y-1.5 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 shrink-0 flex-col bg-background",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="h-subheader flex items-center gap-2 shrink-0">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest shrink-0">
          Files
        </p>
        <NodeSearch
          teamSlug={teamSlug}
          codeId={codeId}
          className="flex-1 h-8 text-xs"
          findings={allFindingsWithNodes}
          onFindingSelect={onFindingClick}
        />
      </div>

      <div
        ref={sidebarScrollRef}
        className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div className="min-w-0 max-w-full">
          <div className="py-1">
            {tree.map((entry) =>
              entry.kind === "folder" ? (
                <FolderRow
                  key={entry.name}
                  node={entry}
                  depth={0}
                  openPaths={openPaths}
                  pathPrefix=""
                  togglePath={togglePath}
                  currentFileId={fileId}
                  onFileClick={handleFileChange}
                />
              ) : (
                <FileRow
                  key={entry.fileId}
                  leaf={entry}
                  depth={0}
                  currentFileId={fileId}
                  onFileClick={handleFileChange}
                />
              ),
            )}
          </div>

          <div className="border-t border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Findings
              </p>
              {isOwner ? (
                <FindingFormDialog
                  mode="create"
                  teamSlug={teamSlug}
                  nodeId={nodeId}
                  codeVersionId={codeId}
                  functionNodes={functionNodes}
                  codeVersionNodes={codeVersionNodes}
                  functionNodesLoading={nodesQuery.isLoading}
                  fileId={fileId}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 border-zinc-700 bg-zinc-800/50 px-2 text-[11px]"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  }
                />
              ) : null}
            </div>
            <div className="min-w-0 max-w-full space-y-3 p-2 pb-4">
              {findingsGraphLoading ? (
                <p className="py-2 text-[12px] text-zinc-500">Loading finding locations…</p>
              ) : sortedAllFindings.length === 0 ? (
                <p className="py-2 text-[12px] text-zinc-500">No findings with graph locations.</p>
              ) : (
                sortedAllFindings.map(({ finding, node }) => {
                  const filePath = treeQuery.data?.find((f) => f.id === node.file_id)?.path;
                  return (
                    <div
                      key={finding.id}
                      data-finding-id={finding.id}
                      className="min-w-0 max-w-full scroll-mt-1"
                    >
                      <InlineFindingCard
                        finding={finding}
                        teamSlug={teamSlug}
                        projectSlug={projectSlug}
                        nodeId={nodeId}
                        codeVersionId={codeId}
                        filePath={filePath}
                        isOwner={isOwner}
                        isExpanded={expandedFindingIds.has(finding.id)}
                        onToggle={() => onToggleFinding(finding.id)}
                        onShowInCode={() => onShowFindingInCode(finding)}
                        onAddFindingToContext={onAddFindingToContext}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTreeFindings;
