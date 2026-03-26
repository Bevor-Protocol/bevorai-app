"use server";

import { securityApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  AnalysisDagSchema,
  AnalysisNodeIndex,
  AnalysisNodeSchema,
  DraftSchema,
  FindingSchema,
  ScopeSchema,
} from "@/types/api/responses/security";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  createAnalysisFormValues,
  FindingFeedbackBody,
  UpdateAnalysisNodeBody,
} from "@/utils/schema";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = async (
  teamSlug: string,
  data: createAnalysisFormValues,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return securityApi
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
): ApiResponse<AnalysisNodeSchema[]> => {
  return securityApi
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

export const getDAG = async (teamSlug: string, nodeId: string): ApiResponse<AnalysisDagSchema> => {
  return securityApi
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
): ApiResponse<AnalysisNodeSchema> => {
  return securityApi
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
): ApiResponse<AnalysisNodeSchema> => {
  return securityApi
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
): ApiResponse<FindingSchema[]> => {
  return securityApi
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

export const getScopes = async (teamSlug: string, nodeId: string): ApiResponse<ScopeSchema[]> => {
  return securityApi
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
  return securityApi
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
  return securityApi
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

  return securityApi
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
): ApiResponse<Pagination<AnalysisNodeIndex>> => {
  const searchParams = buildSearchParams(filters);
  return securityApi
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
  return securityApi
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
  return securityApi
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
): ApiResponse<DraftSchema> => {
  return securityApi
    .get(`/drafts/${analysisNodeId}`, { headers: { "bevor-team-slug": teamSlug } })
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
  return securityApi
    .post(`/drafts/${analysisNodeId}/commit`, {}, { headers: { "bevor-team-slug": teamSlug } })
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
  return securityApi
    .post(`/drafts/${analysisNodeId}/add`, data, {
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
  return securityApi
    .post(
      `/drafts/${analysisNodeId}/delete/${findingId}`,
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
  return securityApi
    .post(`/drafts/${analysisNodeId}/edit/${findingId}`, data, {
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
