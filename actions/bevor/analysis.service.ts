"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { AnalysisUpdateMethodEnum } from "@/utils/enums";
import {
  AnalysisHeadFullSchemaI,
  AnalysisPaginationI,
  AnalysisSchemaI,
  AnalysisStatusSchemaI,
  AnalysisVersionMappingSchemaI,
  AnalysisVersionPaginationI,
  FindingSchemaI,
  TreeResponseI,
} from "@/utils/types";

export const createanalysis = async (
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
  return api.post("/analyses", data, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const createanalysisVersion = async (
  teamId: string,
  data: {
    analysis_id: string;
    scopes: string[];
    retain_scope?: boolean;
  },
): Promise<string> => {
  return api
    .post("/analysis-versions", data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const getAnalysis = async (teamId: string, analysisId: string): Promise<AnalysisSchemaI> => {
  return api
    .get(`/analyses/${analysisId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisHead = async (
  teamId: string,
  analysisId: string,
): Promise<AnalysisHeadFullSchemaI> => {
  return api
    .get(`/analyses/${analysisId}/head`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getStatus = async (
  teamId: string,
  analysisId: string,
): Promise<AnalysisStatusSchemaI> => {
  return api
    .get(`/analysis-versions/${analysisId}/status`, { headers: { "bevor-team-id": teamId } })
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
    .post(`/analyses/${analysisId}/feedback`, data, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalyses = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/analyses?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersion = async (
  teamId: string,
  analysisVersionId: string,
): Promise<AnalysisVersionMappingSchemaI> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getScope = async (
  teamId: string,
  analysisVersionId: string,
): Promise<TreeResponseI[]> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}/scope`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};

export const getFindings = async (
  teamId: string,
  analysisVersionId: string,
): Promise<FindingSchemaI[]> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}/findings`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const toggleVisibility = async (teamId: string, analysisId: string): Promise<boolean> => {
  return api
    .patch(`/analyses/${analysisId}/visibility`, {}, { headers: { "bevor-team-id": teamId } })
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
      `/analyses/${analysisId}/method`,
      { update_method: method },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.success;
    });
};

export const getAnalysisVersions = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/analysis-versions?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const updateAnalysisHeads = async (
  teamId: string,
  analysisId: string,
  data: {
    analysis_version_id?: string;
    code_version_id?: string;
  },
): Promise<AnalysisSchemaI> => {
  return api
    .patch(`/analyses/${analysisId}/head`, data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const forkAnalysis = async (teamId: string, versionId: string): Promise<string> => {
  return api
    .post(`/analysis-versions/${versionId}/fork`, {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};
