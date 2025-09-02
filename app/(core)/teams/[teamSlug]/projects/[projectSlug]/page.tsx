import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Clock, Code, ExternalLink, Network, Shield } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

// Server component for project data (blocks rendering)
const ProjectData: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
}> = async ({ teamSlug, projectSlug }) => {
  const team = await bevorAction.getTeam();
  const project = await bevorAction.getProjectBySlug(projectSlug);

  return (
    <div className="min-h-screen">
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} includeDescription={true} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-100">Versions</h2>
          <Suspense fallback={<VersionsLoading />}>
            <VersionsList
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              teamId={team.id}
              projectId={project.id}
            />
          </Suspense>
        </div>

        {/* Project Audits */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-100">Recent Audits</h2>
            <Link href={`/teams/${teamSlug}/projects/${projectSlug}/audits`}>
              <Button variant="transparent" className="flex items-center space-x-2">
                <span>View All Audits</span>
              </Button>
            </Link>
          </div>

          <Suspense fallback={<ProjectAuditsLoading />}>
            <ProjectAuditsList
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              projectId={project.id}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// Server component for versions (streams separately)
const VersionsList: AsyncComponent<{
  teamId: string;
  projectId: string;
  teamSlug: string;
  projectSlug: string;
}> = async ({ projectId, teamSlug, projectSlug }) => {
  const versions = await bevorAction.getVersions(projectId);

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 border border-neutral-800 rounded-lg">
        <Code className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No versions yet</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Start by uploading your first contract version for security analysis.
        </p>
        <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/new`}>
          <Button variant="bright">Upload First Version</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <div
          key={version.id}
          className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <Link
              href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${version.id}`}
              className="flex items-center space-x-3 flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                <Code className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-base font-medium text-neutral-100 truncate">
                    {version.version_method} - {version.version_identifier}
                  </h3>
                </div>
                <div className="flex items-center space-x-4 text-xs text-neutral-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(version.created_at)}</span>
                  </div>
                  {version.network && (
                    <div className="flex items-center space-x-1">
                      <Network className="w-3 h-3" />
                      <span>{version.network}</span>
                    </div>
                  )}
                  {version.solc_version && (
                    <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded">
                      Solidity {version.solc_version}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">{version.source_type}</span>
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-2 ml-4">
              {version.source_url && <ExternalLink className="w-4 h-4 text-neutral-500" />}
              <div className="relative">
                <Link
                  href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${version.id}/audits/new`}
                  className="inline-block"
                >
                  <Button
                    variant="bright"
                    className="flex items-center space-x-1 text-xs px-3 py-1.5"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Audit</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading component for versions
const VersionsLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="border border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Code className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="h-5 bg-neutral-800 rounded w-48 mb-2"></div>
              <div className="flex space-x-4">
                <div className="h-3 bg-neutral-800 rounded w-20"></div>
                <div className="h-3 bg-neutral-800 rounded w-16"></div>
                <div className="h-3 bg-neutral-800 rounded w-24"></div>
              </div>
            </div>
          </div>
          <div className="h-8 bg-neutral-800 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

const ProjectAuditsList: AsyncComponent<{
  projectId: string;
  teamSlug: string;
  projectSlug: string;
}> = async ({ projectId, teamSlug, projectSlug }) => {
  const audits = await bevorAction.getAudits({ project_id: projectId, page_size: "6" });

  if (audits.results?.length === 0) {
    return (
      <div className="text-center py-8 border border-neutral-800 rounded-lg">
        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No audits yet</h3>
        <p className="text-sm text-neutral-500">
          Start by creating a version and running your first audit.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.results.map((audit) => {
        const totalFindings =
          audit.findings.n_critical +
          audit.findings.n_high +
          audit.findings.n_medium +
          audit.findings.n_low;

        return (
          <div
            key={audit.id}
            className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all"
          >
            <Link
              href={`/teams/${teamSlug}/projects/${projectSlug}/audits/${audit.id}`}
              className="block"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-neutral-100">
                      Audit #{audit.id.slice(-8)}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(audit.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-row justify-between">
                  <div className="flex items-center space-x-2 text-xs ml-8">
                    {audit.findings.n_critical > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-red-400">{audit.findings.n_critical}</span>
                      </div>
                    )}
                    {audit.findings.n_high > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-orange-400">{audit.findings.n_high}</span>
                      </div>
                    )}
                    {audit.findings.n_medium > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-yellow-400">{audit.findings.n_medium}</span>
                      </div>
                    )}
                    {audit.findings.n_low > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-blue-400">{audit.findings.n_low}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-neutral-400">
                    <div className="text-xs text-neutral-500">{totalFindings} total findings</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

// Loading component for project audits
const ProjectAuditsLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="border border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <div className="h-4 bg-neutral-800 rounded w-32 mb-2"></div>
              <div className="flex space-x-4">
                <div className="h-3 bg-neutral-800 rounded w-20"></div>
                <div className="h-3 bg-neutral-800 rounded w-16"></div>
              </div>
            </div>
          </div>
          <div className="h-3 bg-neutral-800 rounded w-12"></div>
        </div>
      </div>
    ))}
  </div>
);

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 bg-neutral-950 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-800 rounded w-64 mb-4"></div>
              <div className="h-12 bg-neutral-800 rounded w-96 mb-8"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-32 bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProjectData teamSlug={teamSlug} projectSlug={projectSlug} />
    </Suspense>
  );
};

export default ProjectPage;
