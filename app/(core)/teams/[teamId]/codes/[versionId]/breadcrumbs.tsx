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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalStorageState } from "@/providers/localStore";
import { navigation } from "@/utils/navigation";
import { CodeVersionMappingSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import React from "react";

const ContainerBreadcrumb: React.FC<{ teamId: string; version: CodeVersionMappingSchemaI }> = ({
  teamId,
  version,
}) => {
  const projectId = version.code_project_id;
  const { state, addItem, removeItem } = useLocalStorageState("bevor:starred");
  const { data: project } = useQuery({
    queryKey: ["projects", teamId, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  const isFavorite = state?.find((item) => item.id === version.id);

  const toggleFavorite = React.useCallback(() => {
    if (isFavorite) {
      removeItem(version.id);
    } else {
      addItem({
        id: version.id,
        type: "code",
        teamId,
        label: version.inferred_name,
        url: navigation.code.overview({ teamId, versionId: version.id }),
      });
    }
  }, [isFavorite, removeItem, addItem, version, teamId]);

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
            <BreadcrumbLink asChild>
              <Link
                href={navigation.project.codes({ teamId, projectId })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="project" className="size-4" />
                Codes
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex flex-row gap-2 items-center">
              <LucideIcon assetType="code" className="size-4" />
              {version.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button variant="ghost" onClick={toggleFavorite} className="group">
        <Star
          className={cn(
            "size-4 transition-colors",
            isFavorite
              ? "fill-yellow-500 text-yellow-500 group-hover:fill-muted-foreground group-hover:text-muted-foreground"
              : "text-muted-foreground group-hover:text-foreground",
          )}
        />
      </Button>
    </div>
  );
};

export default ContainerBreadcrumb;
