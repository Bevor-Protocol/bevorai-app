"use client";

import { activityActions, analysisActions, projectActions } from "@/actions/bevor";
import CreateProjectModal from "@/components/Modal/create-project";
import ActivityList from "@/components/activity";
import { AnalysisVersionElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ContractAddressStep from "@/components/views/upload/explorer";
import FileStep from "@/components/views/upload/file";
import FolderStep from "@/components/views/upload/folder";
import McpProjectStep from "@/components/views/upload/mcp";
import MethodSelection from "@/components/views/upload/method";
import { PasteCodeStep } from "@/components/views/upload/paste";
import GitHubReposStep from "@/components/views/upload/private_repo";
import RepoUrlStep from "@/components/views/upload/public_repo";
import { TeamDetailedSchema, type ProjectDetailedSchema } from "@/types/api/responses/business";
import { generateQueryKey } from "@/utils/constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Code,
  Database,
  FileEdit,
  Folder,
  GitBranch,
  GitCommitHorizontal,
  Globe,
  MoveLeft,
  Plus,
  Upload,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useRef, useState } from "react";

export type NewProjectUploadMethod =
  | "file"
  | "paste"
  | "folder"
  | "scan"
  | "repo"
  | "empty"
  | "mcp"
  | "github";

type TeamNewProjectUpload = {
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  captureEnsureProject: (tags: string[]) => Promise<ProjectDetailedSchema>;
  handleUploadSuccess: (analysisId: string) => void;
  reset: () => void;
};

function useTeamNewProjectUpload(teamSlug: string): TeamNewProjectUpload {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const projectRef = useRef<ProjectDetailedSchema | null>(null);

  const reset = useCallback((): void => {
    setError(null);
    projectRef.current = null;
  }, []);

  const ensureProject = useCallback(
    async (tags: string[]): Promise<ProjectDetailedSchema> => {
      if (projectRef.current) return projectRef.current;
      const res = await projectActions.createProject(teamSlug, { tags: tags.join(",") });
      if (!res.ok) {
        throw new Error(
          typeof res.error === "object" && res.error != null && "message" in res.error
            ? String((res.error as { message?: string }).message)
            : "Failed to create project",
        );
      }
      res.data.toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      projectRef.current = res.data.project;
      return res.data.project;
    },
    [teamSlug, queryClient],
  );

  const captureEnsureProject = useCallback(
    async (tags: string[]): Promise<ProjectDetailedSchema> => {
      try {
        return await ensureProject(tags);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project");
        throw err;
      }
    },
    [ensureProject],
  );

  const handleUploadSuccess = useCallback(
    (analysisId: string): void => {
      if (!projectRef.current) return;
      router.push(`/team/${teamSlug}/${projectRef.current.slug}/analyses/${analysisId}`);
    },
    [teamSlug, router],
  );

  return { error, setError, captureEnsureProject, handleUploadSuccess, reset };
}

export const TeamAnalyzePageClient: React.FC<{
  teamSlug: string;
  initialMethod?: string;
}> = ({ teamSlug, initialMethod }) => {
  const { error, captureEnsureProject, handleUploadSuccess, reset } =
    useTeamNewProjectUpload(teamSlug);
  const [method, setMethod] = useState<string | null>(() => initialMethod ?? null);

  const handleBack = (): void => {
    setMethod(null);
    reset();
  };

  if (!method) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {error && (
          <p className="mb-4 flex items-center gap-2 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
        <MethodSelection
          setMethod={setMethod}
          nextStep={() => {}}
          teamSlug={teamSlug}
          isChild={false}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      {error && (
        <p className="mb-4 flex shrink-0 items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}
      <Button variant="ghost" className="mb-4 shrink-0 self-start" onClick={handleBack}>
        <MoveLeft />
        Back to selection
      </Button>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {method === "file" && (
          <FileStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
        )}
        {method === "paste" && (
          <PasteCodeStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
        )}
        {method === "folder" && (
          <FolderStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
        )}
        {method === "scan" && (
          <ContractAddressStep
            ensureProject={captureEnsureProject}
            onSuccess={handleUploadSuccess}
          />
        )}
        {method === "repo" && (
          <RepoUrlStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
        )}
        {method === "mcp" && <McpProjectStep teamSlug={teamSlug} onCompleteClose={handleBack} />}
        {method === "github" && (
          <GitHubReposStep teamSlug={teamSlug} onProjectCreated={handleBack} />
        )}
      </div>
    </div>
  );
};

export const CreateProjectButton: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { error, captureEnsureProject, handleUploadSuccess, reset } =
    useTeamNewProjectUpload(teamSlug);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<NewProjectUploadMethod | null>(null);

  const openUpload = (m: NewProjectUploadMethod): void => {
    setMethod(m);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu open={optionsOpen} onOpenChange={() => setOptionsOpen(!optionsOpen)}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="size-4" />
            New Project
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Upload method
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("file")}>
            <Upload className="size-4 text-blue-400" />
            Upload file
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("paste")}>
            <FileEdit className="size-4 text-emerald-400" />
            Write / paste
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("folder")}>
            <Folder className="size-4 text-yellow-400" />
            Upload Folder
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("scan")}>
            <Globe className="size-4 text-purple-400" />
            Explorer Scan
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("repo")}>
            <GitCommitHorizontal className="size-4" />
            Public Repository
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("mcp")}>
            <Code className="size-4 text-orange-400" />
            MCP / IDE Integration
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={() => openUpload("github")}>
            <GitBranch className="size-4" />
            GitHub Connection
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer opacity-70"
            onClick={() => openUpload("empty")}
          >
            <Database className="size-4 text-gray-400" />
            Create an Empty Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setMethod(null);
            reset();
          }
        }}
      >
        {method && (
          <DialogContent
            className="flex max-h-[85vh] w-full max-w-6xl flex-col gap-4 overflow-hidden p-6"
            showCloseButton={true}
          >
            {error && (
              <p className="mb-4 flex shrink-0 items-center gap-2 text-sm text-destructive">
                <XCircle className="size-4 shrink-0" />
                {error}
              </p>
            )}
            <Button
              variant="ghost"
              className="mb-4 shrink-0 self-start"
              onClick={() => {
                setOpen(false);
                setOptionsOpen(true);
                reset();
              }}
            >
              <MoveLeft />
              Back to selection
            </Button>
            {method === "file" && (
              <FileStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
            )}
            {method === "paste" && (
              <PasteCodeStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
            )}
            {method === "folder" && (
              <FolderStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
            )}
            {method === "scan" && (
              <ContractAddressStep
                ensureProject={captureEnsureProject}
                onSuccess={handleUploadSuccess}
              />
            )}
            {method === "repo" && (
              <RepoUrlStep ensureProject={captureEnsureProject} onSuccess={handleUploadSuccess} />
            )}
            {method === "mcp" && (
              <McpProjectStep
                teamSlug={teamSlug}
                onCompleteClose={() => {
                  setOpen(false);
                  setMethod(null);
                  reset();
                }}
              />
            )}
            {method === "github" && (
              <GitHubReposStep
                teamSlug={teamSlug}
                onProjectCreated={() => {
                  setOpen(false);
                  setMethod(null);
                  reset();
                }}
              />
            )}
            {method === "empty" && (
              <CreateProjectModal
                teamSlug={teamSlug}
                setOpen={(next) => {
                  if (!next) {
                    setOpen(false);
                    setMethod(null);
                    reset();
                  }
                }}
              />
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export const TeamActivities: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: activities = [] } = useQuery({
    queryKey: generateQueryKey.teamActivities(teamSlug),
    queryFn: () =>
      activityActions.getTeamActivities(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return <ActivityList activities={activities} className="w-full" />;
};

export const TeamMembers: React.FC<{ team: TeamDetailedSchema }> = ({ team }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex -space-x-2 w-fit">
          {team.users.slice(0, 3).map((user) => (
            <Icon size="sm" seed={user.id} key={user.id} />
          ))}
          {team.users.length > 3 && (
            <div className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-xs text-muted-foreground">
              +{team.users.length - 3}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent align="start" side="top">
        <div className="flex flex-col gap-1 min-w-40">
          {team.users.map((user) => (
            <div key={user.id} className="text-muted-foreground flex items-center gap-2">
              <Icon size="sm" seed={user.id} />
              {user.username}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const ProjectsSection: React.FC<{
  teamSlug: string;
}> = ({ teamSlug }) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, { page_size: "20" }),
    queryFn: async () =>
      projectActions.getProjects(teamSlug, { page_size: "20" }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (projects?.results.length === 0) {
    return <ProjectEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {projects?.results.map((project) => (
        <ProjectElement key={project.id} project={project} />
      ))}
      {isLoading && [0, 1].map((ind) => <Skeleton key={ind} className="w-full h-56" />)}
    </div>
  );
};

export const AnalysesPreview: React.FC<{
  teamSlug: string;
}> = ({ teamSlug }) => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug, { page_size: "3" }),
    queryFn: async () =>
      analysisActions.getAnalyses(teamSlug, { page_size: "3" }).then((r) => {
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
        <AnalysisVersionElement key={analysis.id} analysisVersion={analysis} />
      ))}
      {isLoading && <Skeleton className="w-full h-12" />}
    </div>
  );
};
