import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { CodeVersionElement, CodeVersionElementLoader } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { AsyncComponent } from "@/utils/types";
import React, { Suspense } from "react";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const VersionsGrid: AsyncComponent<{ teamSlug: string; projectSlug: string }> = async ({
  teamSlug,
  projectSlug,
}) => {
  const project = await bevorAction.getProjectBySlug(projectSlug);
  const versions = await bevorAction.getVersions({ page_size: "9", project_id: project.id });

  return (
    <div className="space-y-3">
      {versions.results.map((version) => (
        <CodeVersionElement key={version.id} version={version} teamSlug={teamSlug} />
      ))}
      {versions.results.length === 0 && <VersionEmpty centered />}
    </div>
  );
};

const CodeVersionsLoading: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <CodeVersionElementLoader key={index} />
    ))}
  </div>
);

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  return (
    <>
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} />
      <div className="px-6 py-8 bg-neutral-950 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<CodeVersionsLoading />}>
            <VersionsGrid teamSlug={teamSlug} projectSlug={projectSlug} />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default ProjectVersionsPage;
