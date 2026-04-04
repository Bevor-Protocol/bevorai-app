"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { FindingSchema } from "@/types/api/responses/security";
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen, Plus } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import NodeSearch from "../code/search";
import { FindingWithNode } from "./code-with-annotations";
import { FindingFormDialog } from "./finding-form-dialog";
import InlineFindingCard from "./inline-finding-card";
import { levelOrder } from "./scopes";

const SIDEBAR_WIDTH_CLASS =
  "shrink-0 grow-0 w-[min(40rem,calc(100vw-1rem))] min-w-[18rem] sm:min-w-[22rem] md:min-w-[26rem]";

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
  onToggleFinding: (findingId: string) => void;
  onAddFindingToContext?: (finding: FindingSchema) => void;
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

  return (
    <div>
      <div
        className="group flex items-center gap-1 h-7 cursor-pointer hover:bg-white/5 select-none transition-colors"
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
        <span className="text-[12.5px] text-zinc-300 truncate leading-none ml-0.5">
          {node.name}
        </span>
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

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const FileRow: React.FC<{
  leaf: FileLeaf;
  depth: number;
  currentFileId: string | null;
  onFileClick: (fileId: string) => void;
}> = ({ leaf, depth, currentFileId, onFileClick }) => {
  const isCurrentFile = currentFileId === leaf.fileId;
  const hasFindings = leaf.findings.length > 0;
  const indent = depth * 16;

  const counts = levelOrder
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
            ? "bg-white/[0.05] border-l-2 border-blue-500"
            : "hover:bg-white/[0.03] border-l-2 border-transparent",
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
          {hasFindings && counts.length > 0 && (
            <div className="flex shrink-0 items-center gap-0.5">
              {counts.map(({ level, count }) => (
                <span
                  key={level}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold text-white",
                    SEVERITY_DOT[level] ?? "bg-zinc-500",
                  )}
                  title={`${count} ${level}`}
                >
                  {count}
                </span>
              ))}
            </div>
          )}
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
  onToggleFinding,
  onAddFindingToContext,
}) => {
  const { treeQuery, fileId, handleFileChange, nodesQuery } = useCode();
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set());
  const hasAutoExpandedRef = useRef(false);
  const findingsPanelRef = useRef<HTMLDivElement>(null);

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
  }, [selectedFindingId, allFindingsWithNodes, treeQuery.data]);

  const sortedAllFindings = useMemo(() => {
    const orderIdx = (level: string): number => {
      const i = levelOrder.indexOf(level as (typeof levelOrder)[number]);
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

  useEffect(() => {
    if (!selectedFindingId) return;
    const t = window.setTimeout(() => {
      const root = findingsPanelRef.current;
      if (!root) return;
      const el = root.querySelector(`[data-finding-id="${selectedFindingId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return (): void => clearTimeout(t);
  }, [selectedFindingId, sortedAllFindings]);

  if (treeQuery.isLoading) {
    return (
      <div
        className={cn("shrink-0 h-full flex flex-col border-r border-border", SIDEBAR_WIDTH_CLASS)}
      >
        <div className="px-2 h-subheader flex items-center gap-2 border-b border-border shrink-0">
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
    <div className={cn("shrink-0 h-full min-h-0 flex flex-col bg-background", SIDEBAR_WIDTH_CLASS)}>
      <div className="px-2 h-subheader flex items-center gap-2 shrink-0">
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

      <ScrollArea className="flex-1 min-h-0">
        <div className="min-w-0">
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

          <div ref={findingsPanelRef} className="border-t border-border">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-2.5 py-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
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
                      className="h-6 gap-1 text-[11px] px-2 border-zinc-700 bg-zinc-800/50"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  }
                />
              ) : null}
            </div>
            <div className="p-2 space-y-3 pb-4">
              {findingsGraphLoading ? (
                <p className="text-[12px] text-zinc-500 px-1 py-2">Loading finding locations…</p>
              ) : sortedAllFindings.length === 0 ? (
                <p className="text-[12px] text-zinc-500 px-1 py-2">
                  No findings with graph locations.
                </p>
              ) : (
                sortedAllFindings.map(({ finding, node }) => {
                  const filePath = treeQuery.data?.find((f) => f.id === node.file_id)?.path;
                  return (
                    <div
                      key={finding.id}
                      data-finding-id={finding.id}
                      className="scroll-mt-1 space-y-1"
                    >
                      {filePath && (
                        <p
                          className="text-[10px] text-zinc-500 font-mono truncate px-0.5"
                          title={filePath}
                        >
                          {filePath}
                        </p>
                      )}
                      <InlineFindingCard
                        finding={finding}
                        teamSlug={teamSlug}
                        projectSlug={projectSlug}
                        nodeId={nodeId}
                        codeVersionId={codeId}
                        isOwner={isOwner}
                        isExpanded={expandedFindingIds.has(finding.id)}
                        onToggle={() => onToggleFinding(finding.id)}
                        onAddFindingToContext={onAddFindingToContext}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileTreeFindings;
