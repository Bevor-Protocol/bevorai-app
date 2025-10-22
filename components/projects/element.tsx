import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumer } from "@/utils/helpers";
import { CodeProjectSchema } from "@/utils/types";
import { Clock } from "lucide-react";
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
  project: CodeProjectSchema;
  teamId: string;
  isDisabled?: boolean;
}> = ({ project, teamId, isDisabled = false }) => {
  return (
    <Link
      key={project.id}
      href={`/teams/${teamId}/projects/${project.id}`}
      className="block border border-border rounded-lg bg-card text-card-foreground p-4 hover:border-neutral-700 transition-all aria-disabled:opacity-80 aria-disabled:pointer-events-none"
      aria-disabled={isDisabled}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate">{project.name}</h3>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <Badge variant="blue">{formatNumer(project.n_versions)} versions</Badge>
          <Badge variant="green">{formatNumer(project.n_audits)} audits</Badge>
        </div>
      </div>
      {project.description && (
        <p className="mb-4 line-clamp-2 leading-relaxed">{project.description}</p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center space-x-1 text-muted-foreground text-mini">
          <Clock className="size-3" />
          <span>{formatDate(project.created_at)}</span>
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline">+{project.tags.length - 3} more</Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
