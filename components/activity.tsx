import LucideIcon from "@/components/lucide-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemType } from "@/types";
import { ActivitySchema } from "@/types/api/responses/business";
import { formatDate } from "@/utils/helpers";
import { Activity } from "lucide-react";
import Link from "next/link";
import React from "react";

// Method mapper
const methodMap: Record<string, string> = {
  create: "created",
  delete: "deleted",
  update: "updated",
};

// Entity type to asset type mapper
const entityTypeToAssetType: Record<string, ItemType> = {
  code_version: "code",
  project: "project",
  team: "team",
  analysis: "analysis",
  chat: "chat",
  member: "member",
};

const entityTypeToText: Record<string, string> = {
  code_version: "code version",
  project: "project",
  team: "team",
  analysis: "analysis",
  chat: "chat",
  member: "member",
};

// Entity type to route mapper
const getEntityRoute = (activity: ActivitySchema): string => {
  const { entity_type, team_slug, project_slug, related_id } = activity;

  switch (entity_type) {
    case "project":
      return `/team/${team_slug}/${project_slug}`;
    case "code_version":
      return `/team/${team_slug}/${project_slug}/codes/${related_id}`;
    case "analysis":
      return `/team/${team_slug}/${project_slug}/analyses/${related_id}`;
    case "team":
      return `/team/${team_slug}`;
    case "member":
      return `/team/${team_slug}/settings/members`;
    case "chat":
      return `/team/${team_slug}/${project_slug}/chats/${related_id}`;
    default:
      return "#";
  }
};

const ActivityList: React.FC<{
  activities: ActivitySchema[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  showHeader?: boolean;
}> = ({
  activities,
  isLoading = false,
  emptyMessage = "No activity in this project yet.",
  className,
  showHeader = true,
}) => {
  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-2">
          <Activity className="size-4" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div>
          {activities.map((activity) => {
            const methodText = methodMap[activity.method] || activity.method;
            const assetType = entityTypeToAssetType[activity.entity_type];
            const entityText = entityTypeToText[activity.entity_type] || activity.entity_type;
            const route = getEntityRoute(activity);

            return (
              <div
                key={activity.id}
                className="flex items-center gap-2 py-2 text-sm text-muted-foreground whitespace-nowrap"
              >
                <LucideIcon assetType={assetType} className="size-4 shrink-0" />
                <span className="truncate">
                  {activity.user.username} {methodText} a{" "}
                  <Link href={route} className="text-foreground/80 font-medium">
                    {entityText}
                  </Link>
                  {" · "}
                  {formatDate(activity.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityList;
