"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { AnalysisNodeSchema, FindingSchema } from "@/types/api/responses/security";
import { ChevronDown, ChevronRight, FileCode, Folder, FolderOpen, ShieldCheck } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { levelOrder } from "./scopes";

export interface FindingWithNode {
  finding: FindingSchema;
  node: GraphSnapshotNode;
}

interface FileTreeFindingsProps {
  version: AnalysisNodeSchema;
  nodeMap: Map<string, GraphSnapshotNode>;
  selectedFindingId: string | null;
  onFindingClick: (finding: FindingSchema) => void;
  validatedFindingNames?: Set<string>;
  nodesLoading: boolean;
}

// ── Tree data structures ─────────────────────────────────────────────────────

interface FileLeaf {
  kind: "file";
  name: string;
  fileId: string;
  fullPath: string;
  findings: { finding: FindingSchema; node: GraphSnapshotNode }[];
}

interface FolderNode {
  kind: "folder";
  name: string;
  children: TreeEntry[];
}

type TreeEntry = FolderNode | FileLeaf;

/** Build a nested folder tree from a flat list of { path, fileId, findings }. */
function buildTree(
  files: { path: string; fileId: string; findings: { finding: FindingSchema; node: GraphSnapshotNode }[] }[],
): TreeEntry[] {
  const root: FolderNode = { kind: "folder", name: "", children: [] };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    // Walk/create folder nodes for all segments except the last
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

    // Add the file leaf
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

/** Return all folder paths (depth-first) that contain at least one file with findings. */
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

/** Sort tree: folders first, then files; alphabetically within each group. */
function sortTree(entries: TreeEntry[]): TreeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  }).map((entry) =>
    entry.kind === "folder"
      ? { ...entry, children: sortTree(entry.children) }
      : entry,
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

const FolderRow: React.FC<{
  node: FolderNode;
  depth: number;
  openPaths: Set<string>;
  pathPrefix: string;
  togglePath: (path: string) => void;
  selectedFindingId: string | null;
  onFindingClick: (finding: FindingSchema) => void;
  currentFileId: string | null;
  onFileClick: (fileId: string) => void;
  validatedFindingNames?: Set<string>;
}> = ({
  node,
  depth,
  openPaths,
  pathPrefix,
  togglePath,
  selectedFindingId,
  onFindingClick,
  currentFileId,
  onFileClick,
  validatedFindingNames,
}) => {
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
          {isOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </span>
        {isOpen ? (
          <FolderOpen className="size-3.5 shrink-0 text-[#e8b84b]" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-[#c9a227]" />
        )}
        <span className="text-[12.5px] text-zinc-300 truncate leading-none ml-0.5">{node.name}</span>
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
                selectedFindingId={selectedFindingId}
                onFindingClick={onFindingClick}
                currentFileId={currentFileId}
                onFileClick={onFileClick}
                validatedFindingNames={validatedFindingNames}
              />
            ) : (
              <FileRow
                key={child.fileId}
                leaf={child}
                depth={depth + 1}
                selectedFindingId={selectedFindingId}
                onFindingClick={onFindingClick}
                currentFileId={currentFileId}
                onFileClick={onFileClick}
                validatedFindingNames={validatedFindingNames}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

// Dot colors matching severity
const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const FileRow: React.FC<{
  leaf: FileLeaf;
  depth: number;
  selectedFindingId: string | null;
  onFindingClick: (finding: FindingSchema) => void;
  currentFileId: string | null;
  onFileClick: (fileId: string) => void;
  validatedFindingNames?: Set<string>;
}> = ({
  leaf,
  depth,
  selectedFindingId,
  onFindingClick,
  currentFileId,
  onFileClick,
  validatedFindingNames,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCurrentFile = currentFileId === leaf.fileId;
  const hasFindings = leaf.findings.length > 0;
  const indent = depth * 16;

  // Severity count summary (shown on the file row)
  const counts = levelOrder
    .map((level) => ({
      level,
      count: leaf.findings.filter((fw) => fw.finding.level === level).length,
    }))
    .filter((c) => c.count > 0);

  // Auto-expand if this file contains the selected finding
  React.useEffect(() => {
    if (selectedFindingId && leaf.findings.some((fw) => fw.finding.id === selectedFindingId)) {
      setIsOpen(true);
    }
  }, [selectedFindingId, leaf.findings]);

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
        onClick={() => {
          onFileClick(leaf.fileId);
          if (hasFindings) setIsOpen((v) => !v);
        }}
      >
        <span className="text-zinc-600 group-hover:text-zinc-400 shrink-0 w-3 transition-colors">
          {hasFindings ? (
            isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />
          ) : null}
        </span>
        <FileCode className={cn("size-3.5 shrink-0", isCurrentFile ? "text-blue-400" : "text-zinc-500")} />
        <span
          className={cn(
            "text-[12.5px] truncate flex-1 min-w-0 leading-none ml-0.5",
            isCurrentFile ? "text-zinc-100 font-medium" : "text-zinc-400",
          )}
        >
          {leaf.name}
        </span>
        {counts.length > 0 && (
          <div className="flex items-center gap-0.5 shrink-0 pr-2">
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

      {isOpen && hasFindings && (
        <div>
          {levelOrder.map((level) => {
            const levelFindings = leaf.findings.filter((fw) => fw.finding.level === level);
            if (levelFindings.length === 0) return null;
            return levelFindings.map(({ finding }) => {
              const isSelected = selectedFindingId === finding.id;
              const isValidated = validatedFindingNames?.has(`${finding.name}::${finding.level}`);
              const dotColor = SEVERITY_DOT[level] ?? "bg-zinc-500";
              return (
                <div
                  key={finding.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFindingClick(finding);
                  }}
                  style={{ paddingLeft: `${6 + indent + 24}px` }}
                  className={cn(
                    "flex items-center gap-2 h-6 pr-2 cursor-pointer transition-colors border-l-2",
                    isSelected
                      ? "bg-[#1c2128] border-blue-500"
                      : "border-transparent hover:bg-white/5",
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                  <span
                    className={cn(
                      "text-[12px] truncate min-w-0 flex-1 leading-none",
                      isSelected ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    {finding.name}
                  </span>
                  {isValidated && <ShieldCheck className="size-3 shrink-0 text-green-500" />}
                </div>
              );
            });
          })}
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const FileTreeFindings: React.FC<FileTreeFindingsProps> = ({
  version,
  nodeMap,
  selectedFindingId,
  onFindingClick,
  validatedFindingNames,
  nodesLoading,
}) => {
  const { treeQuery, fileId, handleFileChange } = useCode();
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set());
  const hasAutoExpandedRef = useRef(false);

  // Build map: file_id -> findings
  const findingsByFileId = useMemo(() => {
    const map = new Map<string, { finding: FindingSchema; node: GraphSnapshotNode }[]>();
    for (const finding of version.findings) {
      const node = nodeMap.get(finding.source_node_id);
      if (!node) continue;
      const arr = map.get(node.file_id) ?? [];
      arr.push({ finding, node });
      map.set(node.file_id, arr);
    }
    return map;
  }, [version.findings, nodeMap]);

  // Build the folder tree from treeQuery files
  const tree = useMemo(() => {
    const treeFiles = treeQuery.data ?? [];
    const flatFiles = treeFiles.map((f) => ({
      path: f.path,
      fileId: f.id,
      findings: findingsByFileId.get(f.id) ?? [],
    }));
    return sortTree(buildTree(flatFiles));
  }, [treeQuery.data, findingsByFileId]);

  // Auto-expand all folders that contain findings on first tree load
  useEffect(() => {
    if (hasAutoExpandedRef.current || tree.length === 0) return;
    hasAutoExpandedRef.current = true;
    const paths = getFolderPathsWithFindings(tree);
    if (paths.length > 0) setOpenPaths(new Set(paths));
  }, [tree]);

  const togglePath = (path: string) => {
    setOpenPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Auto-open folders containing the selected finding's file
  React.useEffect(() => {
    if (!selectedFindingId) return;
    const finding = version.findings.find((f) => f.id === selectedFindingId);
    if (!finding) return;
    const node = nodeMap.get(finding.source_node_id);
    if (!node) return;
    // Find the file in treeQuery
    const treeFile = treeQuery.data?.find((f) => f.id === node.file_id);
    if (!treeFile) return;
    // Auto-open all ancestor folders
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
  }, [selectedFindingId, version.findings, nodeMap, treeQuery.data]);

  if (treeQuery.isLoading || nodesLoading) {
    return (
      <div className="shrink-0 h-full flex flex-col border-r border-border" style={{ width: 264 }}>
        <div className="px-3 h-subheader flex items-center border-b border-border shrink-0">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Files</p>
        </div>
        <div className="p-3 space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="shrink-0 h-full flex flex-col border-r border-border bg-background"
      style={{ width: 264 }}
    >
      {/* Header */}
      <div className="px-3 h-subheader flex items-center border-b border-border shrink-0">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Files</p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
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
                selectedFindingId={selectedFindingId}
                onFindingClick={onFindingClick}
                currentFileId={fileId}
                onFileClick={handleFileChange}
                validatedFindingNames={validatedFindingNames}
              />
            ) : (
              <FileRow
                key={entry.fileId}
                leaf={entry}
                depth={0}
                selectedFindingId={selectedFindingId}
                onFindingClick={onFindingClick}
                currentFileId={fileId}
                onFileClick={handleFileChange}
                validatedFindingNames={validatedFindingNames}
              />
            ),
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileTreeFindings;
