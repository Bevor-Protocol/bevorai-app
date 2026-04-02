"use client";

import { codeActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandInput } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { GraphSnapshotNode } from "@/types/api/responses/graph";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

const getNodeType = (nodeType: string): React.ReactElement => {
  switch (nodeType) {
    case "FunctionDefinition":
    case "ModifierDefinition":
      return (
        <Badge variant="blue" className="text-xs">
          {nodeType.replace("Definition", "").toLowerCase()}
        </Badge>
      );
    case "ContractDefinition":
    case "ProgramDefinition":
      return (
        <Badge variant="purple" className="text-xs">
          {nodeType.replace("Definition", "").toLowerCase()}
        </Badge>
      );
    case "AccountDefinition":
    case "ContextDefinition":
      return (
        <Badge variant="cyan" className="text-xs">
          {nodeType.replace("Definition", "").toLowerCase()}
        </Badge>
      );
    case "ConstraintDefinition":
      return (
        <Badge variant="amber" className="text-xs">
          {nodeType.replace("Definition", "").toLowerCase()}
        </Badge>
      );
    default:
      return (
        <Badge variant="green" className="text-xs">
          {nodeType.replace("Definition", "").replace("Declaration", "").toLowerCase()}
        </Badge>
      );
  }
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const NodeSearch: React.FC<{
  teamSlug: string;
  codeId: string;
  className?: string;
  findings?: { finding: FindingSchema; node: GraphSnapshotNode }[];
  onFindingSelect?: (finding: FindingSchema) => void;
}> = ({ teamSlug, codeId, className, findings, onFindingSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { debouncedState, isWaiting } = useDebouncedState(search, {
    duration: 500,
  });

  const { handleFileChange } = useCode();

  React.useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return (): void => document.removeEventListener("keydown", down);
  }, []);

  const {
    data: results,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: generateQueryKey.codeNodes(codeId, { name: debouncedState }),
    queryFn: () =>
      codeActions.getNodes(teamSlug, codeId, { name: debouncedState }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!debouncedState,
  });

  const isPending = isWaiting || isLoading || isFetching;

  const filteredFindings = useMemo(() => {
    if (!findings || !search) return [];
    const q = search.toLowerCase();
    return findings.filter(({ finding }) => finding.name.toLowerCase().includes(q));
  }, [findings, search]);

  const handleSelection = useCallback(
    ({ sourceId, start, end }: { sourceId: string; start: number; end: number }): void => {
      setOpen(false);
      handleFileChange(sourceId, { start, end });
    },
    [handleFileChange],
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("text-muted-foreground", className)}
      >
        <Search />
        Search
        <kbd className="ml-auto bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} className="top-1/4 translate-y-0">
        <CommandInput
          placeholder="Search Nodes..."
          value={search}
          onValueChange={(e) => setSearch(e)}
        />

        <ScrollArea className="max-h-[400px]">
          {!search && <CommandEmpty>Search for nodes or vulnerabilities…</CommandEmpty>}
          {!!search && isPending && !filteredFindings.length && (
            <CommandEmpty>Searching…</CommandEmpty>
          )}
          {!!search && !isPending && !results?.length && !filteredFindings.length && (
            <CommandEmpty>No results found</CommandEmpty>
          )}

          {filteredFindings.length > 0 && (
            <div className="px-2 py-1.5">
              <p className="px-1 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Vulnerabilities
              </p>
              {filteredFindings.map(({ finding, node }) => (
                <div
                  key={finding.id}
                  className="group flex hover:bg-accent hover:text-accent-foreground cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none w-full min-w-0 overflow-hidden"
                  onClick={() => {
                    handleSelection({
                      sourceId: node.file_id,
                      start: node.src_start_pos,
                      end: node.src_end_pos,
                    });
                    onFindingSelect?.(finding);
                  }}
                >
                  <Shield className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 min-w-0 truncate">{finding.name}</span>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      SEVERITY_COLOR[finding.level] ?? "bg-zinc-500",
                    )}
                  />
                  <span className="text-muted-foreground text-xs shrink-0 truncate max-w-[8rem]">
                    {node.path.split("/").slice(-1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!!search && !isPending && !!results?.length && (
            <div className="px-2 py-1.5">
              <p className="px-1 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Nodes
              </p>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="group flex hover:bg-accent hover:text-accent-foreground cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none w-full min-w-0 overflow-hidden"
                  onClick={() =>
                    handleSelection({
                      sourceId: result.file_id,
                      start: result.src_start_pos,
                      end: result.src_end_pos,
                    })
                  }
                >
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {getNodeType(result.node_type)}
                      <p className="truncate flex-1 min-w-0">{result.name}</p>
                      <span className="text-muted-foreground text-xs shrink-0 truncate max-w-[8rem]">
                        {result.path.split("/").slice(-1)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{result.signature}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CommandDialog>
    </>
  );
};

export default NodeSearch;
