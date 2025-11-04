import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import ContainerBreadcrumb from "./breadcrumb";
import Steps from "./new-page-client";

interface VersionPageProps {
  params: Promise<{ teamId: string; projectId: string; versionId: string }>;
}

const NewVersionPage: AsyncComponent<VersionPageProps> = async ({ params }) => {
  const props = await params;

  return (
    <Container
      breadcrumb={<ContainerBreadcrumb teamId={props.teamId} projectId={props.projectId} />}
    >
      <Steps {...props} />
    </Container>
  );
};

export default NewVersionPage;
