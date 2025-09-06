"use client";

import { bevorAction } from "@/actions";
import CreateProjectModal from "@/components/Modal/create-project";
import CreateTeamModal from "@/components/Modal/create-team";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { CodeProjectSchema, HrefProps, TeamSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Code, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useSelectedLayoutSegments } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

const genericToggleReducer = (s: boolean): boolean => !s;

const Breadcrumbs: React.FC<{ userId: string; teams: TeamSchemaI[] }> = ({ userId, teams }) => {
  const isErrorPage = useSelectedLayoutSegments().includes("error");
  const params = useParams<HrefProps>();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [isShowing, toggle] = useReducer(genericToggleReducer, false);

  useClickOutside(ref, isShowing ? toggle : undefined);

  const { data: allProjects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => bevorAction.getAllProjects(),
  });

  const team = useMemo(() => {
    if (!teams || !params.teamSlug) return;
    return teams.find((team) => team.slug === params.teamSlug);
  }, [teams, params.teamSlug]);

  const project = useMemo(() => {
    if (!allProjects || !params.projectSlug || !teams?.length) return;
    const team = teams.find((team) => team.slug === params.teamSlug);
    if (!team) return;
    return allProjects.find(
      (project) => project.team_id === team.id && project.slug === params.projectSlug,
    );
  }, [allProjects, params.projectSlug, params.teamSlug, teams]);

  if (isProjectsLoading) {
    return <Skeleton className="h-[41px] w-36" />;
  }

  const teamHref = params.versionId
    ? navigation.team.versions(params)
    : params.auditId
      ? navigation.team.audits(params)
      : navigation.team.overview(params);

  const projectHref = params.versionId
    ? navigation.project.versions.overview(params)
    : params.auditId
      ? navigation.project.audits(params)
      : navigation.project.overview(params);

  return (
    <div className="flex flex-row items-center relative gap-4" ref={ref}>
      {pathname.startsWith("/user") && (
        <div className="flex flex-row gap-1 items-center text-sm">
          <Link
            href={navigation.user.overview(params)}
            className="flex flex-row gap-2 items-center"
          >
            <Icon size="sm" seed={userId} className="size-6" />
            <span>My Account</span>
          </Link>
          <Button variant="ghost" onClick={toggle}>
            <ChevronsUpDown className="size-4 text-neutral-400" />
          </Button>
        </div>
      )}
      {!isErrorPage && params.teamSlug && (
        <div className="flex flex-row gap-1 items-center text-sm">
          <Link href={teamHref} className="flex flex-row gap-2 items-center">
            <Icon size="sm" seed={team?.id} className="size-5" />
            <span>{team?.name}</span>
          </Link>
          <Button variant="ghost" size="narrow" onClick={toggle}>
            <ChevronsUpDown className="size-4 text-neutral-400" />
          </Button>
        </div>
      )}
      {!isErrorPage && params.projectSlug && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider">
          <Link href={projectHref} className="flex flex-row gap-2">
            <span>{project?.name}</span>
          </Link>
          <Button variant="ghost" size="narrow" onClick={toggle}>
            <ChevronsUpDown className="size-4 text-neutral-400" />
          </Button>
        </div>
      )}
      {!isErrorPage && params.versionId && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider">
          <span className="size-2 bg-green-400 rounded-full" />
          <Link href={navigation.version.overview(params)} className="flex flex-row gap-2">
            <span>Version {params.versionId.substring(0, 12)}</span>
          </Link>
        </div>
      )}
      {!isErrorPage && params.auditId && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider">
          <span className="size-2 bg-orange-400 rounded-full" />
          <Link href={navigation.audit.overview(params)} className="flex flex-row gap-2">
            <span>Audit {params.auditId.substring(0, 12)}</span>
          </Link>
        </div>
      )}
      {isShowing && (
        <BreadcrumbsContent
          teams={teams ?? []}
          projects={allProjects ?? []}
          team={team}
          project={project}
          close={toggle}
        />
      )}
    </div>
  );
};

type BreadCrumbsProps = {
  teams: TeamSchemaI[];
  projects: CodeProjectSchema[];
  team?: TeamSchemaI;
  project?: CodeProjectSchema;
  close?: () => void;
};

const BreadcrumbsContent: React.FC<BreadCrumbsProps> = ({
  teams,
  projects,
  team,
  project,
  close,
}) => {
  const pathname = usePathname();

  const [teamsShow, setTeamsShow] = useState(teams);
  const [projectsShow, setProjectsShow] = useState(projects);
  const [teamFilter, setTeamFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [hoveredTeam, setHoveredTeam] = useState<TeamSchemaI | undefined>(team);

  useEffect(() => {
    if (!teamFilter) {
      setTeamsShow(teams);
      return;
    }
    const filteredTeams = teams.filter((team) =>
      team.name.toLowerCase().includes(teamFilter.toLowerCase()),
    );
    setTeamsShow(filteredTeams);
    if (!filteredTeams.length) {
      setHoveredTeam(undefined);
      return;
    }
    const teamIds = filteredTeams.map((t) => t.id);
    if (hoveredTeam && !teamIds.includes(hoveredTeam.id)) {
      setHoveredTeam(filteredTeams[0]);
      return;
    }
    if (!hoveredTeam) {
      setHoveredTeam(filteredTeams[0]);
    }
  }, [teams, teamFilter]);

  useEffect(() => {
    if (!teams || !hoveredTeam) {
      setProjectsShow([]);
      return;
    }
    const withinTeam = projects.filter((project) => project.team_id == hoveredTeam.id);
    if (!projectFilter) {
      setProjectsShow(withinTeam);
      return;
    }
    const withinFilter = withinTeam.filter((project) =>
      project.name.toLowerCase().includes(projectFilter.toLowerCase()),
    );
    setProjectsShow(withinFilter);
  }, [teams, hoveredTeam, projects, projectFilter]);

  const buildEquivalentRoute = useCallback(
    (newProjectSlug?: string): string => {
      if (!hoveredTeam) return "";

      const projectPattern = /\/teams\/[^/]+\/projects\/[^/]+(\/.*)?/;
      const projectMatch = pathname.match(projectPattern);

      if (projectMatch) {
        const remainingPath = projectMatch[1] || "";
        const trailingPath = remainingPath.split("/").slice(0, 2).join("/");
        return `/teams/${hoveredTeam.slug}/projects/${newProjectSlug}${trailingPath}`;
      }

      const teamRoutePattern = /\/teams\/[^/]+\/([^/]+)(\/.*)?/;
      const teamRouteMatch = pathname.match(teamRoutePattern);

      if (teamRouteMatch) {
        const routeSegment = teamRouteMatch[1];
        const remainingPath = teamRouteMatch[2] || "";

        if (newProjectSlug) {
          return `/teams/${hoveredTeam.slug}/projects/${newProjectSlug}`;
        } else {
          return `/teams/${hoveredTeam.slug}/${routeSegment}${remainingPath}`;
        }
      }

      // Fallback - just the team route
      return `/teams/${hoveredTeam.slug}`;
    },
    [hoveredTeam, pathname],
  );

  return (
    <div
      className={cn(
        "border border-neutral-800 rounded-lg bg-black",
        "shadow-2xl flex overflow-hidden divide-x divide-neutral-800",
        "absolute z-999 cursor-default transition-all animate-appear top-full",
      )}
    >
      <div>
        <SearchInput
          placeholder="Find Team..."
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.currentTarget.value)}
          className="text-sm border-t-0 border-r-0 border-l-0 rounded-none focus-visible:border-input focus-visible:ring-transparent focus-visible:ring-0"
        />
        <div className="p-2 w-56">
          <div
            className={cn(
              "px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide",
            )}
          >
            teams
          </div>
          <div className="max-h-36 overflow-scroll">
            {teamsShow.map((teamItem) => (
              <div key={teamItem.id} onMouseEnter={() => setHoveredTeam(teamItem)}>
                <Link
                  href={navigation.team.overview({ teamSlug: teamItem.slug })}
                  onClick={close}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md",
                    "transition-colors text-neutral-100 hover:bg-neutral-800",
                  )}
                >
                  <Icon size="xs" seed={teamItem.id} className="size-4 flex-shrink-0" />
                  <span className="truncate text-ellipsis mx-3 flex-1">{teamItem.name}</span>
                  <div className="flex-shrink-0">
                    {team?.id === teamItem.id && <Check className="size-3" />}
                  </div>
                </Link>
              </div>
            ))}
          </div>
          {!teamFilter && (
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    "flex items-center space-x-2 w-full px-3 py-2 text-sm",
                    "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
                    "rounded-md transition-colors cursor-pointer",
                  )}
                  onMouseEnter={() => {
                    setHoveredTeam(undefined);
                  }}
                >
                  <PlusCircle className="size-4 text-blue-400" />
                  <span className="font-medium">Create Team</span>
                </button>
              </DialogTrigger>
              <DialogDescription>
                <CreateTeamModal />
              </DialogDescription>
            </Dialog>
          )}
        </div>
      </div>
      {hoveredTeam && (
        <div>
          <SearchInput
            placeholder="Find Project..."
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.currentTarget.value)}
            className="text-sm border-t-0 border-r-0 border-l-0 rounded-none focus-visible:border-input focus-visible:ring-transparent focus-visible:ring-0"
          />
          <div className="p-2 w-56">
            <div
              className={cn(
                "px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide",
              )}
            >
              projects
            </div>
            <div className="max-h-36 overflow-scroll">
              {projectsShow.map((projectItem) => (
                <div key={projectItem.id}>
                  <Link
                    onClick={close}
                    // href={navigation.project.overview({
                    //   teamSlug: hoveredTeam.slug,
                    //   projectSlug: projectItem.slug,
                    // })}
                    href={buildEquivalentRoute(projectItem.slug)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm rounded-md",
                      "transition-colors text-neutral-100 hover:bg-neutral-800",
                    )}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Code className="size-4 text-neutral-500" />
                      <span className="truncate text-ellipsis">{projectItem.name}</span>
                    </div>
                    {projectItem?.id === project?.id && <Check className="size-3" />}
                  </Link>
                </div>
              ))}
            </div>
            {!projectFilter && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center space-x-2 w-full px-3 py-2 text-sm",
                      "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
                      "rounded-md transition-colors cursor-pointer",
                    )}
                  >
                    <PlusCircle className="size-4 text-blue-400" />
                    <span className="font-medium">Create Project</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <CreateProjectModal targetTeamSlug={hoveredTeam.slug} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Breadcrumbs;
