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
import { useSSE } from "@/hooks/useSSE";
import { generateQueryKey } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/helpers";
import { projectFormSchema, ProjectFormValues } from "@/utils/schema";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Edit, MoreHorizontal, Tag, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export const ProjectToggle: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [analysisOpen, setAnalysisOpen] = React.useState(false);

  const { data: project } = useQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () => projectActions.getProject(teamSlug, projectSlug),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem className="[&_svg]:ml-auto" asChild>
              <Link href={`/teams/${teamSlug}/projects/${projectSlug}/codes/new`}>
                Upload new code
                <LucideIcon assetType="code" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="[&_svg]:ml-auto" onSelect={() => setAnalysisOpen(true)}>
              Create new analysis thread
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
              Edit project
              <Edit />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="[&_svg]:ml-auto"
              variant="destructive"
              onSelect={() => {
                setDeleteOpen(true);
              }}
            >
              Delete project
              <Trash />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {project && (
        <ProjectEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          teamSlug={teamSlug}
          project={project}
        />
      )}
      {project && (
        <ProjectDeleteAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          teamSlug={teamSlug}
          project={project}
        />
      )}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent>
          <CreateAnalysisModal teamSlug={teamSlug} project={project} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProjectEditDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamSlug: string;
  project: ProjectDetailedSchemaI;
}> = ({ open, onOpenChange, teamSlug, project }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormValues) =>
      projectActions.updateProject(teamSlug, project.id, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
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
  teamSlug: string;
  project: ProjectDetailedSchemaI;
}> = ({ open, onOpenChange, teamSlug, project }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: () => projectActions.deleteProject(teamSlug, project.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      router.push(`/teams/${teamSlug}`);
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

export const ProjectActivities: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const { data: activities = [], refetch } = useQuery({
    queryKey: generateQueryKey.projectActivities(projectSlug),
    queryFn: () => activityActions.getProjectActivities(teamSlug, projectSlug),
  });

  useSSE({
    url: `/project/${projectSlug}`,
    autoConnect: true,
    onMessage: (message) => {
      console.log(message);
      refetch();
    },
    eventTypes: ["activities"],
  });

  return <ActivityList activities={activities} className="w-fit mx-auto" />;
};

export const AnalysesPreview: React.FC<{
  teamSlug: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug }) => {
  const query = { page_size: "3", project_slug: projectSlug };
  const { data: analyses, isLoading } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, query),
    queryFn: async () => analysisActions.getAnalyses(teamSlug, query),
  });

  if (analyses?.results.length === 0) {
    return <AnalysisEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {analyses?.results.map((analysis) => (
        <AnalysisElement key={analysis.id} analysis={analysis} teamSlug={teamSlug} />
      ))}
      {isLoading && <Skeleton className="w-full h-12" />}
    </div>
  );
};

const ProjectClient: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const { data: project } = useSuspenseQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () => projectActions.getProject(teamSlug, projectSlug),
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
