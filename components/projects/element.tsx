import LucideIcon from "@/components/lucide-icon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/utils/helpers";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { Clock, User } from "lucide-react";
import Image from "next/image";
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
      href={`/team/${project.team.slug}/${project.slug}`}
      aria-disabled={isDisabled}
      className={cn(
        "block border rounded-lg transition-colors",
        isDisabled ? "cursor-default opacity-50" : "hover:bg-accent/50 cursor-pointer",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold mb-1.5">{project.name}</h3>
            {project.github_repo && (
              <div className="inline-flex my-2 items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border text-xs mb-2 font-mono">
                <div className="relative size-4 shrink-0">
                  <Image
                    src={project.github_repo.installation.account_avatar_url}
                    alt={project.github_repo.installation.account_login}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
                <span className="font-medium">{project.github_repo.full_name}</span>
                {project.github_repo.is_private && (
                  <span className="text-[10px] opacity-70">• Private</span>
                )}
              </div>
            )}
            {project.description ? (
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            ) : (
              <p>
                <i className="text-muted-foreground text-xs">No Description</i>
              </p>
            )}
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tags.map((tag, index) => (
              <Badge key={index} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {showTeam && (
              <div className="flex items-center gap-1.5">
                <LucideIcon assetType="team" className="size-3" />
                <span>{project.team.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="size-3" />
              <span>{project.created_by_user.username}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3" />
              <span>{formatDate(project.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">
              {formatNumber(project.n_codes)} codes
            </Badge>
            <Badge variant="green" size="sm">
              {formatNumber(project.n_analyses)} analyses
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
};
