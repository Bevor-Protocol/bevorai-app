import { bevorAction } from "@/actions";
import { AuditElementLoader } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
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
    page_size: "6",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={navigation.version.sources({ teamSlug, projectSlug, versionId })}>
          <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Code className="size-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-100">View Sources</h3>
                <p className="text-xs text-neutral-400">Browse contract source code</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href={navigation.version.audits.new({ teamSlug, projectSlug, versionId })}>
          <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="size-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-100">New Audit</h3>
                <p className="text-xs text-neutral-400">Start security analysis</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href={navigation.version.audits.overview({ teamSlug, projectSlug, versionId })}>
          <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <FileText className="size-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-100">View Audits</h3>
                <p className="text-xs text-neutral-400">See audit history</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-100">Recent Audits</h2>
          <Link href={navigation.version.audits.overview({ teamSlug, projectSlug, versionId })}>
            <Button variant="outline" className="text-sm">
              View All
            </Button>
          </Link>
        </div>

        <Suspense fallback={<AuditsLoading />}>
          <RecentAuditsList
            audits={audits.results || []}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
          />
        </Suspense>
      </div>
    </div>
  );
};

// Component for recent audits list
const RecentAuditsList: React.FC<{
  audits: AuditObservationI[];
  teamSlug: string;
  projectSlug: string;
}> = ({ audits, teamSlug, projectSlug }) => {
  if (audits.length === 0) {
    return <AuditEmpty centered />;
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.map((audit) => {
        const totalFindings =
          audit.findings.n_critical +
          audit.findings.n_high +
          audit.findings.n_medium +
          audit.findings.n_low;

        return (
          <div
            key={audit.id}
            className="border rounded-lg p-4 hover:border-neutral-700 transition-all"
          >
            <Link
              href={navigation.audit.overview({ teamSlug, projectSlug, auditId: audit.id })}
              className="block"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="size-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
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

// Loading component for audits
const AuditsLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <AuditElementLoader key={index} />
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
