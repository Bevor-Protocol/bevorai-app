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
import { AnalysesQueryParams } from "@/types/api/requests/security";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import { FindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { formatDate, formatNumber } from "@/utils/helpers";
import { projectFormSchema, ProjectFormValues } from "@/utils/schema";
import {
  QueryKey,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Edit,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash,
  X,
} from "lucide-react";
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
  project: ProjectDetailedSchema;
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
  project: ProjectDetailedSchema;
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
  userId: string;
}> = ({ teamSlug, projectSlug, userId }) => {
  const query: AnalysesQueryParams = {
    page_size: 3,
    project_slug: projectSlug,
    is_leaf: true,
    user_id: userId,
  };
  const { data: analyses, isLoading } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, query as { [key: string]: any }),
    queryFn: async () =>
      analysisActions.getAnalyses(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const mostRecentId = analyses?.results[0]?.id;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">My Current Analyses</h3>
        <div className="flex items-center gap-2">
          {mostRecentId && (
            <Button variant="default" size="sm" className="h-7 text-xs" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/analyses/${mostRecentId}`}>
                Open latest
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" asChild>
            <Link href={`/team/${teamSlug}/${projectSlug}/analyses`}>View all</Link>
          </Button>
        </div>
      </div>

      {!isLoading && analyses?.results.length === 0 && <AnalysisEmpty />}

      <div className="flex flex-col gap-3">
        {analyses?.results.map((analysis) => (
          <Link
            key={analysis.id}
            href={`/team/${teamSlug}/${projectSlug}/analyses/${analysis.id}`}
            className="block transition-colors hover:bg-accent/50 cursor-pointer"
          >
            <AnalysisVersionCompactElement analysisVersion={analysis} />
          </Link>
        ))}
        {isLoading && <Skeleton className="w-full h-12" />}
      </div>
    </div>
  );
};

export const CodePreview: React.FC<{
  teamSlug: string;
  projectSlug: string;
}> = ({ teamSlug, projectSlug }) => {
  const { data: codes, isLoading } = useQuery({
    queryKey: generateQueryKey.codes(teamSlug, { page_size: "3", project_slug: projectSlug }),
    queryFn: async () =>
      codeActions.getVersions(teamSlug, { page_size: 3, project_slug: projectSlug }).then((r) => {
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

const severityOrder = ["critical", "high", "medium", "low"];

const severityBadgeClass: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  low: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const ValidatedFindingRow: React.FC<{
  finding: FindingSchema;
  teamSlug: string;
  projectSlug: string;
  updateMutation: UseMutationResult<
    {
      toInvalidate: QueryKey[];
    },
    Error,
    {
      findingId: string;
      analysisId: string;
      status: FindingStatusEnum;
    },
    unknown
  >;
}> = ({ finding, teamSlug, projectSlug, updateMutation }) => (
  <div className="flex items-start gap-3 py-2.5 px-3 rounded-md border border-border bg-card hover:bg-accent/30 transition-colors group">
    <ShieldCheck className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium truncate">{finding.name}</span>
        <Badge variant="outline" size="sm" className={severityBadgeClass[finding.level] ?? ""}>
          {finding.level}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        <Link
          href={`/team/${teamSlug}/${projectSlug}/analyses/${finding.analysis_id}`}
          className="hover:underline hover:text-foreground transition-colors"
        >
          analysis {finding.analysis_id.slice(0, 8)}
        </Link>
      </div>
    </div>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      {finding.status === FindingStatusEnum.REMEDIATED ? (
        <Button
          variant="ghost"
          size="sm"
          title="Mark as unresolved"
          disabled={updateMutation.isPending}
          onClick={() =>
            updateMutation.mutate({
              findingId: finding.id,
              analysisId: finding.analysis_id,
              status: FindingStatusEnum.UNRESOLVED,
            })
          }
        >
          <RotateCcw className="size-3" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          title="Mark as remediated"
          disabled={updateMutation.isPending}
          onClick={() =>
            updateMutation.mutate({
              findingId: finding.id,
              analysisId: finding.analysis_id,
              status: FindingStatusEnum.REMEDIATED,
            })
          }
        >
          <CheckCheck className="size-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        title="Remove from validated list"
        disabled={updateMutation.isPending}
        onClick={() =>
          updateMutation.mutate({
            findingId: finding.id,
            analysisId: finding.analysis_id,
            status: FindingStatusEnum.INVALIDATED,
          })
        }
      >
        <X className="size-3" />
      </Button>
    </div>
  </div>
);

export const ValidatedFindings: React.FC<{ teamSlug: string; projectSlug: string }> = ({
  teamSlug,
  projectSlug,
}) => {
  const queryClient = useQueryClient();
  const [remediatedOpen, setRemediatedOpen] = React.useState(false);

  const { data: findings = [], isLoading } = useQuery({
    queryKey: generateQueryKey.validatedFindings(projectSlug),
    queryFn: async () =>
      analysisActions
        .getFindings(teamSlug, { project_slug: projectSlug, status: FindingStatusEnum.VALIDATED })
        .then((r) => {
          if (!r.ok) return [];
          return r.data;
        }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      findingId,
      analysisId,
      status,
    }: {
      findingId: string;
      analysisId: string;
      status: FindingStatusEnum;
    }) =>
      analysisActions
        .updateFinding(teamSlug, analysisId, findingId, {
          status,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
    onError: () => {
      toast.error("Failed to update finding");
    },
  });

  const active = findings
    .filter((f) => f.status !== FindingStatusEnum.REMEDIATED)
    .sort((a, b) => severityOrder.indexOf(a.level) - severityOrder.indexOf(b.level));
  const remediated = findings.filter((f) => f.status === FindingStatusEnum.REMEDIATED);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold">Validated Findings</h3>
        {findings.length > 0 && (
          <Badge variant="outline" size="sm" className="text-xs">
            {active.length} active
          </Badge>
        )}
      </div>

      {isLoading && <Skeleton className="w-full h-10" />}

      {!isLoading && findings.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          No validated findings yet. Click &ldquo;Validate&ldquo; on any finding in an analysis to
          add it here.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {active.map((finding) => (
          <ValidatedFindingRow
            key={finding.id}
            finding={finding}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            updateMutation={updateMutation}
          />
        ))}
      </div>

      {remediated.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            onClick={() => setRemediatedOpen((o) => !o)}
          >
            {remediatedOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            <span>{remediated.length} remediated</span>
          </button>
          {remediatedOpen && (
            <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-purple/40">
              {remediated.map((finding) => (
                <div key={finding.id} className="opacity-70">
                  <ValidatedFindingRow
                    finding={finding}
                    teamSlug={teamSlug}
                    projectSlug={projectSlug}
                    updateMutation={updateMutation}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
