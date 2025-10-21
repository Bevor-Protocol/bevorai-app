import { bevorAction } from "@/actions";
import Container from "@/components/container";
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
    <Container>
      <div className="border-b border-b-border py-4">
        <h1>Settings</h1>
      </div>
      <div className="flex flex-row py-10 gap-10">
        <div className="grow">
          <ProjectSettingsPageClient teamSlug={teamSlug} project={project} isUpdated={!!updated} />
        </div>
      </div>
    </Container>
  );
};

export default ProjectSettingsPage;
