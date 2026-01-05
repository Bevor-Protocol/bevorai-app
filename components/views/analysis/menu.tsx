"use client";

import { analysisActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GitFork, GitMerge, Lock, MoreHorizontal, Shield, Unlock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const AnalysisVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  isOwner?: boolean;
  isPublic?: boolean;
}> = ({ teamSlug, projectSlug, nodeId, isOwner = false, isPublic = false }) => {
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [fromAnalysisNodeId, setFromAnalysisNodeId] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const visibilityMutation = useMutation({
    mutationFn: async () =>
      analysisActions.toggleVisibility(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success(isPublic ? "Analysis set to private" : "Analysis set to public");
    },
    onError: () => {
      toast.error("Failed to update visibility");
    },
  });

  const forkMutation = useMutation({
    mutationFn: async () =>
      analysisActions.forkAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowForkDialog(false);
      toast.success("Analysis forked successfully");
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/${id}`);
    },
    onError: () => {
      toast.error("Failed to fork analysis", {
        description: "Please try again.",
      });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async () =>
      analysisActions.mergeAnalysis(teamSlug, nodeId, fromAnalysisNodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowMergeDialog(false);
      setFromAnalysisNodeId("");
      toast.success("Analysis merged successfully");
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/${id}`);
    },
    onError: () => {
      toast.error("Failed to merge analysis", {
        description: "Please try again.",
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner && (
            <DropdownMenuItem
              onClick={() => visibilityMutation.mutate()}
              disabled={visibilityMutation.isPending}
            >
              {isPublic ? (
                <>
                  <Lock className="size-4" />
                  Make Private
                </>
              ) : (
                <>
                  <Unlock className="size-4" />
                  Make Public
                </>
              )}
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem asChild>
              <Link
                href={{
                  pathname: `/team/${teamSlug}/${projectSlug}/analyses/new`,
                  query: { parentVersionId: nodeId },
                }}
              >
                <Shield className="size-4" />
                Create New Analysis
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setShowForkDialog(true)}>
            <GitFork className="size-4" />
            Fork
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem onSelect={() => setShowMergeDialog(true)}>
              <GitMerge className="size-4" />
              Merge
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fork Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new analysis in the current project, and use this version as the
              root.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forkMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => forkMutation.mutate()}
              disabled={forkMutation.isPending}
            >
              {forkMutation.isPending ? "Forking..." : "Fork"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Merge another analysis into this one. Enter the analysis node ID to merge from.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel>From Analysis Node ID</FieldLabel>
            <FieldContent>
              <Input
                value={fromAnalysisNodeId}
                onChange={(e) => setFromAnalysisNodeId(e.target.value)}
                placeholder="Enter analysis node ID"
                disabled={mergeMutation.isPending}
              />
            </FieldContent>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mergeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mergeMutation.mutate()}
              disabled={mergeMutation.isPending || !fromAnalysisNodeId.trim()}
            >
              {mergeMutation.isPending ? "Merging..." : "Merge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AnalysisVersionMenu;
