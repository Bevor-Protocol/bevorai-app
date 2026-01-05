"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  createAnalysisFormValues,
  FindingFeedbackBody,
  UpdateAnalysisNodeBody,
} from "@/utils/schema";
import {
  AnalysisDagSchemaI,
  AnalysisNodeSchemaI,
  AnalysisVersionPaginationI,
  ApiResponse,
  DraftSchemaI,
  FindingSchemaI,
  ScopeSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = async (
  teamSlug: string,
  data: createAnalysisFormValues,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post("/analyses", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getLeafs = async (
  teamSlug: string,
  nodeId: string,
): ApiResponse<AnalysisNodeSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/leafs`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getDAG = async (teamSlug: string, nodeId: string): ApiResponse<AnalysisDagSchemaI> => {
  return api
    .get(`/analyses/${nodeId}/dag`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getAnalysis = async (
  teamSlug: string,
  nodeId: string,
): ApiResponse<AnalysisNodeSchemaI> => {
  return api
    .get(`/analyses/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getAnalysisDetailed = async (
  teamSlug: string,
  nodeId: string,
): ApiResponse<AnalysisNodeSchemaI> => {
  return api
    .get(`/analyses/${nodeId}?with_findings=true&with_scopes=true`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getFindings = async (
  teamSlug: string,
  nodeId: string,
): ApiResponse<FindingSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/findings`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getScopes = async (teamSlug: string, nodeId: string): ApiResponse<ScopeSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/scopes`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateFindings = async (
  teamSlug: string,
  nodeId: string,
  data: UpdateAnalysisNodeBody,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .patch(`/analyses/${nodeId}/findings`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const submitFindingFeedback = async (
  teamSlug: string,
  nodeId: string,
  findingId: string,
  data: FindingFeedbackBody,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisFindings(nodeId)];
  return api
    .post(`/analyses/${nodeId}/findings/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const toggleVisibility = async (
  teamSlug: string,
  nodeId: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analyses(teamSlug), generateQueryKey.analysis(nodeId)];

  return api
    .patch(`/analyses/${nodeId}/visibility`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getAnalyses = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): ApiResponse<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/analyses?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const forkAnalysis = async (
  teamSlug: string,
  analysisNodeId: string,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post(`/analyses/${analysisNodeId}/fork`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const mergeAnalysis = async (
  teamSlug: string,
  toAnalysisNodeId: string,
  fromAnalysisNodeId: string,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post(
      `/analyses/${toAnalysisNodeId}/merge`,
      { from_analysis_node_id: fromAnalysisNodeId },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getDraft = async (
  teamSlug: string,
  analysisNodeId: string,
): ApiResponse<DraftSchemaI> => {
  return api
    .get(`/analyses/${analysisNodeId}/draft`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const commitDraft = async (
  teamSlug: string,
  analysisNodeId: string,
): ApiResponse<{
  id: string;
}> => {
  return api
    .post(
      `/analyses/${analysisNodeId}/draft/commit`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { id: response.data.id },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const addStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  data: AddAnalysisFindingBody,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(`/analyses/${analysisNodeId}/draft/add`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const deleteStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  findingId: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(
      `/analyses/${analysisNodeId}/draft/delete/${findingId}`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      console.log(error);
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  findingId: string,
  data: AnalysisFindingBody,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(`/analyses/${analysisNodeId}/draft/edit/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};
