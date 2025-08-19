import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AsyncComponent, AuditObservationI } from "@/utils/types";
import { Clock, Shield } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface ProjectAuditsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

// Server component for project audits data
const ProjectAuditsData: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
}> = async ({ teamSlug, projectSlug }) => {
  const project = await bevorAction.getProjectBySlug(projectSlug);

  // Get all audits for this project (across all versions)
  const audits = await bevorAction.getAudits({ project_id: project.id });

  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">Project Audits</h1>
          <p className="text-neutral-400">All security audits for {project.name}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Total Audits</span>
            </div>
            <div className="text-2xl font-bold text-neutral-100">{audits.results?.length || 0}</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-neutral-400">Successful</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {audits.results?.filter((a) => a.status === "success").length || 0}
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-neutral-400">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {audits.results?.filter((a) => a.status === "processing").length || 0}
            </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-neutral-400">Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {audits.results?.filter((a) => a.status === "failed").length || 0}
            </div>
          </div>
        </div>

        {/* Audits List */}
        <div>
          <Suspense fallback={<AuditsLoading />}>
            <AuditsList
              audits={audits.results || []}
              teamSlug={teamSlug}
              projectSlug={projectSlug}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// Component for audits list
const AuditsList: React.FC<{
  audits: AuditObservationI[];
  teamSlug: string;
  projectSlug: string;
}> = ({ audits, teamSlug, projectSlug }) => {
  if (audits.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-lg">
        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No audits yet</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Start by creating a version and running your first audit.
        </p>
        <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/new`}>
          <Button variant="bright">Create First Version</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audits.map((audit) => (
        <div
          key={audit.id}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all"
        >
          <Link
            href={navigation.audit.overview({ teamSlug, projectSlug, auditId: audit.id })}
            className="block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-100">
                    Audit #{audit.id.slice(-8)}
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-neutral-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(audit.created_at)}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        audit.status === "success"
                          ? "bg-green-500/10 text-green-400"
                          : audit.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {audit.status}
                    </span>
                    <span className="text-xs text-neutral-500">
                      Version: {audit.code_version_mapping_id.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

// Loading component for audits
const AuditsLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
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
                <div className="h-3 bg-neutral-800 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ProjectAuditsPage: AsyncComponent<ProjectAuditsPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 bg-neutral-950 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-800 rounded w-64 mb-4"></div>
              <div className="h-12 bg-neutral-800 rounded w-96 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 bg-neutral-800 rounded"></div>
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProjectAuditsData teamSlug={teamSlug} projectSlug={projectSlug} />
    </Suspense>
  );
};

export default ProjectAuditsPage;
