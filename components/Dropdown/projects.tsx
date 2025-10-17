"use client";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/input";
import { navigation } from "@/utils/navigation";
import { CodeProjectSchema, HrefProps } from "@/utils/types";
import { Check, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

interface ProjectsDropdownProps {
  projects: CodeProjectSchema[];
}

const ProjectsDropdown: React.FC<ProjectsDropdownProps> = ({ projects }) => {
  const params = useParams<HrefProps>();
  const [projectsShow, setProjectsShow] = useState(projects);
  const [projectFilter, setProjectFilter] = useState("");

  const project = useMemo(() => {
    if (!projects || !params.projectSlug) return;
    return projects.find((project) => project.slug === params.projectSlug);
  }, [projects, params?.projectSlug]);

  useEffect(() => {
    if (!projectFilter) {
      setProjectsShow(projects);
      return;
    }
    const filteredTeams = projects.filter((project) =>
      project.name.toLowerCase().includes(projectFilter.toLowerCase()),
    );
    setProjectsShow(filteredTeams);
  }, [projects, projectFilter]);

  return (
    <div className="w-56">
      <SearchInput
        placeholder="Find Project..."
        value={projectFilter}
        onChange={(e) => setProjectFilter(e.currentTarget.value)}
        className="text-sm border-0 rounded-none focus-visible:border-input focus-visible:ring-transparent focus-visible:ring-0"
      />
      <div className="p-2">
        <div className="max-h-36 overflow-scroll">
          {projectsShow.map((projectItem) => (
            <DropdownMenuItem key={projectItem.id} asChild>
              <Link
                href={navigation.team.overview({ projectSlug: projectItem.slug })}
                className="flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-foreground hover:bg-neutral-800"
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon size="xs" seed={projectItem.id} className="size-4 flex-shrink-0" />
                  <span className="truncate text-ellipsis flex-1">{projectItem.name}</span>
                </div>
                {project?.id === projectItem.id && <Check className="size-3" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        {!projectFilter && (
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-start gap-4">
              <PlusCircle className="size-4 text-blue-400" />
              <span className="font-medium">Create Project</span>
            </Button>
          </DialogTrigger>
        )}
      </div>
    </div>
  );
};

export default ProjectsDropdown;
