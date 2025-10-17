import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { AuditElement } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import Container from "@/components/container";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { navigation } from "@/utils/navigation";
import { AsyncComponent, AuditTableResponseI, CodeVersionsResponseI } from "@/utils/types";
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

  const versions = await bevorAction.getVersions({ project_id: project.id, page_size: "6" });
  const audits = await bevorAction.getAudits({ project_id: project.id, page_size: "6" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <VersionsSection teamSlug={teamSlug} teamId={team.id} versions={versions} />
      <AuditsSection teamSlug={teamSlug} projectSlug={projectSlug} audits={audits} />
    </div>
  );
};

const VersionsSection: AsyncComponent<{
  teamId: string;
  teamSlug: string;
  versions: CodeVersionsResponseI;
}> = async ({ teamSlug, versions }) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Versions</h2>
          <a
            href={`/teams/${teamSlug}/versions`}
            className="text-sm text-link hover:text-link-accent transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {versions.results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {versions.results.slice(0, 3).map((version) => (
            <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} isPreview />
          ))}
        </div>
      ) : (
        <VersionEmpty />
      )}
    </div>
  );
};

const AuditsSection: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
  audits: AuditTableResponseI;
}> = async ({ teamSlug, projectSlug, audits }) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Audits</h2>
          <a
            href={navigation.project.audits({ teamSlug, projectSlug })}
            className="text-sm text-link hover:text-link-accent transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {audits.results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {audits.results.slice(0, 3).map((audit) => (
            <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
          ))}
        </div>
      ) : (
        <AuditEmpty />
      )}
    </div>
  );
};

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  return (
    <Container>
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
    </Container>
  );
};

export default ProjectPage;
