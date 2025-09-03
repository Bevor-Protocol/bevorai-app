import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { AuditElement } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { Button } from "@/components/ui/button";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { AsyncComponent, AuditTableResponseI, CodeVersionsResponseI } from "@/utils/types";
import Link from "next/link";
import { Suspense } from "react";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectData: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
}> = async ({ teamSlug, projectSlug }) => {
  const team = await bevorAction.getTeam();
  const project = await bevorAction.getProjectBySlug(projectSlug);

  const versions = await bevorAction.getVersions({ project_id: project.id });
  let audits;
  if (versions.results.length) {
    audits = await bevorAction.getAudits({ project_id: project.id, page_size: "6" });
  }

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-100">Versions</h2>
          <VersionsList teamSlug={teamSlug} teamId={team.id} versions={versions} />
        </div>
        {audits && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-100">Recent Audits</h2>
              <Link href={`/teams/${teamSlug}/projects/${projectSlug}/audits`}>
                <Button variant="transparent" className="flex items-center space-x-2">
                  <span>View All Audits</span>
                </Button>
              </Link>
            </div>
            <ProjectAuditsList teamSlug={teamSlug} audits={audits} />
          </div>
        )}
      </div>
    </div>
  );
};

const VersionsList: AsyncComponent<{
  teamId: string;
  teamSlug: string;
  versions: CodeVersionsResponseI;
}> = async ({ teamSlug, versions }) => {
  if (versions.results.length === 0) {
    return <VersionEmpty />;
  }

  return (
    <div className="space-y-3">
      {versions.results.map((version) => (
        <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} />
      ))}
    </div>
  );
};

const ProjectAuditsList: AsyncComponent<{
  teamSlug: string;
  audits: AuditTableResponseI;
}> = async ({ teamSlug, audits }) => {
  if (audits.results?.length === 0) {
    return <AuditEmpty />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.results.map((audit) => (
        <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
      ))}
    </div>
  );
};

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  return (
    <>
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} includeDescription={true} />
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
    </>
  );
};

export default ProjectPage;
