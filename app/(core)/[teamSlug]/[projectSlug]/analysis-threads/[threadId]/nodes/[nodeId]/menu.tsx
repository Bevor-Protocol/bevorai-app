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
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code, GitBranch, MoreHorizontal, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const AnalysisVersionMenu: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: AnalysisNodeSchemaI;
}> = ({ teamSlug, projectSlug, version }) => {
  const [showForkDialog, setShowForkDialog] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const codePath = `/${teamSlug}/${projectSlug}/codes/${version.code_version_id}`;
  const analysisPath = `/${teamSlug}/${projectSlug}/analysis-threads/${version.analysis_thread_id}/nodes/new?parentVersionId=${version.id}`;

  const forkMutation = useMutation({
    mutationFn: async () => analysisActions.forkAnalysis(teamSlug, version.id),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowForkDialog(false);
      toast.success("Analysis forked successfully");
      router.push(`/${teamSlug}/${projectSlug}/analysis-threads/${id}`);
    },
    onError: () => {
      toast.error("Failed to fork analysis", {
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
          <DropdownMenuItem asChild>
            <Link href={codePath}>
              <Code className="size-4" />
              View Full Source
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={analysisPath}>
              <Shield className="size-4" />
              Create New Analysis
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShowForkDialog(true)}>
            <GitBranch className="size-4" />
            Fork
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fork Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new analysis thread in the current project, and use this version as
              the root.
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
    </>
  );
};

export default AnalysisVersionMenu;
