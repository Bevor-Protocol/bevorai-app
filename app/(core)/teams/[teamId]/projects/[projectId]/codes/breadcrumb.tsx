"use client";

import { projectActions } from "@/actions/bevor";
import LucideIcon from "@/components/lucide-icon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { navigation } from "@/utils/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import React from "react";

const ContainerBreadcrumb: React.FC<{ teamId: string; projectId: string }> = ({
  teamId,
  projectId,
}) => {
  const { data: project } = useQuery({
    queryKey: ["projects", teamId, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  if (!project) {
    return <></>;
  }

  return (
    <div className="flex flex-row gap-2 items-center">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={navigation.team.overview({ teamId })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="team" className="size-4" />
                {project.team.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={navigation.project.overview({ teamId, projectId })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="project" className="size-4" />
                {project.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex flex-row gap-2 items-center">
              <LucideIcon assetType="code" className="size-4" />
              Codes
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default ContainerBreadcrumb;
