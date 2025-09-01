import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { FileText } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamData: AsyncComponent<{ teamSlug: string }> = async ({ teamSlug }) => {
  const team = await bevorAction.getTeam();

  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">{team.name}</h1>
          <p className="text-neutral-400">
            Manage your team&apos;s projects and security analysis.
          </p>
        </div>
        <Suspense fallback={<ProjectsLoading />}>
          <ProjectsGrid teamSlug={teamSlug} />
        </Suspense>
      </div>
    </div>
  );
};

const ProjectsGrid: AsyncComponent<{ teamSlug: string }> = async ({ teamSlug }) => {
  const projects = await bevorAction.getProjects();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/teams/${teamSlug}/projects/${project.slug}`}
          className="block bg-neutral-900 border border-neutral-800 rounded-lg p-6 hover:border-neutral-700 transition-all hover:bg-neutral-900/80"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
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
                    className="px-2 py-1 rounded text-xs font-medium bg-neutral-800/50 text-neutral-300 border border-neutral-700"
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
      ))}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-300 mb-2">No projects yet</h3>
          <p className="text-sm text-neutral-500 mb-6">
            Get started by creating your first security audit project.
          </p>
          <Link href="/terminal">
            <Button variant="bright">Start New Project</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

const ProjectsLoading: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-6 bg-neutral-800 rounded w-32 mb-2"></div>
              <div className="h-4 bg-neutral-800 rounded w-24"></div>
            </div>
          </div>
          <div className="h-6 bg-neutral-800 rounded w-16 flex-shrink-0"></div>
        </div>
        <div className="h-4 bg-neutral-800 rounded w-full mb-2"></div>
        <div className="h-4 bg-neutral-800 rounded w-3/4 mb-4"></div>
        <div className="flex gap-1.5 mb-4">
          <div className="h-6 bg-neutral-800 rounded w-12"></div>
          <div className="h-6 bg-neutral-800 rounded w-16"></div>
          <div className="h-6 bg-neutral-800 rounded w-14"></div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
          <div className="h-3 bg-neutral-800 rounded w-24"></div>
          <div className="h-8 bg-neutral-800 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
);

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  return (
    <Suspense
      fallback={<div className="px-6 py-8 bg-neutral-950 min-h-screen">Loading team...</div>}
    >
      <TeamData teamSlug={teamSlug} />
    </Suspense>
  );
};

export default TeamPage;
