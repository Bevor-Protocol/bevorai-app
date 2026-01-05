"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeVersionCompactElement } from "@/components/versions/element";
import { generateQueryKey } from "@/utils/constants";
import { CodeMappingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, GitBranch, MoreHorizontal, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const CodeVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: CodeMappingSchemaI;
}> = ({ teamSlug, projectSlug, version }) => {
  const queryClient = useQueryClient();

  const { data: relations } = useQuery({
    queryKey: generateQueryKey.codeRelations(version.id),
    queryFn: () =>
      codeActions.getRelations(teamSlug, version.id).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: similarVersions } = useQuery({
    queryKey: generateQueryKey.codeSimilarity(version.id),
    queryFn: () =>
      codeActions.getCodeVersionSimilar(teamSlug, version.id).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !relations?.parent,
  });

  const updateParentMutation = useMutation({
    mutationFn: async (parentId: string) =>
      codeActions.updateCodeVersionParent(teamSlug, version.id, parentId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setAddParentDialogOpen(false);
      toast.success("Parent version updated");
    },
    onError: () => {
      toast.error("Failed to update parent version");
    },
  });
  const [addParentDialogOpen, setAddParentDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={{
                pathname: `/team/${teamSlug}/${projectSlug}/codes/new`,
                query: { parentId: version.id },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Upload className="size-4" />
              Upload newer version
            </Link>
          </DropdownMenuItem>
          {relations?.parent && (
            <DropdownMenuItem asChild>
              <Link
                href={`/team/${teamSlug}/${projectSlug}/codes/${relations.parent.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowUp className="size-4" />
                View parent
              </Link>
            </DropdownMenuItem>
          )}
          {!relations?.parent && (
            <DropdownMenuItem onSelect={() => setAddParentDialogOpen(true)}>
              <ArrowUp className="size-4" />
              Add parent
            </DropdownMenuItem>
          )}
          {relations?.children && relations.children.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <GitBranch className="size-4" />
                View children
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[500px]">
                {relations.children.map((child) => (
                  <DropdownMenuItem key={child.id} asChild>
                    <Link
                      href={`/team/${teamSlug}/${projectSlug}/codes/${child.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CodeVersionCompactElement version={child} />
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={addParentDialogOpen} onOpenChange={setAddParentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add parent</DialogTitle>
            <DialogDescription>
              {similarVersions && similarVersions.length > 0
                ? "This version doesn't have a parent. Select one of these similar versions to link as parent:"
                : "This version doesn't have a parent. There are no similar versions available to associate as the parent."}
            </DialogDescription>
          </DialogHeader>
          {similarVersions && similarVersions.length > 0 ? (
            <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
              {similarVersions.map(({ version: similarVersion, score }) => (
                <div
                  key={similarVersion.id}
                  className="flex items-center justify-between gap-2 p-2 rounded border"
                >
                  <Link
                    href={`/team/${teamSlug}/${projectSlug}/codes/${similarVersion.id}`}
                    className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CodeVersionCompactElement version={similarVersion} />
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {Math.round(score * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateParentMutation.mutate(similarVersion.id)}
                      disabled={updateParentMutation.isPending}
                      className="text-xs h-7"
                    >
                      Set parent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-sm text-muted-foreground text-center">
              No similar versions found
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddParentDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeVersionMenu;
