import api from "@/lib/api";
import {
  AppSearchResponseI,
  AuditResponseI,
  AuditStatusResponseI,
  AuditTableReponseI,
  AuditWithChildrenResponseI,
  ChatMessagesResponseI,
  ChatResponseI,
  ChatWithAuditResponseI,
  ContractResponseI,
  ContractSourceResponseI,
  ContractVersionI,
  CreditSyncResponseI,
  FunctionChunkResponseI,
  MultiTimeseriesResponseI,
  PromptResponseI,
  StatsResponseI,
  TimeseriesResponseI,
  TreeResponseI,
  UserInfoResponseI,
  UserSearchResponseI,
  UserTimeseriesResponseI,
} from "@/utils/types";

class BevorService {
  async isAdmin(userId: string): Promise<boolean> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .get("/admin/status", headers)
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data.success;
      })
      .catch((error) => {
        console.log(error);
        return false;
      });
  }

  async searchUsers(identifier: string, userId: string): Promise<UserSearchResponseI[]> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/admin/search/user?identifier=${identifier}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async searchApps(identifier: string, userId: string): Promise<AppSearchResponseI[]> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/admin/search/app?identifier=${identifier}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async getAuditWithChildren(id: string, userId: string): Promise<AuditWithChildrenResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/admin/audit/${id}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async updateUserPermissions({
    toUpdateId,
    userId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    userId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }): Promise<boolean> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .post(
        `/admin/permissions/user/${toUpdateId}`,
        {
          can_create_app: canCreateApp,
          can_create_api_key: canCreateApiKey,
        },
        headers,
      )
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data.status;
      });
  }

  async updateAppPermissions({
    toUpdateId,
    userId,
    canCreateApp,
    canCreateApiKey,
  }: {
    toUpdateId: string;
    userId: string;
    canCreateApp: boolean;
    canCreateApiKey: boolean;
  }): Promise<boolean> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .post(
        `/admin/permissions/app/${toUpdateId}`,
        {
          can_create_app: canCreateApp,
          can_create_api_key: canCreateApiKey,
        },
        headers,
      )
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data.status;
      });
  }

  async initiateAudit(
    projectId: string,
    versionId: string,
    scopes: { identifier: string; level: string }[],
    userId: string,
  ): Promise<{
    id: string;
    status: string;
  }> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .post(
        "/audit",
        {
          code_project_id: projectId,
          code_version_id: versionId,
          scopes,
        },
        headers,
      )
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data;
      });
  }

  async getAudit(id: string): Promise<AuditResponseI> {
    return api.get(`/audit/${id}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getAuditStatus(id: string): Promise<AuditStatusResponseI> {
    return api.get(`/audit/${id}/status`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async syncCredits(userId: string): Promise<CreditSyncResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.post("/auth/sync/credits", {}, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadFolder(
    fileMap: Record<string, File>,
    userId: string,
  ): Promise<ContractResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    const formData = new FormData();
    Object.entries(fileMap).forEach(([relativePath, file]) => {
      formData.append("files", file, relativePath);
    });

    return api.post("/contract/folder", formData, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadFile(file: File, userId: string): Promise<ContractResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    const formData = new FormData();
    formData.append("file", file);

    return api.post("/contract/file", formData, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadScan(address: string, userId: string): Promise<ContractResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.post("/contract/scan", { address }, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async contractUploadPaste(code: string, userId: string): Promise<ContractResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.post("/contract/paste", { code }, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractVersion(versionId: string, userId: string): Promise<ContractVersionI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/contract/version/${versionId}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractTree(versionId: string, userId: string): Promise<TreeResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/contract/version/${versionId}/tree`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getContractSources(versionId: string, userId: string): Promise<ContractSourceResponseI[]> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/contract/version/${versionId}/sources`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getFunctionChunk(functionId: string, userId: string): Promise<FunctionChunkResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/contract/function/${functionId}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async submitFeedback(
    id: string,
    userId: string,
    feedback?: string,
    verified?: boolean,
  ): Promise<{ success: boolean }> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.post(`/audit/${id}/feedback`, { feedback, verified }, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getCurrentGas(userId: string): Promise<number> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.post("/blockchain/gas", {}, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getAudits(filters: { [key: string]: string }): Promise<AuditTableReponseI> {
    const searchParams = new URLSearchParams(filters);
    searchParams.set("status", "success");
    return api
      .get(`/audit/list?${searchParams.toString()}`)
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data;
      })
      .catch((err) => console.log(err));
  }

  async getStats(): Promise<StatsResponseI> {
    return api.get("/platform/stats").then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getTimeseriesAudits(): Promise<TimeseriesResponseI> {
    return api.get("/summary/audits").then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getTimeseriesContracts(): Promise<TimeseriesResponseI> {
    return api.get("/summary/contracts").then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getTimeseriesUsers(): Promise<TimeseriesResponseI> {
    return api.get("/summary/users").then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getTimeseriesFindings(type: string): Promise<MultiTimeseriesResponseI> {
    return api.get(`/summary/findings/${type}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getUserInfo(userId: string): Promise<UserInfoResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.get("/user/info", headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getUserTimeSeries(userId: string): Promise<UserTimeseriesResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.get("/user/timeseries", headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async generateApiKey(type: "user" | "app", userId: string): Promise<string> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.post(`/auth/${type}`, {}, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.api_key;
    });
  }

  async generateApp(name: string, userId: string): Promise<string> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.post("/app", { name }, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async updateApp(name: string, userId: string): Promise<string> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };
    return api.patch("/app", { name }, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getPrompts(userId: string): Promise<PromptResponseI[]> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get("/admin/prompts", headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async initiateChat(userId: string, auditId: string): Promise<ChatResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.post(`/chat/initiate/${auditId}`, {}, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getChats(userId: string): Promise<ChatWithAuditResponseI[]> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get("/chat/list", headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data.results;
    });
  }

  async getChat(userId: string, chatId: string): Promise<ChatMessagesResponseI> {
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api.get(`/chat/${chatId}`, headers).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async updatePrompt(data: {
    userId: string;
    promptId: string;
    tag?: string;
    content?: string;
    version?: string;
    is_active?: boolean;
  }): Promise<boolean> {
    const { userId, promptId, ...rest } = data;
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .patch(
        `/admin/prompt/${promptId}`,
        {
          ...rest,
        },
        headers,
      )
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data.success;
      });
  }

  async addPrompt(data: {
    userId: string;
    audit_type: string;
    tag: string;
    content: string;
    version: string;
    is_active?: boolean;
  }): Promise<string> {
    const { userId, ...rest } = data;
    const headers = {
      headers: {
        "Bevor-User-Identifier": userId,
      },
    };

    return api
      .post(
        "/admin/prompt",
        {
          ...rest,
        },
        headers,
      )
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return response.data.id;
      });
  }
}

const bevorService = new BevorService();
export default bevorService;
