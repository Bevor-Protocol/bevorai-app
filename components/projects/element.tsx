import LucideIcon from "@/components/lucide-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeProjectDetailedSchemaI } from "@/utils/types";
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

export const ProjectSimpleElement: React.FC<{
  project: CodeProjectDetailedSchemaI;
  isDisabled?: boolean;
}> = ({ project, isDisabled = false }) => {
  return (
    <Link
      key={project.id}
      href={navigation.project.overview({ teamId: project.team.id, projectId: project.id })}
      aria-disabled={isDisabled}
      className={cn(
        "block border transition-colors rounded-lg",
        isDisabled ? "cursor-default" : "hover:border-muted-foreground/60 cursor-pointer",
      )}
    >
      <div className="flex items-start justify-start gap-2 rounded-lg p-4">
        <div className="grow space-y-2">
          <div className="flex justify-between">
            <p className="font-medium text-foreground truncate text-lg">{project.name}</p>
            <div className="flex flex-row gap-1 items-end">
              <Badge variant="blue" size="sm">
                {formatNumber(project.n_versions)} versions
              </Badge>
              <Badge variant="green" size="sm">
                {formatNumber(project.n_analyses)} analyses
              </Badge>
            </div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{formatDate(project.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="size-3" />
              <span>{project.created_by_user.username}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const ProjectElement: React.FC<{
  project: CodeProjectDetailedSchemaI;
  isDisabled?: boolean;
}> = ({ project, isDisabled = false }) => {
  return (
    <Link
      key={project.id}
      href={navigation.project.overview({ teamId: project.team.id, projectId: project.id })}
      aria-disabled={isDisabled}
    >
      <Card className="group relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset size-full">
        <CardContent className="flex flex-col gap-2 grow">
          <div className="flex flex-row justify-between">
            <h3 className="text-foreground truncate max-w-1/2">{project.name}</h3>
            <div className="flex flex-row gap-1 items-end">
              <Badge variant="blue">{formatNumber(project.n_versions)} versions</Badge>
              <Badge variant="green">{formatNumber(project.n_analyses)} analyses</Badge>
            </div>
          </div>
          {project.description && (
            <p className="mt-2 line-clamp-2 leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t">
          <div className="flex items-center space-x-1 text-muted-foreground text-mini">
            <Clock className="size-3" />
            <span>{formatDate(project.created_at)}</span>
          </div>
          <div className="flex gap-1.5">
            {project.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 2 && (
              <Badge variant="outline">+{project.tags.length - 2} more</Badge>
            )}
          </div>
          <div className="flex flex-row gap-2 items-center">
            <LucideIcon assetType="team" className="size-4 " />
            {project.team.name}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
