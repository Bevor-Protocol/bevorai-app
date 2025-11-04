"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { AnalysisUpdateMethodEnum } from "@/utils/enums";
import {
  AnalysisPaginationI,
  AnalysisSchemaI,
  AnalysisStatusSchemaI,
  AnalysisVersionPaginationI,
  AnalysisVersionSchemaI,
  TreeResponseI,
} from "@/utils/types";

export const createSecurityAnalysis = async (
  teamId: string,
  data: {
    code_project_id: string;
    name?: string;
    description?: string;
    is_public?: boolean;
  },
): Promise<{
  id: string;
  status: string;
}> => {
  return api
    .post("/security-analyses", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const createSecurityAnalysisVersion = async (
  teamId: string,
  data: {
    security_analysis_id: string;
    scopes: string[];
    retain_scope?: boolean;
  },
): Promise<string> => {
  return api
    .post("/security-versions", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const getSecurityAnalysis = async (
  teamId: string,
  analysisId: string,
): Promise<AnalysisSchemaI> => {
  return api
    .get(`/security-analyses/${analysisId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getFindings = async (
  teamId: string,
  analysisId: string,
): Promise<AnalysisVersionSchemaI> => {
  return api
    .get(`/security-analyses/${analysisId}/findings`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getStatus = async (
  teamId: string,
  analysisId: string,
): Promise<AnalysisStatusSchemaI> => {
  return api
    .get(`/security-versions/${analysisId}/status`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const submitFeedback = async (
  teamId: string,
  analysisId: string,
  data: {
    feedback?: string;
    verified?: boolean;
  },
): Promise<{ success: boolean }> => {
  return api
    .post(`/security-analyses/${analysisId}/feedback`, data, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getSecurityAnalyses = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/security-analyses?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getSecurityAnalysisVersion = async (
  teamId: string,
  analysisVersionId: string,
): Promise<AnalysisVersionSchemaI> => {
  return api
    .get(`/security-versions/${analysisVersionId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getScope = async (
  teamId: string,
  analysisVersionId: string,
): Promise<TreeResponseI[]> => {
  return api
    .get(`/security-versions/${analysisVersionId}/scope`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};

export const toggleVisibility = async (teamId: string, analysisId: string): Promise<boolean> => {
  return api
    .patch(
      `/security-analyses/${analysisId}/visibility`,
      {},
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.success;
    });
};

export const updateMethod = async (
  teamId: string,
  analysisId: string,
  method: AnalysisUpdateMethodEnum,
): Promise<boolean> => {
  return api
    .patch(
      `/security-analyses/${analysisId}/method`,
      { update_method: method },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.success;
    });
};

export const getSecurityVersions = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/security-versions?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const updateAnalysisHeads = async (
  teamId: string,
  analysisId: string,
  data: {
    security_analysis_version_id?: string;
    code_version_id?: string;
  },
): Promise<AnalysisSchemaI> => {
  return api
    .patch(`/security-analyses/${analysisId}/head`, data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const forkAnalysis = async (teamId: string, versionId: string): Promise<string> => {
  return api
    .post(`/security-versions/${versionId}/fork`, {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};
