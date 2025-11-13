"use client";

import { activityActions, analysisActions, projectActions } from "@/actions/bevor";
import ActivityList from "@/components/activity";
import { AnalysisElement } from "@/components/audits/element";
import { AnalysisEmpty } from "@/components/audits/empty";
import LucideIcon from "@/components/lucide-icon";
import { ProjectSimpleElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QUERY_KEYS } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { TeamOverviewSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Code, DollarSign, File, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";
import React from "react";

export const TeamToggle: React.FC<{ teamId: string }> = ({ teamId }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="[&_svg]:ml-auto">
            <Link href={navigation.team.settings.overview({ teamId: teamId })}>
              <span>Home</span>
              <Settings />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="[&_svg]:ml-auto">
            <Link href={navigation.team.settings.api({ teamId: teamId })}>
              <span>API</span>
              <Code />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="[&_svg]:ml-auto">
            <Link href={navigation.team.settings.billing({ teamId: teamId })}>
              <span>Billing</span>
              <DollarSign />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="[&_svg]:ml-auto">
            <Link href={navigation.team.settings.invoices({ teamId: teamId })}>
              <span>Invoices</span>
              <File />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="[&_svg]:ml-auto">
            <Link href={navigation.team.members({ teamId: teamId })}>
              <span>Members</span>
              <LucideIcon assetType="member" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const TeamActivities: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { data: activities = [] } = useQuery({
    queryKey: [QUERY_KEYS.ACTIVITIES, teamId],
    queryFn: () => activityActions.getTeamActivities(teamId),
  });

  return <ActivityList activities={activities} className="w-fit mx-auto" />;
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
            <div key={user.id} className="text-muted-foreground flex flex-row gap-2">
              <Icon size="sm" seed={user.id} key={user.id} />
              {user.username}
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const ProjectsSection: React.FC<{
  teamId: string;
}> = ({ teamId }) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PROJECTS, { page_size: "3" }],
    queryFn: async () => projectActions.getProjects(teamId, { page_size: "3" }),
  });

  if (projects?.results.length === 0) {
    return <ProjectEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      {projects?.results.map((project) => (
        <ProjectSimpleElement key={project.id} project={project} />
      ))}
      {isLoading && [0, 1].map((ind) => <Skeleton key={ind} className="w-full h-56" />)}
    </div>
  );
};

export const AnalysesPreview: React.FC<{
  teamId: string;
}> = ({ teamId }) => {
  const { data: analyses, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ANALYSES, { page_size: "3" }],
    queryFn: async () => analysisActions.getAnalyses(teamId, { page_size: "3" }),
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
