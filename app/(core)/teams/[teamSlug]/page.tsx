import { bevorAction } from "@/actions";
import { AuditElement } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { TeamHeader } from "@/components/team/header";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { navigation } from "@/utils/navigation";
import { AsyncComponent, AuditTableResponseI, CodeVersionsResponseI } from "@/utils/types";
import { Suspense } from "react";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const TeamData: AsyncComponent<{ teamSlug: string }> = async ({ teamSlug }) => {
  const team = await bevorAction.getTeam();
  const projects = await bevorAction.getProjects({ page_size: "3" });

  const versions = await bevorAction.getVersions({ page_size: "3" });
  const audits = await bevorAction.getAudits({ page_size: "3" });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {versions && <VersionsPreview teamSlug={teamSlug} versions={versions} />}
          {audits && <AuditsPreview teamSlug={teamSlug} audits={audits} />}
        </div>

        <div className="xl:col-span-3">
          <ProjectsSection team={team} projects={projects} teamSlug={teamSlug} />
        </div>
      </div>
    </div>
  );
};

const ProjectsSection: AsyncComponent<{
  team: any;
  projects: { results: any[] };
  teamSlug: string;
}> = async ({ team, projects, teamSlug }) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-100">Projects</h2>
          <a
            href={navigation.team.projects({ teamSlug })}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {projects.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.results.map((project) => (
            <ProjectElement key={project.id} project={project} teamSlug={teamSlug} />
          ))}
        </div>
      ) : (
        <ProjectEmpty team={team} includeCta={true} />
      )}
    </div>
  );
};

const VersionsPreview: AsyncComponent<{
  teamSlug: string;
  versions: CodeVersionsResponseI;
}> = async ({ teamSlug, versions }) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-neutral-100">Recent Versions</h3>
          <a
            href={navigation.team.versions({ teamSlug })}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {versions.results.length > 0 ? (
        <div className="space-y-3">
          {versions.results.map((version) => (
            <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} isPreview />
          ))}
        </div>
      ) : (
        <VersionEmpty />
      )}
    </div>
  );
};

const AuditsPreview: AsyncComponent<{
  teamSlug: string;
  audits: AuditTableResponseI;
}> = async ({ teamSlug, audits }) => {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-neutral-100">Recent Audits</h3>
          <a
            href={navigation.team.audits({ teamSlug })}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {audits.results.length > 0 ? (
        <div className="space-y-3">
          {audits.results.map((audit) => (
            <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
          ))}
        </div>
      ) : (
        <AuditEmpty />
      )}
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
