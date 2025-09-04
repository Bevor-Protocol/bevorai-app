import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import ProjectSettingsPageClient from "./client";

interface ProjectSettingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectSettingsPage: AsyncComponent<ProjectSettingsPageProps> = async ({
  searchParams,
  params,
}) => {
  const { updated } = await searchParams;
  const { teamSlug, projectSlug } = await params;
  const project = await bevorAction.getProjectBySlug(projectSlug);

  return (
    <div className="flex flex-col max-w-6xl m-auto">
      <div className="border-b border-b-neutral-800 py-10">
        <h1>Settings</h1>
      </div>
      <div className="flex flex-row py-10 gap-10">
        <div className="grow">
          <ProjectSettingsPageClient teamSlug={teamSlug} project={project} isUpdated={!!updated} />
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsPage;
