import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
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

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.projectSlug]}
          queryType="project-new-code"
          teamSlug={resolvedParams.teamSlug}
          id={resolvedParams.projectSlug}
        />
      }
    >
      <Steps {...resolvedParams} />
    </Container>
  );
};

export default NewVersionPage;
