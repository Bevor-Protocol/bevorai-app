"use client";

import { analysisActions } from "@/actions/bevor";
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
import { navigation } from "@/utils/navigation";
import { AnalysisSchemaI } from "@/utils/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Code2, Copy, Lock, MoreHorizontal, Plus, Unlock } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

export const AnalysisOptions: React.FC<{ teamSlug: string; analysisId: string }> = ({
  teamSlug,
  analysisId,
}) => {
  const [open, setOpen] = useState(false);

  const { data: analysis } = useQuery({
    queryKey: generateQueryKey.analysis(analysisId),
    queryFn: async () => analysisActions.getAnalysis(teamSlug, analysisId),
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
              <Link href={`/teams/${teamSlug}/analyses/${analysis!.id}/versions/new`}>
                Create new analysis version
                <DropdownMenuShortcut>
                  <Plus />
                </DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/teams/${teamSlug}/projects/${analysis?.project_id}/codes/new`}>
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
  { analysis: AnalysisSchemaI; teamSlug: string } & React.ComponentProps<
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

export const AnalysisUnlock: React.FC<{ teamSlug: string; analysisId: string }> = ({
  teamSlug,
  analysisId,
}) => {
  const { isCopied, copy } = useCopyToClipboard();

  const { data: analysis, isLoading } = useQuery({
    queryKey: generateQueryKey.analysis(analysisId),
    queryFn: async () => analysisActions.getAnalysis(teamSlug, analysisId),
  });

  const handleCopy = (): void => {
    if (!analysis) return;
    const shareableLink = `${window.location.origin}${navigation.shared.overview({
      analysisId: analysis.id,
    })}`;
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

export const RecentAnalysisVersion: React.FC<{ teamSlug: string; analysisId: string }> = ({
  teamSlug,
  analysisId,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: generateQueryKey.analysisVersionRecent(analysisId),
    queryFn: () => analysisActions.getAnalysisRecentVersion(teamSlug, analysisId),
  });

  if (isLoading) {
    return (
      <div>
        <p>Loading Recent Version...</p>
      </div>
    );
  }

  if (data) {
    return (
      <div className="w-fit">
        <p className="my-4">Recent Analysis Version</p>
        <AnalysisVersionElement teamSlug={teamSlug} analysisVersion={data} />
      </div>
    );
  }

  return (
    <div>
      <p>No Recent Analysis Version</p>
    </div>
  );
};
