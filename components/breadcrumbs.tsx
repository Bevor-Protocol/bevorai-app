"use client";

import { userActions } from "@/actions/bevor";
import LucideIcon from "@/components/lucide-icon";
import CreateProjectModal from "@/components/Modal/create-project";
import CreateTeamModal from "@/components/Modal/create-team";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Plus, SlashIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";

const ContainerBreadcrumb: React.FC<{
  toggle?: React.ReactNode;
}> = ({ toggle }) => {
  const { teamSlug, projectSlug, codeId, nodeId } = useParams();
  const pathname = usePathname();

  const { data: teamsRaw } = useQuery({
    queryKey: generateQueryKey.teams(),
    queryFn: () => userActions.teams(),
  });

  const { data: projects } = useQuery({
    queryKey: generateQueryKey.allProjects(),
    queryFn: () => userActions.projects(),
  });

  const { data: user } = useQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () => userActions.get(),
  });

  const curTeam = useMemo(() => {
    if (!teamsRaw || !teamSlug) return;
    return teamsRaw.find((team) => team.slug === teamSlug);
  }, [teamSlug, teamsRaw]);

  const teams = useMemo(() => {
    if (!teamsRaw) return [];
    if (!curTeam) return teamsRaw;
    const sorted = [...teamsRaw];
    const curTeamIndex = sorted.findIndex((team) => team.id === curTeam.id);
    if (curTeamIndex > 0) {
      sorted.splice(curTeamIndex, 1);
      sorted.unshift(curTeam);
    }
    return sorted;
  }, [teamsRaw, curTeam]);

  const curProject = useMemo(() => {
    if (!projects?.results || !projectSlug) return;
    return projects.results.find((project) => project.slug === projectSlug);
  }, [projectSlug, projects]);

  const teamProjectMapping = useMemo(() => {
    if (!teams || !projects?.results) return {};
    const mapping: Record<string, ProjectDetailedSchemaI[]> = {};
    for (const team of teams) {
      const projectsInTeam = projects.results.filter((project) => project.team_id == team.id);
      mapping[team.id] = projectsInTeam;
    }
    return mapping;
  }, [teams, projects]);

  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const currentRouteSegment = useMemo(() => {
    if (!teamSlug || !projectSlug) return null;
    const basePath = `/team/${teamSlug}/${projectSlug}`;

    if (pathname.startsWith(`${basePath}/analyses`)) {
      return "analyses";
    }
    if (pathname.startsWith(`${basePath}/codes`)) {
      return "codes";
    }
    if (pathname.startsWith(`${basePath}/chats`)) {
      return "chats";
    }
    return null;
  }, [teamSlug, projectSlug, pathname]);

  // Generate equivalent route for a new team/project
  const getEquivalentRoute = (newTeamSlug: string, newProjectSlug: string): string => {
    const basePath = `/team/${newTeamSlug}/${newProjectSlug}`;
    if (currentRouteSegment) {
      return `${basePath}/${currentRouteSegment}`;
    }
    return basePath;
  };

  const projectLink = useMemo(() => {
    const basePath = `/team/${teamSlug}/${projectSlug}`;

    if (pathname.startsWith(`${basePath}/analyses/`)) {
      return `${basePath}/analyses`;
    }

    if (pathname.startsWith(`${basePath}/codes/`)) {
      return `${basePath}/codes`;
    }

    if (pathname.startsWith(`${basePath}/chats/`)) {
      return `${basePath}/chats`;
    }

    return basePath;
  }, [teamSlug, projectSlug, pathname]);

  const teamLink = useMemo(() => {
    const basePath = `/team/${teamSlug}`;
    if (codeId) {
      return `${basePath}/codes`;
    }
    if (nodeId) {
      return `${basePath}/analyses`;
    }
    if (pathname.includes("/analyses")) {
      return `${basePath}/analyses`;
    }
    if (pathname.includes("/codes")) {
      return `${basePath}/codes`;
    }
    return basePath;
  }, [teamSlug, pathname, codeId, nodeId]);

  const getEquivalentTeamRoute = (newTeamSlug: string): string => {
    if (!teamSlug) {
      return `/team/${newTeamSlug}`;
    }

    return teamLink.replace(teamSlug as string, newTeamSlug);
  };

  const displayedTeamId =
    hoveredTeamId || curTeam?.id || (teams && teams.length > 0 ? teams[0].id : null);
  const displayedProjects = displayedTeamId ? teamProjectMapping[displayedTeamId] || [] : [];
  const displayedTeam = displayedTeamId ? teams?.find((team) => team.id === displayedTeamId) : null;

  const handlePopoverOpen = (e: React.MouseEvent): void => {
    e.preventDefault();
    setPopoverOpen(true);
  };

  const handlePopoverChange = (open: boolean): void => {
    setPopoverOpen(open);
    if (!open) {
      setHoveredTeamId(null);
    }
  };

  const handleTeamHover = (teamId: string): void => {
    setHoveredTeamId(teamId);
  };

  if (!teams || !projects?.results) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Skeleton className="h-5 w-24" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
      <Breadcrumb>
        <BreadcrumbList className="gap-1 sm:gap-1 ">
          {(!teamSlug || curTeam) && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  {!teamSlug ? (
                    <Link href="/user" className="flex items-center gap-2">
                      {user?.id && <Icon seed={user.id} size="sm" />}
                      <span className="truncate max-w-40">Account</span>
                    </Link>
                  ) : curTeam ? (
                    <Link href={teamLink} className="flex items-center gap-2">
                      <Icon seed={curTeam.id} size="sm" />
                      <span className="truncate max-w-40">{curTeam.name}</span>
                    </Link>
                  ) : null}
                </BreadcrumbLink>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="narrow" onClick={handlePopoverOpen}>
                    <ChevronDown className="size-3 shrink-0" />
                  </Button>
                </PopoverTrigger>
              </BreadcrumbItem>
              {curProject && (
                <>
                  <BreadcrumbSeparator>
                    <SlashIcon className="-rotate-25" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <div className="flex items-center gap-1">
                      <BreadcrumbLink asChild>
                        <Link href={projectLink} className="flex items-center gap-1">
                          <Icon seed={curProject.id} size="sm" />
                          <span className="truncate max-w-40">{curProject.name}</span>
                        </Link>
                      </BreadcrumbLink>
                      <Button
                        type="button"
                        variant="ghost"
                        size="narrow"
                        onClick={handlePopoverOpen}
                      >
                        <ChevronDown className="size-3 shrink-0" />
                      </Button>
                    </div>
                  </BreadcrumbItem>
                </>
              )}
              {!!codeId && (
                <>
                  <BreadcrumbSeparator>
                    <SlashIcon className="-rotate-25" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <LucideIcon assetType="code" className="size-4 text-green-foreground" />
                    {truncateId(codeId as string)}
                  </BreadcrumbItem>
                </>
              )}
              {!!nodeId && (
                <>
                  <BreadcrumbSeparator>
                    <SlashIcon className="-rotate-25" />
                  </BreadcrumbSeparator>

                  <BreadcrumbItem>
                    <LucideIcon assetType="analysis" className="size-4 text-muted-foreground" />
                    {truncateId(nodeId as string)}
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
          {toggle && (
            <>
              <BreadcrumbSeparator>
                <SlashIcon className="-rotate-25" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>{toggle}</BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <PopoverContent
        align="start"
        className="w-[500px] p-0 min-h-[140px] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex grow min-h-[200px]">
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-2 border-b shrink-0">
              <span className="text-xs font-medium text-muted-foreground">TEAMS</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={getEquivalentTeamRoute(team.slug)}
                  onMouseEnter={() => handleTeamHover(team.id)}
                  onClick={() => setPopoverOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                  <Icon seed={team.id} size="sm" />
                  <span className="truncate text-sm">{team.name}</span>
                  {curTeam?.id === team.id && (
                    <Check className="size-4 ml-auto text-muted-foreground" />
                  )}
                </Link>
              ))}
            </div>
            <div className="shrink-0">
              <Dialog
                open={createTeamOpen}
                onOpenChange={(open) => {
                  setCreateTeamOpen(open);
                  if (!open) {
                    setPopoverOpen(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="size-icon-sm flex items-center justify-center">
                      <Plus className="size-4" />
                    </div>
                    <span className="text-sm">Add Team</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <CreateTeamModal />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="p-2 border-b shrink-0">
              <span className="text-xs font-medium text-muted-foreground">PROJECTS</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {displayedProjects.map((project) => {
                const href = currentRouteSegment
                  ? getEquivalentRoute(project.team.slug, project.slug)
                  : `/team/${project.team.slug}/${project.slug}`;

                return (
                  <Link
                    key={project.id}
                    href={href}
                    onClick={() => setPopoverOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <Icon seed={project.id} size="sm" />
                    <span className="truncate text-sm">{project.name}</span>
                    {curProject?.id === project.id && (
                      <span className="ml-auto text-xs text-muted-foreground">✓</span>
                    )}
                  </Link>
                );
              })}
              {displayedProjects.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No projects</div>
              )}
            </div>
            <div className="shrink-0">
              <Dialog
                open={createProjectOpen}
                onOpenChange={(open) => {
                  setCreateProjectOpen(open);
                  if (!open) {
                    setPopoverOpen(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!displayedTeam}
                  >
                    <div className="size-icon-sm flex items-center justify-center">
                      <Plus className="size-4" />
                    </div>
                    <span className="text-sm">Add Project</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  {displayedTeam && (
                    <CreateProjectModal
                      teamSlug={displayedTeam.slug}
                      setOpen={(open) => {
                        setCreateProjectOpen(open);
                        if (!open) {
                          setPopoverOpen(false);
                        }
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContainerBreadcrumb;
