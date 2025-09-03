import { bevorAction } from "@/actions";
import { AuditElement } from "@/components/audits/element";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { TeamHeader } from "@/components/team/header";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { AsyncComponent, AuditTableResponseI, CodeVersionsResponseI } from "@/utils/types";
import { Shield } from "lucide-react";
import { Suspense } from "react";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamData: AsyncComponent<{ teamSlug: string }> = async ({ teamSlug }) => {
  /* we'll effectively follow a waterfall approach.
    if there are no projects, that means there are no versions or audits.
    if there are no versions, that means there are no audits.
    Follow this logic to waterfall render the overview, as we should only ever show 1 "empty" state.
  */
  const team = await bevorAction.getTeam();
  const projects = await bevorAction.getProjects({ page_size: "3" });

  let versions;
  let audits;
  if (projects.results.length) {
    versions = await bevorAction.getVersions({ page_size: "3" });
  }

  if (versions && versions.results.length) {
    audits = await bevorAction.getAudits({ page_size: "3" });
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="my-4 grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {projects.results.map((project) => (
          <ProjectElement key={project.id} project={project} teamSlug={teamSlug} />
        ))}
      </div>
      {projects.results.length === 0 && <ProjectEmpty team={team} includeCta={true} />}
      <div className="space-y-4">
        {versions && (
          <div>
            <h3 className="mb-2">Recent Versions</h3>
            <VersionsGrid teamSlug={teamSlug} versions={versions} />
          </div>
        )}
        {audits && (
          <div>
            <h3 className="mb-2">Recent Audits</h3>
            <AuditsList teamSlug={teamSlug} audits={audits} />
          </div>
        )}
      </div>
    </div>
  );
};

const VersionsGrid: AsyncComponent<{ teamSlug: string; versions: CodeVersionsResponseI }> = async ({
  teamSlug,
  versions,
}) => {
  return (
    <div className="space-y-3">
      {versions.results.map((version) => (
        <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} />
      ))}
      {versions.results.length === 0 && <VersionEmpty />}
    </div>
  );
};

const AuditsList: AsyncComponent<{
  teamSlug: string;
  audits: AuditTableResponseI;
}> = async ({ teamSlug, audits }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {audits.results.map((audit) => (
        <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
      ))}
    </div>
  );
};

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  return (
    <div className="px-6 py-8 min-h-screen">
      <TeamHeader title="Overview" subTitle="projects, versions, and security analyses" />
      <Suspense>
        <TeamData teamSlug={teamSlug} />
      </Suspense>
    </div>
  );
};

export default TeamPage;
