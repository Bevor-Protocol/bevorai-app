"use client";

import { activityActions, analysisActions, projectActions } from "@/actions/bevor";
import AnalyzeClient from "@/app/(core)/team/[teamSlug]/analyze/client";
import ActivityList from "@/components/activity";
import { AnalysisVersionElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { TeamDetailedSchema } from "@/types/api/responses/business";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import {
  Code,
  FileEdit,
  Folder,
  GitBranch,
  GitCommitHorizontal,
  Globe,
  Plus,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const CreateProjectButton: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string | null>(null);

  const openUpload = (m: string): void => {
    setMethod(m);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu>
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
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/team/${teamSlug}/settings/api`)}
          >
            <Code className="size-4 text-orange-400" />
            MCP / IDE Integration
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/user/github/manage?teamSlug=${teamSlug}`)}
          >
            <GitBranch className="size-4" />
            GitHub Connection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setMethod(null);
        }}
      >
        <DialogContent
          className="max-w-6xl w-full h-[85vh] flex flex-col overflow-hidden p-6 gap-0"
          showCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>New code version</DialogTitle>
          </DialogHeader>
          {method && (
            <AnalyzeClient
              teamSlug={teamSlug}
              initialMethod={method}
              onBack={() => setOpen(false)}
            />
          )}
        </DialogContent>
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
