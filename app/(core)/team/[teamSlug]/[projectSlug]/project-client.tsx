"use client";

import {
  activityActions,
  analysisActions,
  codeActions,
  githubActions,
  projectActions,
} from "@/actions/bevor";
import ActivityList from "@/components/activity";
import { AnalysisVersionCompactElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import LucideIcon from "@/components/lucide-icon";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CodeVersionCompactElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { useFormReducer } from "@/hooks/useFormReducer";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/helpers";
import { projectFormSchema, ProjectFormValues } from "@/utils/schema";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Edit, MoreHorizontal, Tag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

export const ProjectToggle: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const { data: project } = useQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () =>
      projectActions.getProject(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem className="[&_svg]:ml-auto" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/codes/new`}>
                Upload Code
                <LucideIcon assetType="code" />
              </Link>
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
      {/* intentionally unmount this, so state resets */}
      {project && editOpen && (
        <ProjectEditDialog onOpenChange={setEditOpen} teamSlug={teamSlug} project={project} />
      )}
      {project && (
        <ProjectDeleteAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          teamSlug={teamSlug}
          project={project}
        />
      )}
    </>
  );
};

const ProjectEditDialog: React.FC<{
  onOpenChange: (open: boolean) => void;
  teamSlug: string;
  project: ProjectDetailedSchemaI;
}> = ({ onOpenChange, teamSlug, project }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialState: ProjectFormValues = {
    name: project.name,
    tags: project.tags.join(", "),
    description: project.description || "",
  };
  const { formState, setField, updateFormState } = useFormReducer<ProjectFormValues>(initialState);

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormValues) =>
      projectActions.updateProject(teamSlug, project.slug, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ project: refreshedProject, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onOpenChange(false);
      toast.success("Update successful");
      if (refreshedProject.slug !== project.slug) {
        router.push(`/team/${teamSlug}/${refreshedProject.slug}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = projectFormSchema.safeParse(formState.values);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      updateFormState({ type: "SET_ERRORS", errors: fieldErrors });
      return;
    }

    updateMutation.mutate(parsed.data);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update the project metadata</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name" aria-required>
                Name
              </FieldLabel>
              <Input
                id="name"
                name="name"
                value={formState.values.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={updateMutation.isPending}
                aria-invalid={!!formState.errors.name}
              />
              {formState.errors.name && (
                <p className="text-sm text-destructive">{formState.errors.name}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                value={formState.values.description || ""}
                onChange={(e) => setField("description", e.target.value)}
                disabled={updateMutation.isPending}
                rows={4}
                aria-invalid={!!formState.errors.description}
              />
              {formState.errors.description && (
                <p className="text-sm text-destructive">{formState.errors.description}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <Input
                id="tags"
                name="tags"
                value={formState.values.tags || ""}
                onChange={(e) => setField("tags", e.target.value)}
                disabled={updateMutation.isPending}
                placeholder="codebase-1, exploratory"
                aria-invalid={!!formState.errors.tags}
              />
              {formState.errors.tags && (
                <p className="text-sm text-destructive">{formState.errors.tags}</p>
              )}
            </Field>

            {updateMutation.error && (
              <p className="text-sm text-destructive">{updateMutation.error.message}</p>
            )}
          </FieldGroup>
          <DialogFooter className="mt-2">
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
    mutationFn: () =>
      projectActions.deleteProject(teamSlug, project.id).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      router.push(`/team/${teamSlug}`);
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
  const { data: activities = [] } = useQuery({
    queryKey: generateQueryKey.projectActivities(projectSlug),
    queryFn: () =>
      activityActions.getProjectActivities(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return <ActivityList activities={activities} />;
};

export const AnalysesPreview: React.FC<{
  teamSlug: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug }) => {
  const query = { page_size: "3", project_slug: projectSlug };
  const { data: analyses, isLoading } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, query),
    queryFn: async () =>
      analysisActions.getAnalyses(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (analyses?.results.length === 0) {
    return <AnalysisEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {analyses?.results.map((analysis) => (
        <Link
          key={analysis.id}
          href={`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`}
          className="block transition-colors hover:bg-accent/50 cursor-pointer"
        >
          <AnalysisVersionCompactElement key={analysis.id} analysisVersion={analysis} />
        </Link>
      ))}
      {isLoading && <Skeleton className="w-full h-12" />}
    </div>
  );
};

export const CodePreview: React.FC<{
  teamSlug: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug }) => {
  const query = { page_size: "3", project_slug: projectSlug };
  const { data: codes, isLoading } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, query),
    queryFn: async () =>
      codeActions.getVersions(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (codes?.results.length === 0) {
    return <VersionEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {codes?.results.map((code) => (
        <Link
          key={code.id}
          href={`/team/${teamSlug}/${projectSlug}/codes/${code.id}`}
          className="block transition-colors hover:bg-accent/50 cursor-pointer"
        >
          <CodeVersionCompactElement version={code} />
        </Link>
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
    queryFn: () =>
      projectActions.getProject(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: branches } = useQuery({
    queryKey: [QUERY_KEYS.GITHUB_BRANCHES, project.github_repo_id],
    queryFn: () =>
      githubActions.getBranches(project.github_repo_id!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!project.github_repo_id,
  });

  console.log(branches);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">{project.name}</h1>
            {project.github_repo && (
              <a
                href={project.github_repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="my-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border text-xs mb-2 font-mono hover:bg-muted/80 transition-colors"
              >
                <div className="relative size-4 shrink-0">
                  <Image
                    src={project.github_repo.account.avatar_url}
                    alt={project.github_repo.account.login}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
                <span className="font-medium">{project.github_repo.full_name}</span>
                {project.github_repo.is_private && (
                  <span className="text-[10px] opacity-70">• Private</span>
                )}
              </a>
            )}
          </div>
          <ProjectToggle teamSlug={teamSlug} projectSlug={projectSlug} />
        </div>
        <div className="flex flex-row gap-2 items-center text-sm text-muted-foreground">
          <span>Owner:</span>
          <Icon size="sm" seed={project.created_by_user.id} />
          <span>{project.created_by_user.username}</span>
        </div>
      </div>
      {project.description && (
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          {project.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>{formatDate(project.created_at)}</span>
        </div>
        <div className="flex flex-row gap-2">
          <Badge variant="blue" size="sm">
            {formatNumber(project.n_codes)} codes
          </Badge>
          <Badge variant="green" size="sm">
            {formatNumber(project.n_analyses)} analyses
          </Badge>
        </div>
      </div>
      {project.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {project.tags.map((tag, index) => (
            <Badge key={index} variant="outline" size="sm">
              <Tag className="size-3" />
              <span>{tag}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectClient;
