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

type QueryType =
  | "team"
  | "team-settings"
  | "projects"
  | "analyses"
  | "project"
  | "project-new-code"
  | "project-codes"
  | "project-analyses"
  | "code-version"
  | "analysis"
  | "analysis-versions"
  | "analysis-new-version"
  | "analysis-version"
  | "analysis-chat"
  | "chat";

type BreadcrumbKey = Record<
  QueryType,
  (teamSlug: string, id: string) => Promise<BreadcrumbSchemaI>
>;

const breadcrumbFetchers: BreadcrumbKey = {
  team: (teamSlug: string, id: string) => {
    void id;
    return breadcrumbActions.getTeamBreadcrumb(teamSlug);
  },
  "team-settings": (teamSlug: string, id: string) => {
    void id;
    return breadcrumbActions.getTeamSettingsBreadcrumb(teamSlug);
  },
  projects: (teamSlug: string, id: string) => {
    void id;
    return breadcrumbActions.getProjectsBreadcrumb(teamSlug);
  },
  analyses: (teamSlug: string, id: string) => {
    void id;
    return breadcrumbActions.getAnalysesBreadcrumb(teamSlug);
  },
  project: (teamSlug: string, id: string) => breadcrumbActions.getProjectBreadcrumb(teamSlug, id),
  "project-new-code": (teamSlug: string, id: string) =>
    breadcrumbActions.getProjectNewCodeBreadcrumb(teamSlug, id),
  "project-codes": (teamSlug: string, id: string) =>
    breadcrumbActions.getProjectCodesBreadcrumb(teamSlug, id),
  "project-analyses": (teamSlug: string, id: string) =>
    breadcrumbActions.getProjectAnalysesBreadcrumb(teamSlug, id),
  "code-version": (teamSlug: string, id: string) =>
    breadcrumbActions.getCodeVersionBreadcrumb(teamSlug, id),
  analysis: (teamSlug: string, id: string) => breadcrumbActions.getAnalysisBreadcrumb(teamSlug, id),
  "analysis-versions": (teamSlug: string, id: string) =>
    breadcrumbActions.getAnalysisVersionsBreadcrumb(teamSlug, id),
  "analysis-new-version": (teamSlug: string, id: string) =>
    breadcrumbActions.getAnalysisNewVersionBreadcrumb(teamSlug, id),
  "analysis-version": (teamSlug: string, id: string) =>
    breadcrumbActions.getAnalysisVersionBreadcrumb(teamSlug, id),
  "analysis-chat": (teamSlug: string, id: string) =>
    breadcrumbActions.getAnalysisChatBreadcrumb(teamSlug, id),
  chat: (teamSlug: string, id: string) => breadcrumbActions.getChatBreadcrumb(teamSlug, id),
};

const ContainerBreadcrumb: React.FC<{
  queryKey: string[];
  queryType: QueryType;
  teamSlug: string;
  id: string;
  toggle?: React.ReactNode;
}> = ({ queryKey, queryType, teamSlug, id, toggle }) => {
  const { data: breadcrumb } = useQuery({
    queryKey: [QUERY_KEYS.BREADCRUMBS, queryType, ...queryKey],
    queryFn: () => breadcrumbFetchers[queryType as keyof typeof breadcrumbFetchers](teamSlug, id),
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
        teamSlug: breadcrumb.team_slug,
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
