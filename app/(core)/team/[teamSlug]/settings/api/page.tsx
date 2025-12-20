import { AsyncComponent } from "@/utils/types";
import { ApiKeyCreate, ApiKeyTable } from "./api-key-management-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
}

const ApiKeyPage: AsyncComponent<PageProps> = async ({ params }) => {
  const { teamSlug } = await params;
  return (
    <>
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">API Keys</h3>
        <ApiKeyCreate teamSlug={teamSlug} />
      </div>
      <ApiKeyTable teamSlug={teamSlug} />
    </>
  );
};

export default ApiKeyPage;
