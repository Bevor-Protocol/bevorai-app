import { AsyncComponent } from "@/utils/types";
import ApiKeyManagementClient from "./api-key-management-client";

const ApiKeyPage: AsyncComponent = async () => {
  return <ApiKeyManagementClient />;
};

export default ApiKeyPage;
