import api from "@/lib/api";
import {
  AuditFindingsResponseI,
  AuditSchemaI,
  AuditStatusResponseI,
  AuditTableReponseI,
  TreeResponseI,
} from "@/utils/types";

class AuditService {
  async initiateAudit(
    versionId: string,
    scopes: { identifier: string; level: string }[],
  ): Promise<{
    id: string;
    status: string;
  }> {
    return api
      .post("/audits", {
        version_mapping_id: versionId,
        scopes,
      })
      .then((response) => {
        return response.data;
      });
  }

  async getAudit(auditId: string): Promise<AuditSchemaI> {
    return api.get(`/audits/${auditId}`).then((response) => {
      return response.data;
    });
  }

  async getAuditFindings(auditId: string): Promise<AuditFindingsResponseI> {
    return api.get(`/audits/${auditId}/findings`).then((response) => {
      return response.data;
    });
  }

  async getAuditStatus(id: string): Promise<AuditStatusResponseI> {
    return api.get(`/audits/${id}/status`).then((response) => {
      return response.data;
    });
  }

  async submitFeedback(
    id: string,
    feedback?: string,
    verified?: boolean,
  ): Promise<{ success: boolean }> {
    return api.post(`/audits/${id}/feedback`, { feedback, verified }).then((response) => {
      return response.data;
    });
  }

  async getAudits(filters: { [key: string]: string }): Promise<AuditTableReponseI> {
    const searchParams = new URLSearchParams(filters);
    searchParams.set("status", "success");
    searchParams.set("page_size", filters.page_size ?? "9");

    return api
      .get(`/audits?${searchParams.toString()}`)
      .then((response) => {
        return response.data;
      })
      .catch((err) => console.log(err));
  }

  async getAuditScope(auditId: string): Promise<TreeResponseI[]> {
    return api.get(`/audits/${auditId}/scope`).then((response) => {
      return response.data.results;
    });
  }
}

const auditService = new AuditService();
export default auditService;
