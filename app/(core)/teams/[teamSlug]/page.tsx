import { bevorAction } from "@/actions";
import { AuditElement } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import { ProjectElement } from "@/components/projects/element";
import { ProjectEmpty } from "@/components/projects/empty";
import { TeamHeader } from "@/components/team/header";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { Suspense } from "react";

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

const ProjectsSection: AsyncComponent<{
  team: any;
}> = async ({ team }) => {
  const projects = await bevorAction.getProjects({ page_size: "3" });

  if (projects.results.length === 0) {
    return <ProjectEmpty team={team} includeCta={true} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.results.map((project) => (
        <ProjectElement key={project.id} project={project} teamSlug={team.slug} />
      ))}
    </div>
  );
};

const VersionsPreview: AsyncComponent<{
  teamSlug: string;
}> = async ({ teamSlug }) => {
  const versions = await bevorAction.getVersions({ page_size: "3" });

  if (versions.results.length === 0) {
    return <VersionEmpty />;
  }

  return (
    <div className="space-y-3">
      {versions.results.map((version) => (
        <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} isPreview />
      ))}
    </div>
  );
};

const AuditsPreview: AsyncComponent<{
  teamSlug: string;
}> = async ({ teamSlug }) => {
  const audits = await bevorAction.getAudits({ page_size: "3" });

  if (audits.results.length === 0) {
    return <AuditEmpty />;
  }

  return (
    <div className="space-y-3">
      {audits.results.map((audit) => (
        <AuditElement key={audit.id} audit={audit} teamSlug={teamSlug} />
      ))}
    </div>
  );
};

const TeamPage: AsyncComponent<TeamPageProps> = async ({ params }) => {
  const { teamSlug } = await params;

  const team = await bevorAction.getTeam();

  return (
    <div className="max-w-6xl m-auto">
      <TeamHeader title="Overview" subTitle="projects, versions, and security analyses" />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-medium text-neutral-100">Recent Audits</h3>
              <a
                href={navigation.team.audits({ teamSlug })}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all →
              </a>
            </div>
            <Suspense>
              <VersionsPreview teamSlug={teamSlug} />
            </Suspense>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-medium text-neutral-100">Recent Audits</h3>
              <a
                href={navigation.team.audits({ teamSlug })}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all →
              </a>
            </div>
            <Suspense>
              <AuditsPreview teamSlug={teamSlug} />
            </Suspense>
          </div>
        </div>
        <div className="xl:col-span-3">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-100">Projects</h2>
              <a
                href={navigation.team.projects({ teamSlug: team.slug })}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all →
              </a>
            </div>
            <Suspense>
              <ProjectsSection team={team} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
