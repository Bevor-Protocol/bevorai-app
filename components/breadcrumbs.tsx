"use client";

import { breadcrumbActions } from "@/actions/bevor";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocalStorageState } from "@/providers/localStore";
import { QUERY_KEYS } from "@/utils/constants";
import { BreadcrumbSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import React, { Fragment } from "react";

export const BreadcrumbFallback: React.FC = () => {
  return <Skeleton className="h-8 w-40" />;
};

const breadcrumbFetchers = {
  team: (teamId: string, _id: string): Promise<BreadcrumbSchemaI> => {
    void _id;
    return breadcrumbActions.getTeamBreadcrumb(teamId);
  },
  "team-settings": (teamId: string, _id: string): Promise<BreadcrumbSchemaI> => {
    void _id;
    return breadcrumbActions.getTeamSettingsBreadcrumb(teamId);
  },
  projects: (teamId: string, _id: string): Promise<BreadcrumbSchemaI> => {
    void _id;
    return breadcrumbActions.getProjectsBreadcrumb(teamId);
  },
  analyses: (teamId: string, _id: string): Promise<BreadcrumbSchemaI> => {
    void _id;
    return breadcrumbActions.getAnalysesBreadcrumb(teamId);
  },
  project: (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getProjectBreadcrumb(teamId, id),
  "project-new-code": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getProjectNewCodeBreadcrumb(teamId, id),
  "project-codes": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getProjectCodesBreadcrumb(teamId, id),
  "project-analyses": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getProjectAnalysesBreadcrumb(teamId, id),
  "project-chats": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getProjectChatsBreadcrumb(teamId, id),
  "code-version": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getCodeVersionBreadcrumb(teamId, id),
  analysis: (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getAnalysisBreadcrumb(teamId, id),
  "analysis-versions": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getAnalysisVersionsBreadcrumb(teamId, id),
  "analysis-version": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getAnalysisVersionBreadcrumb(teamId, id),
  "analysis-chat": (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getAnalysisChatBreadcrumb(teamId, id),
  chat: (teamId: string, id: string): Promise<BreadcrumbSchemaI> =>
    breadcrumbActions.getChatBreadcrumb(teamId, id),
};

const ContainerBreadcrumb: React.FC<{
  queryKey: string[];
  queryType: string;
  teamId: string;
  id: string;
  toggle?: React.ReactNode;
}> = ({ queryKey, queryType, teamId, id, toggle }) => {
  const { data: breadcrumb } = useQuery({
    queryKey: [QUERY_KEYS.BREADCRUMBS, queryType, ...queryKey],
    queryFn: () => breadcrumbFetchers[queryType as keyof typeof breadcrumbFetchers](teamId, id),
  });

  const { state, addItem, removeItem } = useLocalStorageState("bevor:starred");

  const isFavorite = state?.find((item) => item.id === breadcrumb?.favorite?.id);

  const toggleFavorite = React.useCallback(() => {
    if (!breadcrumb || !breadcrumb.favorite) return;
    if (isFavorite) {
      removeItem(breadcrumb.favorite.id);
    } else {
      addItem({
        id: breadcrumb.favorite.id,
        type: breadcrumb.favorite.type,
        teamId: breadcrumb.team_id,
        label: breadcrumb.favorite.display_name,
        url: breadcrumb.favorite.route,
      });
    }
  }, [isFavorite, removeItem, addItem, breadcrumb]);

  if (!breadcrumb) {
    return <div className="flex flex-row gap-2 items-center h-8" />;
  }

  return (
    <div className="flex flex-row gap-2 items-center h-8">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.items.map((item) => (
            <Fragment key={item.route}>
              <BreadcrumbLink asChild>
                <Link href={item.route} className="flex flex-row gap-2 items-center max-w-40">
                  <LucideIcon assetType={item.type} className="size-4 shrink-0" />
                  <span className="truncate">{item.display_name}</span>
                </Link>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage className="flex flex-row gap-2 items-center max-w-40">
              <LucideIcon assetType={breadcrumb.page.type} className="size-4 shrink-0" />
              <span className="truncate">{breadcrumb.page.display_name}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {breadcrumb.favorite && (
        <Button variant="ghost" onClick={toggleFavorite} className="group" size="sm">
          <Star
            className={cn(
              "size-4 transition-colors",
              isFavorite
                ? "fill-yellow-500 text-yellow-500 group-hover:fill-muted-foreground group-hover:text-muted-foreground"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        </Button>
      )}
      {toggle && toggle}
      <div className="flex flex-row gap-2 items-center">
        {breadcrumb.navs.map((item) => (
          <Link href={item.route} key={item.route}>
            <Badge variant="outline" size="sm">
              {item.display_name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContainerBreadcrumb;
