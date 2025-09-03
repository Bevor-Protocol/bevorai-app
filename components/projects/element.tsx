import { Skeleton } from "@/components/ui/loader";
import { formatDate } from "@/utils/helpers";
import { CodeProjectSchema } from "@/utils/types";
import Link from "next/link";
import React from "react";

export const ProjectElementLoader: React.FC = () => {
  return (
    <div className="border border-neutral-800 rounded-lg p-6">
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

      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
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
  teamSlug: string;
}> = ({ project, teamSlug }) => {
  return (
    <Link
      key={project.id}
      href={`/teams/${teamSlug}/projects/${project.slug}`}
      className="block border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-neutral-100 truncate">{project.name}</h3>
            <p className="text-sm text-neutral-400">Created {formatDate(project.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 flex-shrink-0">
            {project.n_versions || 0} versions
          </div>
          <div className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 flex-shrink-0">
            {project.n_audits || 0} audits
          </div>
        </div>
      </div>
      {project.description && (
        <p className="text-sm text-neutral-300 mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
        <div className="text-xs text-neutral-500">
          Last updated {formatDate(project.created_at)}
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-4xl text-xs font-medium bg-neutral-800/50 text-neutral-300 border border-neutral-700"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-800/50 text-neutral-400 border border-neutral-700">
                +{project.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
