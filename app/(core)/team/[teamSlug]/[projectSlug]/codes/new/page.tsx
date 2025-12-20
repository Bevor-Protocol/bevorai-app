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
  searchParams: Promise<{ parentId?: string }>;
}

const NewVersionPage: AsyncComponent<VersionPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const project = await projectActions.getProject(
    resolvedParams.teamSlug,
    resolvedParams.projectSlug,
  );

  return (
    <Container subnav={<ProjectSubnav />}>
      <Steps project={project} {...resolvedSearchParams} />
    </Container>
  );
};

export default NewVersionPage;
