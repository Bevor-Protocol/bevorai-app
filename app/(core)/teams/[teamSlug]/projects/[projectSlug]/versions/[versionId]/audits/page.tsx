import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent, AuditObservationI } from "@/utils/types";
import { ChevronLeft, ChevronRight, Clock, Shield } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

interface VersionAuditsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const VersionAuditsPage: AsyncComponent<VersionAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug, projectSlug, versionId } = await params;
  const { page = "0" } = await searchParams;

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
      <VersionAuditsData
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        versionId={versionId}
        page={page}
      />
    </Suspense>
  );
};

const VersionAuditsData: AsyncComponent<{
  teamSlug: string;
  versionId: string;
  projectSlug: string;
  page: string;
}> = async ({ teamSlug, versionId, projectSlug, page }) => {
  const audits = await bevorAction.getAudits({ version_id: versionId, page });

  return (
    <div className="px-6 py-8 bg-neutral-950 mx-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <Pagination
          currentPage={parseInt(page)}
          totalPages={audits.total_pages || 1}
          hasMore={audits.more || false}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          versionId={versionId}
        />
        <div>
          <Suspense fallback={<AuditsLoading />}>
            <AuditsList
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

const AuditsList: React.FC<{
  audits: AuditObservationI[];
  teamSlug: string;
  projectSlug: string;
  versionId: string;
}> = ({ audits, teamSlug, projectSlug, versionId }) => {
  if (audits.length === 0) {
    return (
      <div className="text-center py-12 border border-neutral-800 rounded-lg">
        <Shield className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-300 mb-2">No audits yet</h3>
        <p className="text-sm text-neutral-500 mb-6">
          Start your first security audit for this version.
        </p>
        <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits/new`}>
          <Button variant="bright">Start First Audit</Button>
        </Link>
      </div>
    );
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

const AuditsLoading: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
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

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  teamSlug: string;
  projectSlug: string;
  versionId: string;
}> = ({ currentPage, totalPages, hasMore, teamSlug, projectSlug, versionId }) => {
  const prevPage = currentPage > 0 ? currentPage - 1 : 0;
  const nextPage = currentPage + 1;

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4">
        <Link
          href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits?page=${prevPage}`}
        >
          <Button
            disabled={currentPage === 0}
            variant="transparent"
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>
        </Link>
        <span className="text-sm text-neutral-400">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Link
          href={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/audits?page=${nextPage}`}
        >
          <Button disabled={!hasMore} variant="transparent" className="flex items-center space-x-2">
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default VersionAuditsPage;
