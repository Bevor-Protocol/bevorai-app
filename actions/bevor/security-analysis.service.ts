import api from "@/lib/api";
import {
  AuditFindingsResponseI,
  AuditSchemaI,
  AuditStatusResponseI,
  AuditTableResponseI,
  TreeResponseI,
} from "@/utils/types";

class AuditService {
  async initiateSecurityAnalysis(
    versionId: string,
    scopes: { identifier: string; level: string }[],
  ): Promise<{
    id: string;
    status: string;
  }> {
    return api
      .post("/security-analyses", {
        version_mapping_id: versionId,
        scopes,
      })
      .then((response) => {
        return response.data;
      });
  }

  async getSecurityAnalysis(auditId: string): Promise<AuditSchemaI> {
    return api.get(`/security-analyses/${auditId}`).then((response) => {
      return response.data;
    });
  }

  async getFindings(auditId: string): Promise<AuditFindingsResponseI> {
    return api.get(`/security-analyses/${auditId}/findings`).then((response) => {
      return response.data;
    });
  }

  async getStatus(id: string): Promise<AuditStatusResponseI> {
    return api.get(`/security-analyses/${id}/status`).then((response) => {
      return response.data;
    });
  }

  async submitFeedback(
    id: string,
    feedback?: string,
    verified?: boolean,
  ): Promise<{ success: boolean }> {
    return api
      .post(`/security-analyses/${id}/feedback`, { feedback, verified })
      .then((response) => {
        return response.data;
      });
  }

  async getSecurityAnalyses(filters: { [key: string]: string }): Promise<AuditTableResponseI> {
    const searchParams = new URLSearchParams(filters);
    searchParams.set("status", "success");
    searchParams.set("page_size", filters.page_size ?? "9");

    return api
      .get(`/security-analyses?${searchParams.toString()}`)
      .then((response) => {
        return response.data;
      })
      .catch((err) => console.log(err));
  }

  async getScope(auditId: string): Promise<TreeResponseI[]> {
    return api.get(`/security-versions/${auditId}/scope`).then((response) => {
      return response.data.results;
    });
  }

  async toggleVisibility(auditId: string): Promise<boolean> {
    return api.patch(`/security-analyses/${auditId}/visibility`, {}).then((response) => {
      return response.data.success;
    });
  }
}

const auditService = new AuditService();
export default auditService;
