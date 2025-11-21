"use client";

import { activityActions, analysisActions, projectActions } from "@/actions/bevor";
import ActivityList from "@/components/activity";
import { AnalysisElement } from "@/components/analysis/element";
import { AnalysisEmpty } from "@/components/analysis/empty";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSSE } from "@/hooks/useSSE";
import { generateQueryKey } from "@/utils/constants";
import { TeamOverviewSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export const TeamActivities: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const { data: activities = [], refetch } = useQuery({
    queryKey: generateQueryKey.teamActivities(teamSlug),
    queryFn: () => activityActions.getTeamActivities(teamSlug),
  });

  useSSE({
    url: `/team/${teamSlug}`,
    autoConnect: true,
    onMessage: (message) => {
      console.log(message);
      refetch();
    },
    eventTypes: ["activities"],
  });

  return <ActivityList activities={activities} className="w-full" />;
};

export const TeamMembers: React.FC<{ team: TeamOverviewSchemaI }> = ({ team }) => {
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
    queryKey: generateQueryKey.projects(teamSlug, { page_size: "3" }),
    queryFn: async () => projectActions.getProjects(teamSlug, { page_size: "3" }),
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
    queryFn: async () => analysisActions.getAnalyses(teamSlug, { page_size: "3" }),
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
