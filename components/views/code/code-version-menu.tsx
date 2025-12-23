"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { AnalysisVersionPreviewElement } from "@/components/analysis/element";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeVersionElementCompact } from "@/components/versions/element";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { extractAnalysisNodesQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, GitBranch, MoreHorizontal, Shield, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const CodeVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  userId: string;
  version: CodeMappingSchemaI;
}> = ({ teamSlug, projectSlug, userId, version }) => {
  const queryClient = useQueryClient();

  const { data: relations } = useQuery({
    queryKey: generateQueryKey.codeRelations(version.id),
    queryFn: () => codeActions.getRelations(teamSlug, version.id),
  });

  const { data: similarVersions } = useQuery({
    queryKey: generateQueryKey.codeSimilarity(version.id),
    queryFn: () => codeActions.getCodeVersionSimilar(teamSlug, version.id),
    enabled: !relations?.parent,
  });

  const updateParentMutation = useMutation({
    mutationFn: async (parentId: string) =>
      codeActions.updateCodeVersionParent(teamSlug, version.id, parentId),
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
  const analysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.id,
  });

  const parentAnalysisQuery = extractAnalysisNodesQuery({
    project_slug: projectSlug,
    code_version_id: version.parent_id,
  });

  const [open, setOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [addParentDialogOpen, setAddParentDialogOpen] = useState(false);

  const { data: analyses } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, analysisQuery),
    queryFn: () => analysisActions.getAnalyses(teamSlug, analysisQuery),
  });

  const { data: parentAnalyses = { results: [] } } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, parentAnalysisQuery),
    queryFn: () => analysisActions.getAnalyses(teamSlug, parentAnalysisQuery),
    enabled: !!version.parent_id,
  });

  const userAnalyses = useMemo(() => {
    if (!analyses?.results) return [];
    return analyses.results
      .filter((analysis) => analysis.user.id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [analyses, userId]);

  const userParentAnalyses = useMemo(() => {
    if (!parentAnalyses?.results) return [];
    return parentAnalyses.results
      .filter((analysis) => analysis.user.id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [parentAnalyses, userId]);

  const candidateParents = useMemo(() => {
    if (userAnalyses.length > 0) {
      return userAnalyses;
    }
    if (userParentAnalyses.length > 0 && version.parent_id) {
      return userParentAnalyses;
    }
    return [];
  }, [userAnalyses, userParentAnalyses, version.parent_id]);

  const isFromCurrentCodeVersion = userAnalyses.length > 0;

  const handleAnalyzeClick = (): void => {
    if (candidateParents.length > 0) {
      setSelectedParentId(candidateParents[0]?.id || "");
      setOpen(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {candidateParents.length > 0 ? (
            <DropdownMenuItem onSelect={handleAnalyzeClick} disabled={version.status !== "success"}>
              <Shield className="size-4" />
              Analyze
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link
                href={{
                  pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                  query: { codeVersionId: version.id },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Shield className="size-4" />
                Analyze
              </Link>
            </DropdownMenuItem>
          )}
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
                      <CodeVersionElementCompact version={child} />
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Analysis</DialogTitle>
            <DialogDescription>
              {isFromCurrentCodeVersion
                ? candidateParents.length === 1
                  ? "You already have an analysis for this code version. You can start a new analysis from scratch."
                  : "You already have analyses for this code version. Create a new analysis based on one of them, or start from scratch."
                : candidateParents.length === 1
                  ? "Create a new analysis with the previous code version's analysis as parent, or start from scratch"
                  : "Select a parent analysis from the previous code version, or start from scratch"}
            </DialogDescription>
          </DialogHeader>
          {candidateParents.length === 1 ? (
            <div className="py-4">
              <AnalysisVersionPreviewElement analysisVersion={candidateParents[0]} />
            </div>
          ) : (
            <div className="py-4">
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a parent analysis">
                    <div className="flex gap-2 items-center">
                      <Shield className="size-3.5 text-purple-400 shrink-0" />
                      {truncateId(selectedParentId)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {candidateParents.map((analysis) => (
                    <SelectItem value={analysis.id} key={analysis.id}>
                      <AnalysisVersionPreviewElement analysisVersion={analysis} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {candidateParents.length === 1 ? (
              isFromCurrentCodeVersion ? (
                <Button asChild>
                  <Link
                    href={{
                      pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                      query: { codeVersionId: version.id },
                    }}
                    onClick={() => setOpen(false)}
                  >
                    Start from scratch
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link
                      href={{
                        pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                        query: { codeVersionId: version.id },
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Start from scratch
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link
                      href={{
                        pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                        query: {
                          codeVersionId: version.id,
                          parentVersionId: candidateParents[0]?.id,
                        },
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Create with parent
                    </Link>
                  </Button>
                </>
              )
            ) : (
              <Button asChild>
                <Link
                  href={{
                    pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                    query: selectedParentId
                      ? { codeVersionId: version.id, parentVersionId: selectedParentId }
                      : { codeVersionId: version.id },
                  }}
                  onClick={() => setOpen(false)}
                >
                  {selectedParentId ? "Create with parent" : "Start from scratch"}
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                    <CodeVersionElementCompact version={similarVersion} />
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
