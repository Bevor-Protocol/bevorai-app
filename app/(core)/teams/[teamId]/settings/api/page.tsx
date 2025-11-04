import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { ApiKeyCreate, ApiKeyTable } from "./api-key-management-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const ApiKeyPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamId } = await params;
  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">API Keys</h3>
        <ApiKeyCreate teamId={teamId} />
      </div>
      <ApiKeyTable teamId={teamId} />
    </Container>
  );
};

export default ApiKeyPage;
