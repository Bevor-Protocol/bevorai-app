"use client";

import LucideIcon from "@/components/lucide-icon";
import { Badge } from "@/components/ui/badge";
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
import { AnalysisSchemaI } from "@/utils/types";
import { Star } from "lucide-react";
import Link from "next/link";
import React from "react";

const ContainerBreadcrumb: React.FC<{ analysis: AnalysisSchemaI; teamId: string }> = ({
  analysis,
  teamId,
}) => {
  const { state, addItem, removeItem } = useLocalStorageState("bevor:starred");

  const isFavorite = state?.find((item) => item.id === analysis.id);

  const toggleFavorite = React.useCallback(() => {
    if (isFavorite) {
      removeItem(analysis.id);
    } else {
      addItem({
        id: analysis.id,
        type: "analysis",
        teamId: teamId,
        label: analysis.name ?? analysis.id.slice(0, 5),
        url: navigation.analysis.overview({ teamId: teamId, analysisId: analysis.id }),
      });
    }
  }, [isFavorite, removeItem, addItem, analysis, teamId]);

  return (
    <div className="flex flex-row gap-2 items-center">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={navigation.team.overview({ teamId: teamId })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="team" className="size-4" />
                {analysis.team.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={navigation.project.overview({
                  teamId,
                  projectId: analysis.code_project.id,
                })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="project" className="size-4" />
                {analysis.code_project.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={navigation.project.analyses({
                  teamId,
                  projectId: analysis.code_project.id,
                })}
                className="flex flex-row gap-2 items-center"
              >
                <LucideIcon assetType="analysis" className="size-4" />
                Analyses
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex flex-row gap-2 items-center">
              <LucideIcon assetType="analysis" className="size-4" />
              {analysis.name ?? analysis.id.slice(0, 6)}
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
      <div className="flex flex-row gap-2 items-center">
        <Link
          href={navigation.project.codes({ teamId: analysis.team.id, analysisId: analysis.id })}
        >
          <Badge variant="outline" size="sm">
            Versions
          </Badge>
        </Link>
      </div>
    </div>
  );
};

export default ContainerBreadcrumb;
