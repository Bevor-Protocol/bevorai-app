"use client";

import { analysisActions, versionActions } from "@/actions/bevor";
import { AnalysisElementLoader, AnalysisVersionElement } from "@/components/audits/element";
import LucideIcon from "@/components/lucide-icon";
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
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CodeVersionElement,
  CodeVersionElementBare,
  CodeVersionElementLoader,
} from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import { AnalysisUpdateMethodEnum } from "@/utils/enums";
import { navigation } from "@/utils/navigation";
import { AnalysisSchemaI } from "@/utils/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Lock, MoreHorizontal, Plus, RefreshCcw, Unlock } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

const getHeader = (method: AnalysisUpdateMethodEnum): string => {
  switch (method) {
    case AnalysisUpdateMethodEnum.MANUAL:
      return "Manual";
    case AnalysisUpdateMethodEnum.AUTO_USER:
      return "Auto for User";
    case AnalysisUpdateMethodEnum.AUTO_ALL:
      return "Auto for All";
  }
};

const getBody = (method: AnalysisUpdateMethodEnum): string => {
  switch (method) {
    case AnalysisUpdateMethodEnum.MANUAL:
      return "Pinning this analysis to a new code version is manual";
    case AnalysisUpdateMethodEnum.AUTO_USER:
      return "Pinning this analysis to a new code version happens automatically when the user uploads a new version";
    case AnalysisUpdateMethodEnum.AUTO_ALL:
      return "Pinning this analysis to a new code version happens automatically when anyone uploads a new version";
  }
};

export const AnalysisChat: React.FC<{ analysisId: string; teamId: string }> = ({
  analysisId,
  teamId,
}) => {
  const { data: analysis } = useSuspenseQuery({
    queryKey: [QUERY_KEYS.ANALYSES, analysisId],
    queryFn: () => analysisActions.getAnalysis(teamId, analysisId),
  });

  console.log(analysis);

  if (!analysis.head.code_version_id) {
    return (
      <Button disabled variant="outline">
        <LucideIcon assetType="chat" />
        Upload/set a code version to Chat
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link href={`/teams/${teamId}/analyses/${analysisId}/chat`}>
        <LucideIcon assetType="chat" />
        Chat
      </Link>
    </Button>
  );
};

export const AnalysisOptions: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"update_method" | "update_code" | "update_analysis" | null>(
    null,
  );

  const { data: analysis } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, analysisId],
    queryFn: async () => analysisActions.getAnalysis(teamId, analysisId),
  });

  const visibilityMutation = useMutation({
    mutationFn: async () => analysisActions.toggleVisibility(teamId, analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSES, analysisId] });
      toast.success("Visibility updated", {
        description: "You updated the visibility of this analysis",
      });
    },
  });

  const handleToggle = (): void => {
    if (!analysis || !analysis.is_owner) return;
    visibilityMutation.mutate();
  };

  const handleClose = (): void => {
    setAction(null);
  };

  // NOTE: unmounting the dialogs makes state management easier.

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
            <DropdownMenuItem onClick={handleToggle} disabled={!analysis?.is_owner}>
              Toggle Visibility
              <DropdownMenuShortcut>
                {analysis?.is_public ? <Lock /> : <Unlock />}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAction("update_method")}>
              Update method
              <DropdownMenuShortcut>
                <RefreshCcw />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/teams/${teamId}/analyses/${analysis!.id}/versions/new`}>
                New Analysis Version
                <DropdownMenuShortcut>
                  <Plus />
                </DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Heads</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setAction("update_code")}>
              Code version
              <DropdownMenuShortcut>
                <LucideIcon assetType="code" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAction("update_analysis")}>
              Analysis version
              <DropdownMenuShortcut>
                <LucideIcon assetType="analysis_version" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {!!analysis && action === "update_method" && (
        <UpdateMethodDialog
          open={true}
          onOpenChange={handleClose}
          analysis={analysis!}
          teamId={teamId}
        />
      )}
      {!!analysis && action === "update_code" && (
        <CodeVersionUpdateDialog
          open={true}
          onOpenChange={handleClose}
          analysis={analysis!}
          teamId={teamId}
        />
      )}
      {!!analysis && action === "update_analysis" && (
        <SecurityVersionUpdateDialog
          open={true}
          onOpenChange={handleClose}
          analysis={analysis!}
          teamId={teamId}
        />
      )}
    </>
  );
};

const UpdateMethodDialog: React.FC<
  { analysis: AnalysisSchemaI; teamId: string } & React.ComponentProps<typeof DialogPrimitive.Root>
> = ({ teamId, analysis, ...props }) => {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState(analysis.update_method);

  const updateMethodMutation = useMutation({
    mutationFn: async (method: AnalysisUpdateMethodEnum) =>
      analysisActions.updateMethod(teamId, analysis.id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSIS_VERSION, analysis.id] });
      toast.success("Update Successful", {
        description: "You changed how code versions are pinned to this analysis",
      });
    },
  });

  const handleUpdate = (): void => {
    if (method === analysis.update_method) return;
    updateMethodMutation.mutate(method);
    if (props.onOpenChange) {
      props.onOpenChange(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Method</DialogTitle>
          <DialogDescription>Select how you want the code version to update</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <FieldGroup>
            <FieldSet>
              <FieldLabel htmlFor="compute-environment-p8w" className="sr-only">
                Member Role
              </FieldLabel>
              <FieldDescription className="sr-only">
                Update the role of the invited user
              </FieldDescription>
              <RadioGroup
                defaultValue={analysis.update_method}
                onValueChange={(value) => setMethod(value as AnalysisUpdateMethodEnum)}
              >
                {Object.values(AnalysisUpdateMethodEnum).map((method) => (
                  <FieldLabel key={method} htmlFor={method.toString()}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{getHeader(method)}</FieldTitle>
                        <FieldDescription>{getBody(method)}</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={method} id={method.toString()} />
                    </Field>
                  </FieldLabel>
                ))}
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

export const CodeVersionUpdateDialog: React.FC<
  { analysis: AnalysisSchemaI; teamId: string } & React.ComponentProps<typeof DialogPrimitive.Root>
> = ({ teamId, analysis, ...props }) => {
  const queryClient = useQueryClient();
  const [selectedCodeVersion, setSelectedCodeVersion] = useState<string | undefined>(
    analysis.head.analysis_version_id,
  );

  const { data: codeVersions } = useQuery({
    queryKey: [QUERY_KEYS.CODES, analysis.code_project_id],
    queryFn: () =>
      versionActions.getVersions(teamId, {
        project_id: analysis.code_project_id,
        page_size: "50",
      }),
    enabled: props.open,
  });

  const updateCodeHeadMutation = useMutation({
    mutationFn: async (codeVersionId: string) =>
      analysisActions.updateAnalysisHeads(teamId, analysis.id, {
        code_version_id: codeVersionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSES, analysis.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSES, "code-head", analysis.id] });
      toast.success("Update Successful", {
        description: "You updated the current code version that following analyses use",
      });
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Unable to update the code version. Try again later or reach out.",
      });
    },
  });

  const handleUpdate = (): void => {
    if (!selectedCodeVersion || selectedCodeVersion === analysis.head.code_version_id) return;
    updateCodeHeadMutation.mutate(selectedCodeVersion);
    if (props.onOpenChange) {
      props.onOpenChange(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent className="min-h-1/2 grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>Update Code Version</DialogTitle>
          <DialogDescription>
            Updating the code version will make it so that all subsequent security versions and
            chats will reference this code. You can update it whenever, and can also set your update
            method so that the process is automated.
          </DialogDescription>
        </DialogHeader>
        <div className="justify-start">
          <div className="flex flex-col gap-2 text-xs">
            {codeVersions?.results.map((version, ind) => (
              <CodeVersionElementBare
                className={cn(
                  "border p-2 text-xs hover:border-muted-foreground/60 transition-colors",
                  version.id === analysis.head.code_version_id && "border-muted-foreground",
                  version.id === selectedCodeVersion && "border-muted-foreground",
                )}
                key={ind}
                onClick={() => setSelectedCodeVersion(version.id)}
                version={version}
              />
            ))}
          </div>
          {codeVersions?.results.length === 0 && <VersionEmpty centered />}
        </div>
        <DialogFooter className="items-end">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleUpdate}
            disabled={updateCodeHeadMutation.isPending || !selectedCodeVersion}
          >
            {updateCodeHeadMutation.isPending ? "Updating..." : "Update Code Head"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const SecurityVersionUpdateDialog: React.FC<
  { analysis: AnalysisSchemaI; teamId: string } & React.ComponentProps<typeof DialogPrimitive.Root>
> = ({ teamId, analysis, ...props }) => {
  const queryClient = useQueryClient();
  const [selectedSecurityVersion, setSelectedSecurityVersion] = useState<string>("");

  const { data: securityVersions } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSIS_VERSION, "list", analysis.id],
    queryFn: () =>
      analysisActions.getAnalysisVersions(teamId, {
        analysis_id: analysis.id,
        page_size: "50",
      }),
    enabled: props.open,
  });

  const updateSecurityHeadMutation = useMutation({
    mutationFn: async (securityVersionId: string) =>
      analysisActions.updateAnalysisHeads(teamId, analysis.id, {
        analysis_version_id: securityVersionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSES, analysis.id] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ANALYSES, "analysis-head", analysis.id],
      });
      toast.success("Update Successful", {
        description: "You updated the current security version",
      });
    },
    onError: () => {
      toast.error("Something went wrong", {
        description: "Unable to update the security version. Try again later or reach out.",
      });
    },
  });

  const handleUpdate = (): void => {
    if (!selectedSecurityVersion) return;
    updateSecurityHeadMutation.mutate(selectedSecurityVersion);
    if (props.onOpenChange) {
      props.onOpenChange(false);
    }
  };

  return (
    <Dialog {...props}>
      <DialogContent className="min-h-1/2 grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>Update Security Version Head</DialogTitle>
        </DialogHeader>
        <div className="justify-start max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityVersions?.results?.map((version) => (
                <TableRow
                  key={version.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSecurityVersion === version.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedSecurityVersion(version.id)}
                >
                  <TableCell className="font-medium">Version {version.name}</TableCell>
                  <TableCell>{new Date(version.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        version.version.status === "success"
                          ? "bg-green-100 text-green-800"
                          : version.version.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {version.version.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{version.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="items-end">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleUpdate}
            disabled={updateSecurityHeadMutation.isPending || !selectedSecurityVersion}
          >
            {updateSecurityHeadMutation.isPending ? "Updating..." : "Update Security Head"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AnalysisUnlock: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const { isCopied, copy } = useCopyToClipboard();

  const { data: analysis, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, analysisId],
    queryFn: async () => analysisActions.getAnalysis(teamId, analysisId),
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

export const AnalysisUpdateMethod: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, analysisId],
    queryFn: async () => analysisActions.getAnalysis(teamId, analysisId),
  });

  if (isLoading || !analysis) {
    return <Skeleton className="h-7 w-10" />;
  }

  return <Badge variant="outline">{getHeader(analysis.update_method)}</Badge>;
};

export const AnalysisCodeHead: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, "code-head", analysisId],
    queryFn: async () => analysisActions.getAnalysisHead(teamId, analysisId),
  });

  if (!analysis || isLoading) {
    return <CodeVersionElementLoader />;
  }

  if (analysis.code_version) {
    return <CodeVersionElement version={analysis.code_version} teamId={teamId} />;
  }

  return <div className="text-sm text-muted-foreground">No code version head set</div>;
};

export const AnalysisSecurityHead: React.FC<{ teamId: string; analysisId: string }> = ({
  teamId,
  analysisId,
}) => {
  const { data: analysis, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, "analysis-head", analysisId],
    queryFn: async () => analysisActions.getAnalysisHead(teamId, analysisId),
  });

  if (!analysis || isLoading) {
    return <AnalysisElementLoader />;
  }

  if (analysis.analysis_version) {
    return <AnalysisVersionElement teamId={teamId} analysisVersion={analysis.analysis_version} />;
  }

  return <div className="text-sm text-muted-foreground">No security version head set</div>;
};
