import api from "@/lib/api";
import {
  AppSearchResponseI,
  AuditWithChildrenResponseI,
  PromptResponseI,
  UserSearchResponseI,
} from "@/utils/types";

class AdminService {
  async isAdmin(): Promise<boolean> {
    return api
      .get("/admin/status")
      .then((response) => {
        return response.data.success;
      })
      .catch((error) => {
        console.log(error);
        return false;
      });
  }

  async searchUsers(identifier: string): Promise<UserSearchResponseI[]> {
    return api.get(`/admin/search/user?identifier=${identifier}`).then((response) => {
      return response.data.results;
    });
  }

  async searchApps(identifier: string): Promise<AppSearchResponseI[]> {
    return api.get(`/admin/search/app?identifier=${identifier}`).then((response) => {
      return response.data.results;
    });
  }

  async getAuditWithChildren(id: string): Promise<AuditWithChildrenResponseI> {
    return api.get(`/admin/audit/${id}`).then((response) => {
      return response.data;
    });
  }

  async updateUserPermissions({
    toUpdateId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }): Promise<boolean> {
    return api
      .post(`/admin/permissions/user/${toUpdateId}`, {
        can_create_app: canCreateApp,
        can_create_api_key: canCreateApiKey,
      })
      .then((response) => {
        return response.data.status;
      });
  }

  async updateAppPermissions({
    toUpdateId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }): Promise<boolean> {
    return api
      .post(`/admin/permissions/app/${toUpdateId}`, {
        can_create_app: canCreateApp,
        can_create_api_key: canCreateApiKey,
      })
      .then((response) => {
        return response.data.status;
      });
  }

  async getPrompts(): Promise<PromptResponseI[]> {
    return api.get("/admin/prompts").then((response) => {
      return response.data.results;
    });
  }

  async updatePrompt(data: {
    promptId: string;
    tag?: string;
    content?: string;
    version?: string;
    is_active?: boolean;
  }): Promise<boolean> {
    const { promptId, ...rest } = data;

    return api
      .patch(`/admin/prompt/${promptId}`, {
        ...rest,
      })
      .then((response) => {
        return response.data.success;
      });
  }

  async addPrompt(data: {
    audit_type: string;
    tag: string;
    content: string;
    version: string;
    is_active?: boolean;
  }): Promise<string> {
    return api
      .post("/admin/prompt", {
        ...data,
      })
      .then((response) => {
        return response.data.id;
      });
  }
}

const adminService = new AdminService();
export default adminService;
