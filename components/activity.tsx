import LucideIcon from "@/components/lucide-icon";
import { formatDate } from "@/utils/helpers";
import { ActivitySchemaI, ItemType } from "@/utils/types";
import { Activity } from "lucide-react";
import Link from "next/link";

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
  analysis_version: "analysis_version",
  chat: "chat",
  member: "member",
};

const entityTypeToText: Record<string, string> = {
  code_version: "code version",
  project: "project",
  team: "team",
  analysis: "analysis",
  analysis_version: "analysis version",
  chat: "chat",
  member: "member",
};

// Entity type to route mapper
const getEntityRoute = (activity: ActivitySchemaI): string => {
  const { entity_type, team_slug, project_slug, related_id } = activity;

  switch (entity_type) {
    case "project":
      return `/teams/${team_slug}/projects/${project_slug}`;
    case "code_version":
      return `/teams/${team_slug}/projects/${project_slug}/codes/${related_id}`;
    case "analysis_thread":
      return `/teams/${team_slug}/projects/${project_slug}/analysis-thread/${related_id}`;
    case "analysis_version":
      return `/teams/${team_slug}/projects/${project_slug}/analysis-thread/${related_id}`;
    case "team":
      return `/teams/${team_slug}`;
    case "member":
      return `/teams/${team_slug}/settings/members`;
    default:
      return "#";
  }
};

const ActivityList: React.FC<{ activities: ActivitySchemaI[]; className?: string }> = ({
  activities,
  className,
}) => {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="size-5" />
        <h2 className="font-semibold">Recent Activity</h2>
      </div>
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
    </div>
  );
};

export default ActivityList;
