"use client";

import { analysisActions } from "@/actions/bevor";
import DagToggle from "@/app/(core)/[teamSlug]/[projectSlug]/analysis-threads/[threadId]/dag-toggle";
import { AnalysisVersionElement } from "@/components/analysis/element";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisThreadSchemaI } from "@/utils/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Code2, Copy, Lock, MoreHorizontal, Plus, Unlock } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

export const AnalysisOptions: React.FC<{ teamSlug: string; threadId: string }> = ({
  teamSlug,
  threadId,
}) => {
  const [open, setOpen] = useState(false);

  const { data: analysis } = useQuery({
    queryKey: generateQueryKey.analysis(threadId),
    queryFn: async () => analysisActions.getAnalysis(teamSlug, threadId),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!analysis}>
          <Button variant="ghost" size="sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="whitespace-nowrap">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setOpen(true)} disabled={!analysis?.is_owner}>
              Toggle visibility
              <DropdownMenuShortcut>
                {analysis?.is_public ? <Lock /> : <Unlock />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${teamSlug}/analysis-threads/${analysis!.id}/nodes/new`}>
                Create new analysis version
                <DropdownMenuShortcut>
                  <Plus />
                </DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${teamSlug}/${analysis?.project_id}/codes/new`}>
                Upload new code
                <DropdownMenuShortcut>
                  <Code2 />
                </DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {!!analysis && open && (
        <VisibilityDialog open onOpenChange={setOpen} analysis={analysis} teamSlug={teamSlug} />
      )}
    </>
  );
};

const VisibilityDialog: React.FC<
  { analysis: AnalysisThreadSchemaI; teamSlug: string } & React.ComponentProps<
    typeof DialogPrimitive.Root
  >
> = ({ teamSlug, analysis, ...props }) => {
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState<boolean>(analysis.is_public);

  const visibilityMutation = useMutation({
    mutationFn: async () => analysisActions.toggleVisibility(teamSlug, analysis.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Visibility updated", {
        description: "You updated the visibility of this analysis",
      });
    },
  });

  const handleUpdate = (): void => {
    if (isPublic === analysis.is_public || !analysis.is_owner) return;
    visibilityMutation.mutate();
    if (props.onOpenChange) {
      props.onOpenChange(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Visibility</DialogTitle>
          <DialogDescription>Update the visibility of this analysis</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FieldGroup>
            <FieldSet>
              <FieldLabel htmlFor="compute-environment-p8w" className="sr-only">
                Analyis visibility
              </FieldLabel>
              <FieldDescription className="sr-only">
                Update the visibility of this analysis
              </FieldDescription>
              <RadioGroup
                defaultValue={String(analysis.is_public)}
                onValueChange={(value) => setIsPublic(value === "true")}
              >
                <FieldLabel key="true" htmlFor="true">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Public</FieldTitle>
                      <FieldDescription>
                        Public analyses can be shared with people outside of your team as a
                        read-only view
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="true" id="true" />
                  </Field>
                </FieldLabel>
                <FieldLabel key="false" htmlFor="false">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Private</FieldTitle>
                      <FieldDescription>
                        Private analyses are only viewable to people within your team. Only you can
                        alter them.
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="false" id="false" />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </FieldSet>
          </FieldGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleUpdate}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AnalysisUnlock: React.FC<{ teamSlug: string; threadId: string }> = ({
  teamSlug,
  threadId,
}) => {
  const { isCopied, copy } = useCopyToClipboard();

  const { data: analysis, isLoading } = useQuery({
    queryKey: generateQueryKey.analysis(threadId),
    queryFn: async () => analysisActions.getAnalysis(teamSlug, threadId),
  });

  const handleCopy = (): void => {
    if (!analysis) return;
    const shareableLink = `${window.location.origin}/shared/analysis/${analysis.id}`;
    copy(shareableLink);
  };

  if (isLoading || !analysis) {
    return <Skeleton className="h-7 w-10" />;
  }

  return (
    <>
      <Badge variant="outline">
        {analysis.is_public ? <Unlock /> : <Lock />}
        {analysis.is_public ? "Public" : "Private"}
      </Badge>
      {analysis.is_public && (
        <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
          {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </Button>
      )}
    </>
  );
};

export const RecentAnalysisVersion: React.FC<{
  teamSlug: string;
  threadId: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug, threadId }) => {
  const { data, isLoading } = useQuery({
    queryKey: generateQueryKey.analysisLeafs(threadId),
    queryFn: () => analysisActions.getLeafs(teamSlug, threadId),
  });

  const { data: dag } = useQuery({
    queryKey: generateQueryKey.analysisDag(threadId),
    queryFn: () => analysisActions.getDAG(teamSlug, threadId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Versions</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Versions</h3>
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No recent versions
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Versions</h3>
        {data.length > 0 && !!dag && <DagToggle dag={dag} />}
      </div>
      <div className="space-y-2">
        {data.map((version) => (
          <AnalysisVersionElement
            key={version.id}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            analysisVersion={version}
          />
        ))}
      </div>
    </div>
  );
};
