"use client";

import { bevorAction } from "@/actions";
import CreateProjectModal from "@/components/Modal/create-project";
import CreateTeamModal from "@/components/Modal/create-team";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/loader";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useModal } from "@/hooks/useContexts";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { CodeProjectSchema, HrefProps, InitialUserObject, TeamSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronsUpDown, Code, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo, useReducer, useRef, useState } from "react";

const genericToggleReducer = (s: boolean): boolean => !s;

const Breadcrumbs: React.FC<{ userObject: InitialUserObject }> = ({ userObject }) => {
  const params = useParams<HrefProps>();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [isShowing, toggle] = useReducer(genericToggleReducer, false);

  useClickOutside(ref, isShowing ? toggle : undefined);

  const { data: teams, isLoading: isTeamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => bevorAction.getTeams(),
    initialData: userObject.teams,
    staleTime: Infinity,
  });

  const { data: allProjects, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => bevorAction.getAllProjects(),
    initialData: userObject.projects,
    staleTime: Infinity,
  });

  const team = useMemo(() => {
    if (!teams || !params.teamSlug) return;
    return teams.find((team) => team.slug === params.teamSlug);
  }, [teams, params.teamSlug]);

  const project = useMemo(() => {
    if (!allProjects || !params.projectSlug) return;
    const team = teams.find((team) => team.slug === params.teamSlug);
    if (!team) return;
    return allProjects.find(
      (project) => project.team_id === team.id && project.slug === params.projectSlug,
    );
  }, [allProjects, params.projectSlug, params.teamSlug]);

  if (isTeamsLoading || isProjectsLoading) {
    return <Skeleton className="h-[41px] w-36" />;
  }

  return (
    <div className="flex flex-row items-center relative gap-4" ref={ref}>
      {pathname.startsWith("/user") && (
        <div className="flex flex-row gap-1 items-center text-sm">
          <Link
            href={navigation.user.overview(params)}
            className="flex flex-row gap-2 items-center"
          >
            <Icon size="sm" seed={userObject.userId} className="w-5 h-5" />
            <span>My Account</span>
          </Link>
          <button
            onClick={toggle}
            className="py-2 px-1 rounded cursor-pointer hover:bg-neutral-600"
          >
            <ChevronsUpDown className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      )}
      {params.teamSlug && (
        <div className="flex flex-row gap-1 items-center text-sm">
          <Link
            href={navigation.team.overview(params)}
            className="flex flex-row gap-2 items-center"
          >
            <Icon size="sm" seed={team?.id} className="w-5 h-5" />
            <span>{team?.name}</span>
          </Link>

          <button
            onClick={toggle}
            className="py-2 px-1 rounded cursor-pointer hover:bg-neutral-600"
          >
            <ChevronsUpDown className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      )}
      {params.projectSlug && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider">
          <Link href={navigation.project.overview(params)} className="flex flex-row gap-2">
            <span>{project?.name}</span>
          </Link>
          <button
            onClick={toggle}
            className="py-2 px-1 rounded cursor-pointer hover:bg-neutral-600"
          >
            <ChevronsUpDown className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      )}
      {params.versionId && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          <Link href={navigation.version.overview(params)} className="flex flex-row gap-2">
            <span>Version {params.versionId.substring(0, 12)}</span>
          </Link>
        </div>
      )}
      {params.auditId && (
        <div className="flex flex-row gap-1 items-center text-sm breadcrumb-divider ml-2">
          <span className="w-2 h-2 bg-orange-400 rounded-full" />
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
  const { show, hide } = useModal();
  const [showProjects, setShowProjects] = useState(true);
  const [hoveredTeam, setHoveredTeam] = useState<TeamSchemaI | undefined>(team);
  const [hoveredProject, setHoveredProject] = useState<CodeProjectSchema | undefined>(project);

  const hoveredProjects = useMemo(() => {
    if (!teams || !hoveredTeam) return [];
    return projects.filter((project) => project.team_id == hoveredTeam.id);
  }, [teams, hoveredTeam, projects]);

  const handleProjectDisplay = (team: TeamSchemaI): void => {
    setHoveredTeam(team);
    setShowProjects(true);
  };

  const handleProject = (project: CodeProjectSchema): void => {
    setHoveredProject(project);
  };

  return (
    <div
      className={cn(
        "bg-neutral-900 border border-neutral-800 rounded-lg",
        "shadow-2xl flex overflow-hidden",
        "absolute z-999 cursor-default transition-all animate-appear top-full",
      )}
    >
      <div className="p-2 min-w-64">
        <div
          className={cn("px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide")}
        >
          Teams
        </div>
        {teams.map((teamItem) => (
          <div key={teamItem.id} onMouseEnter={() => handleProjectDisplay(teamItem)}>
            <Link
              href={`/teams/${teamItem.slug}`}
              onClick={close}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm rounded-md",
                "transition-colors",
                teamItem.id === hoveredTeam?.id
                  ? " text-neutral-100 bg-neutral-800"
                  : "text-neutral-300 hover:text-neutral-100",
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon size="sm" seed={teamItem.id} className="w-4 h-4" />
                <span className="font-medium">{teamItem.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-neutral-500 capitalize">{teamItem.role}</div>
                <ChevronRight className="w-3 h-3 text-neutral-500" />
              </div>
            </Link>
          </div>
        ))}
        <div className="border-t border-neutral-800 my-2" />
        <button
          onClick={() => {
            if (close) close();
            show(<CreateTeamModal onClose={hide} />);
          }}
          className={cn(
            "flex items-center space-x-2 w-full px-3 py-2 text-sm",
            "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
            "rounded-md transition-colors cursor-pointer",
          )}
          onMouseEnter={() => {
            setShowProjects(false);
            setHoveredTeam(undefined);
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Team</span>
        </button>
      </div>
      {showProjects && (
        <div
          className={cn(
            "border-l border-neutral-800 p-2 min-w-56",
            "transition-opacity duration-200",
            "bg-neutral-950/50",
            hoveredTeam ? "opacity-100" : "opacity-75",
          )}
        >
          <div
            className={cn(
              "px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide",
            )}
          >
            projects
          </div>
          {hoveredProjects.map((projectItem) => (
            <div key={projectItem.id} onMouseEnter={() => handleProject(projectItem)}>
              <Link
                onClick={close}
                href={`/teams/${hoveredTeam?.slug}/projects/${hoveredProject?.slug}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm rounded-md",
                  "transition-colors",
                  projectItem.id === hoveredProject?.id
                    ? " text-neutral-100 bg-neutral-800"
                    : "text-neutral-300 hover:text-neutral-100",
                )}
              >
                <div className="flex items-center space-x-3">
                  <Code className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">{projectItem.name}</span>
                </div>
              </Link>
            </div>
          ))}
          <div className="border-t border-neutral-800 my-2" />
          <button
            onClick={() => {
              if (close) close();
              show(<CreateProjectModal onClose={hide} targetTeamSlug={hoveredTeam!.slug} />);
            }}
            className={cn(
              "flex items-center space-x-2 w-full px-3 py-2 text-sm",
              "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800",
              "rounded-md transition-colors cursor-pointer",
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Breadcrumbs;
