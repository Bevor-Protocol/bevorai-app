import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent, AuditObservationI } from "@/utils/types";
import { Clock, Code, FileText, Shield } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface VersionPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
}

// Server component for version data
const VersionData: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
  versionId: string;
}> = async ({ teamSlug, projectSlug, versionId }) => {
  const project = await bevorAction.getProjectBySlug(projectSlug);

  // Get recent audits for this version
  const audits = await bevorAction.getAudits({
    project_id: project.id,
    version_id: versionId,
  });

  return (
    <div className="px-6 py-8 bg-neutral-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/sources`}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-100">View Sources</h3>
                  <p className="text-xs text-neutral-400">Browse contract source code</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits/new`}
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-100">New Audit</h3>
                  <p className="text-xs text-neutral-400">Start security analysis</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits`}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-100">View Audits</h3>
                  <p className="text-xs text-neutral-400">See audit history</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Audits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-100">Recent Audits</h2>
            <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits`}>
              <Button variant="transparent" className="text-sm">
                View All
              </Button>
            </Link>
          </div>

          <Suspense fallback={<AuditsLoading />}>
            <RecentAuditsList
              audits={audits.results || []}
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              versionId={versionId}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// Component for recent audits list
const RecentAuditsList: React.FC<{
  audits: AuditObservationI[];
  teamSlug: string;
  projectSlug: string;
  versionId: string;
}> = ({ audits, teamSlug, projectSlug, versionId }) => {
  if (audits.length === 0) {
    return (
      <div className="text-center py-8 bg-neutral-900 border border-neutral-800 rounded-lg">
        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No audits yet</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Start your first security audit for this version.
        </p>
        <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits/new`}>
          <Button variant="bright">Start First Audit</Button>
        </Link>
      </div>
    );
  }

  const recentAudits = audits.slice(0, 5); // Show only the 5 most recent

  return (
    <div className="space-y-3">
      {recentAudits.map((audit) => (
        <div
          key={audit.id}
          className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all"
        >
          <Link
            href={`/teams/${teamSlug}/projects/${projectSlug}/audits/${audit.id}`}
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
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-500">{0} findings</div>
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
    {Array.from({ length: 3 }).map((_, index) => (
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
              </div>
            </div>
          </div>
          <div className="h-3 bg-neutral-800 rounded w-12"></div>
        </div>
      </div>
    ))}
  </div>
);

const VersionPage: AsyncComponent<VersionPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug, versionId } = await params;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 bg-neutral-950 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-800 rounded w-64 mb-4"></div>
              <div className="h-32 bg-neutral-800 rounded mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 bg-neutral-800 rounded"></div>
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VersionData teamSlug={teamSlug} projectSlug={projectSlug} versionId={versionId} />
    </Suspense>
  );
};

export default VersionPage;
