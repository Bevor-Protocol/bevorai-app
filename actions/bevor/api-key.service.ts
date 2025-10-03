import api from "@/lib/api";
import { AuthSchema, CreateKeyBody } from "@/utils/types";

class ApiKeyService {
  async listKeys(): Promise<AuthSchema[]> {
    return api.get("/auth").then((response: any) => {
      return response.data.results;
    });
  }

  async createKey(data: CreateKeyBody): Promise<{ api_key: string }> {
    const scopes = Object.entries(data.permissions).map(([k, v]) => {
      return `${k}.${v}`;
    });
    return api
      .post("/auth", {
        name: data.name,
        scopes,
      })
      .then((response: any) => {
        return response.data;
      });
  }

  async refreshKey(keyId: string): Promise<{ api_key: string }> {
    return api.patch(`/auth/${keyId}`, {}).then((response: any) => {
      return response.data;
    });
  }

  async revokeKey(keyId: string): Promise<boolean> {
    return api.delete(`/auth/${keyId}`).then((response: any) => {
      return response.data.success;
    });
  }
}

const apiKeyService = new ApiKeyService();
export default apiKeyService;
