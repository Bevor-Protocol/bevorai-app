import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import ProjectSettingsPageClient from "./client";

interface ProjectSettingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectSettingsPage: AsyncComponent<ProjectSettingsPageProps> = async ({
  searchParams,
  params,
}) => {
  const { updated } = await searchParams;
  const { teamId, projectId } = await params;
  const project = await projectActions.getProject(projectId);

  return (
    <Container>
      <div className="border-b border-b-border py-4">
        <h1>Settings</h1>
      </div>
      <div className="flex flex-row py-10 gap-10">
        <div className="grow">
          <ProjectSettingsPageClient teamId={teamId} project={project} isUpdated={!!updated} />
        </div>
      </div>
    </Container>
  );
};

export default ProjectSettingsPage;
