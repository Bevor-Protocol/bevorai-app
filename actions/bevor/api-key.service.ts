import api from "@/lib/api";
import { AuthSchema } from "@/utils/types";

class ApiKeyService {
  async listKeys(): Promise<AuthSchema[]> {
    return api.get("/auth").then((response: any) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async createKey(data: { name: string }): Promise<{ api_key: string }> {
    return api.post("/auth", data).then((response: any) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async refreshKey(keyId: string): Promise<{ api_key: string }> {
    return api.patch(`/auth/${keyId}`, {}).then((response: any) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async revokeKey(keyId: string): Promise<boolean> {
    return api.delete(`/auth/${keyId}`).then((response: any) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.success;
    });
  }
}

const apiKeyService = new ApiKeyService();
export default apiKeyService;
