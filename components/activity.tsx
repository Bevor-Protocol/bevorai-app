import LucideIcon from "@/components/lucide-icon";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
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
  analysis_version: "analysis",
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
  const { entity_type, team_id, project_id, related_id } = activity;

  switch (entity_type) {
    case "project":
      return navigation.project.overview({ teamId: team_id, projectId: project_id });
    case "code_version":
      return navigation.code.overview({ teamId: team_id, versionId: related_id });
    case "analysis":
      return navigation.analysis.overview({ teamId: team_id, analysisId: related_id });
    case "team":
      return navigation.team.overview({ teamId: team_id });
    case "chat":
      // TODO: fix for chat.
      return navigation.team.overview({ teamId: team_id, analysisId: related_id });
    case "member":
      return navigation.team.members({ teamId: team_id });
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
        <h2 className="text-xl font-semibold">Recent Activity</h2>
      </div>
      <div>
        {activities.map((activity) => {
          const methodText = methodMap[activity.method] || activity.method;
          const assetType = entityTypeToAssetType[activity.entity_type];
          const entityText = entityTypeToText[activity.entity_type] || activity.entity_type;
          const route = getEntityRoute(activity);

          return (
            <div key={activity.id} className="flex items-center gap-3 py-3 text-muted-foreground">
              <div>
                <LucideIcon assetType={assetType} className="size-4" />
              </div>
              <div>
                <span>
                  {activity.user.username} {methodText} a{" "}
                </span>
                <b>
                  <Link href={route} className="text-foreground/80">
                    {entityText}
                  </Link>
                </b>
              </div>
              <div> · {formatDate(activity.created_at)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityList;
