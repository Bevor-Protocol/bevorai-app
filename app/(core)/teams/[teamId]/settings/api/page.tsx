import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { ApiKeyCreate, ApiKeyTable } from "./api-key-management-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const ApiKeyPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb queryKey={[teamId]} queryType="team-settings" teamId={teamId} id="" />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-row mb-8 justify-between">
          <h3 className="text-foreground">API Keys</h3>
          <ApiKeyCreate teamId={teamId} />
        </div>
        <ApiKeyTable teamId={teamId} />
      </div>
    </Container>
  );
};

export default ApiKeyPage;
