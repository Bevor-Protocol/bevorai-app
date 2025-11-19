import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { ApiKeyCreate, ApiKeyTable } from "./api-key-management-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const ApiKeyPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[teamSlug]}
          queryType="team-settings"
          teamSlug={teamSlug}
          id=""
        />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-row mb-8 justify-between">
          <h3 className="text-foreground">API Keys</h3>
          <ApiKeyCreate teamSlug={teamSlug} />
        </div>
        <ApiKeyTable teamSlug={teamSlug} />
      </div>
    </Container>
  );
};

export default ApiKeyPage;
