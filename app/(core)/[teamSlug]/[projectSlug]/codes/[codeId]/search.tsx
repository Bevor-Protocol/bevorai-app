"use client";

import { codeActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandInput } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { cn } from "@/lib/utils";
import { useCode } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import React, { useCallback, useState } from "react";

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
      return (
        <Badge variant="purple" className="text-xs">
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

const NodeSearch: React.FC<{
  teamSlug: string;
  codeId: string;
  className?: string;
}> = ({ teamSlug, codeId, className }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { debouncedState, isWaiting } = useDebouncedState(search, {
    duration: 500,
  });

  const { handleSourceChange } = useCode();

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
    queryFn: () => codeActions.searchNodes(teamSlug, codeId, { name: debouncedState }),
    enabled: !!debouncedState,
  });

  const isPending = isWaiting || isLoading || isFetching;

  const handleSelection = useCallback(
    ({ sourceId, start, end }: { sourceId: string; start: number; end: number }): void => {
      setOpen(false);
      handleSourceChange(sourceId, { start, end });
    },
    [handleSourceChange],
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

        <ScrollArea className="max-h-[300px]">
          {isPending && !!search && <CommandEmpty>Searching...</CommandEmpty>}
          {!search && <CommandEmpty>Search for nodes...</CommandEmpty>}
          {!!search && !results?.length && !isPending && (
            <CommandEmpty>No nodes found</CommandEmpty>
          )}
          {!!search &&
            !isPending &&
            results?.map((result) => (
              <div
                key={result.id}
                className="group flex hover:bg-accent hover:text-accent-foreground cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                onClick={() =>
                  handleSelection({
                    sourceId: result.code_version_source_id,
                    start: result.src_start_pos,
                    end: result.src_end_pos,
                  })
                }
              >
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {getNodeType(result.node_type)}
                    <p>{result.name}</p>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {result.path.split("/").slice(-1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{result.signature}</p>
                </div>
              </div>
            ))}
        </ScrollArea>
      </CommandDialog>
    </>
  );
};

export default NodeSearch;
