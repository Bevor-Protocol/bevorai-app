import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { AsyncComponent } from "@/utils/types";
import Steps from "./new-page-client";

interface ResolvedParams {
  teamSlug: string;
  projectSlug: string;
}

interface VersionPageProps {
  params: Promise<ResolvedParams>;
}

const NewVersionPage: AsyncComponent<VersionPageProps> = async ({ params }) => {
  const resolvedParams = await params;

  const project = await projectActions.getProject(
    resolvedParams.teamSlug,
    resolvedParams.projectSlug,
  );

  return (
    <Container subnav={<ProjectSubnav />}>
      <Steps project={project} />
    </Container>
  );
};

export default NewVersionPage;
