import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { AuditElement, AuditElementLoader } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { AuditPagination } from "@/components/audits/pagination";
import { AsyncComponent, AuditObservationI } from "@/utils/types";
import React, { Suspense } from "react";

interface ProjectAuditsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ProjectAuditsPage: AsyncComponent<ProjectAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug, projectSlug } = await params;
  const { page = "0" } = await searchParams;

  return (
    <>
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} />
      <Suspense
        fallback={
          <div className="px-6 py-8 min-h-screen">
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
        <ProjectAuditsData teamSlug={teamSlug} projectSlug={projectSlug} page={page} />
      </Suspense>
    </>
  );
};

const ProjectAuditsData: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
  page: string;
}> = async ({ teamSlug, projectSlug, page }) => {
  const project = await bevorAction.getProjectBySlug(projectSlug);
  const audits = await bevorAction.getAudits({ project_id: project.id, page });

  return (
    <div className="px-6 py-8 bg-neutral-950 mx-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <AuditPagination
          page={page}
          basePath={`/teams/${teamSlug}/projects/${projectSlug}/audits`}
        />
        <div>
          <Suspense fallback={<AuditsLoading />}>
            <AuditsList audits={audits.results || []} teamSlug={teamSlug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const AuditsList: React.FC<{
  audits: AuditObservationI[];
  teamSlug: string;
}> = ({ audits, teamSlug }) => {
  if (audits.length === 0) {
    return <AuditEmpty centered />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.map((audit) => (
        <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
      ))}
    </div>
  );
};

const AuditsLoading: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <AuditElementLoader key={index} />
    ))}
  </div>
);

export default ProjectAuditsPage;
