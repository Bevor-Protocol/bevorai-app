"use client";

import { activityActions, analysisActions, projectActions } from "@/actions/bevor";
import ActivityList from "@/components/activity";
import { AnalysisElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import LucideIcon from "@/components/lucide-icon";
import CreateAnalysisModal from "@/components/Modal/create-analysis";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeProjectDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Edit, MoreHorizontal, Tag, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const ProjectToggle: React.FC<{ teamId: string; projectId: string }> = ({
  teamId,
  projectId,
}) => {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [analysisOpen, setAnalysisOpen] = React.useState(false);

  const { data: project } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px] divide-y">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem className="[&_svg]:ml-auto" asChild>
              <Link href={navigation.code.new({ teamId, projectId })}>
                New Code
                <LucideIcon assetType="code" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="[&_svg]:ml-auto" onSelect={() => setAnalysisOpen(true)}>
              New Analysis
              <LucideIcon assetType="analysis" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            <DropdownMenuItem
              className="[&_svg]:ml-auto"
              onSelect={() => {
                setEditOpen(true);
              }}
            >
              Edit
              <Edit />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="[&_svg]:ml-auto"
              variant="destructive"
              onSelect={() => {
                setDeleteOpen(true);
              }}
            >
              Delete
              <Trash />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {project && (
        <ProjectEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          teamId={teamId}
          project={project}
        />
      )}
      {project && (
        <ProjectDeleteAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          teamId={teamId}
          project={project}
        />
      )}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent>
          <CreateAnalysisModal teamId={teamId} project={project} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim() === "") return [];
      return value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    })
    .pipe(z.array(z.string())),
});
type ProjectFormValues = z.infer<typeof projectFormSchema>;

const ProjectEditDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  project: CodeProjectDetailedSchemaI;
}> = ({ open, onOpenChange, teamId, project }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => projectActions.updateProject(teamId, project.id, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.PROJECTS, project.id] });
      const previousData = queryClient.getQueryData([QUERY_KEYS.PROJECTS, project.id]);

      queryClient.setQueryData(
        [QUERY_KEYS.PROJECTS, project.id],
        (old: CodeProjectDetailedSchemaI) => ({ ...old, ...data }),
      );
      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData([QUERY_KEYS.PROJECTS, project.id], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROJECTS, project.id] });
    },
    onSuccess: () => {
      onOpenChange(false);
      toast.success("Update successful");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = projectFormSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      tags: formData.get("tags") || undefined,
    });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please review the form and try again.";
      setError(message);
      return;
    }
    updateMutation.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project details and tags.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project.name}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project.description}
              disabled={updateMutation.isPending}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={project.tags}
              disabled={updateMutation.isPending}
              placeholder="tag-one, tag-two"
            />
          </div>
          <div className="min-h-5">{error && <p className="text-sm text-red-600">{error}</p>}</div>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ProjectDeleteAlert: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  project: CodeProjectDetailedSchemaI;
}> = ({ open, onOpenChange, teamId, project }) => {
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: () => projectActions.deleteProject(teamId, project.id),
    onSuccess: () => {
      router.push(`/teams/${teamId}`);
    },
  });

  if (project.is_default) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Delete this Project</AlertDialogTitle>
            <AlertDialogDescription>
              This is your default project and cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This action removes the project and all its resources, for all members. It cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const ProjectActivities: React.FC<{ teamId: string; projectId: string }> = ({
  teamId,
  projectId,
}) => {
  const { data: activities = [] } = useQuery({
    queryKey: [QUERY_KEYS.ACTIVITIES, projectId],
    queryFn: () => activityActions.getProjectActivities(teamId, projectId),
  });

  return <ActivityList activities={activities} className="w-fit mx-auto" />;
};

export const AnalysesPreview: React.FC<{
  teamId: string;
  projectId: string;
}> = ({ teamId, projectId }) => {
  const query = { page_size: "3", project_id: projectId };
  const { data: analyses, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, query],
    queryFn: async () => analysisActions.getAnalyses(teamId, query),
  });

  if (analyses?.results.length === 0) {
    return <AnalysisEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {analyses?.results.map((analysis) => (
        <AnalysisElement key={analysis.id} analysis={analysis} teamId={teamId} />
      ))}
      {isLoading && <Skeleton className="w-full h-12" />}
    </div>
  );
};

const ProjectClient: React.FC<{ teamId: string; projectId: string }> = ({ teamId, projectId }) => {
  const { data: project } = useSuspenseQuery({
    queryKey: [QUERY_KEYS.PROJECTS, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  return (
    <>
      <h1>{project.name}</h1>
      <div className="flex flex-row gap-2 items-center">
        <div className="text-muted-foreground">Owner:</div>
        <Icon size="sm" seed={project.created_by_user.id} />
        <div>{project.created_by_user.username}</div>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="size-4" />
          <span>{formatDate(project.created_at)}</span>
        </div>
        <div className="flex flex-row gap-1 shrink-0">
          <Badge variant="blue" size="sm">
            {formatNumber(project.n_codes)} codes
          </Badge>
          <Badge variant="green" size="sm">
            {formatNumber(project.n_analyses)} analyses
          </Badge>
        </div>
      </div>
      {project.description && (
        <div className="my-2">
          <p className="text-lg leading-relaxed">{project.description}</p>
        </div>
      )}
      <div className="flex items-center gap-1">
        {project.tags.map((tag, index) => (
          <Badge key={index} variant="outline">
            <Tag className="w-2 h-2" />
            <span>{tag}</span>
          </Badge>
        ))}
      </div>
    </>
  );
};

export default ProjectClient;
