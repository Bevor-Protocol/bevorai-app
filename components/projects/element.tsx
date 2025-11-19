import LucideIcon from "@/components/lucide-icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { Clock, User } from "lucide-react";
import Link from "next/link";
import React from "react";

export const ProjectElementLoader: React.FC = () => {
  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="w-32 h-6 mb-2" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="w-16 h-5 rounded" />
          <Skeleton className="w-16 h-5 rounded" />
        </div>
      </div>

      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4 mb-4" />

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Skeleton className="w-32 h-4" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="w-16 h-5 rounded" />
          <Skeleton className="w-20 h-5 rounded" />
          <Skeleton className="w-14 h-5 rounded" />
        </div>
      </div>
    </div>
  );
};

export const ProjectElement: React.FC<{
  project: ProjectDetailedSchemaI;
  showTeam?: boolean;
  isDisabled?: boolean;
}> = ({ project, showTeam = false, isDisabled = false }) => {
  return (
    <Link
      key={project.id}
      href={navigation.project.overview({ teamSlug: project.team.slug, projectSlug: project.slug })}
      aria-disabled={isDisabled}
      className={cn(
        "block border transition-colors rounded-lg",
        isDisabled ? "cursor-default" : "hover:border-border-accent cursor-pointer",
      )}
    >
      <div className="flex items-start justify-start gap-2 rounded-lg p-4">
        <div className="grow space-y-2">
          <div className="flex justify-between items-start gap-2">
            <p className="font-medium text-foreground truncate text-lg flex-1 min-w-0">
              {project.name}
            </p>
            <div className="flex flex-row gap-1 shrink-0">
              <Badge variant="blue" size="sm">
                {formatNumber(project.n_codes)} codes
              </Badge>
              <Badge variant="green" size="sm">
                {formatNumber(project.n_analyses)} analyses
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              {showTeam && (
                <div className="flex items-center gap-1">
                  <LucideIcon assetType="team" className="size-3" />
                  <span>{project.team.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <User className="size-3" />
                <span>{project.created_by_user.username}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>
            {project.tags.length > 0 && (
              <div className="flex gap-1 shrink-0">
                {project.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 2 && (
                  <Badge variant="outline" size="sm">
                    +{project.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
