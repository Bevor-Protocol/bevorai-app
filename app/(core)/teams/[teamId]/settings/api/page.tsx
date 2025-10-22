import {
  ApiKeyCreate,
  ApiKeyTable,
} from "@/app/(core)/teams/[teamId]/settings/api/api-key-management-client";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";

const ApiKeyPage: AsyncComponent = async () => {
  return (
    <Container>
      <div className="flex flex-row mb-8 justify-between">
        <h3 className="text-foreground">API Keys</h3>
        <ApiKeyCreate />
      </div>
      <ApiKeyTable />
    </Container>
  );
};

export default ApiKeyPage;
