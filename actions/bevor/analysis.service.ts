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
  DraftSchemaI,
  FindingSchemaI,
  ScopeSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = async (
  teamSlug: string,
  data: createAnalysisFormValues,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post("/analyses", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getLeafs = async (
  teamSlug: string,
  nodeId: string,
): Promise<AnalysisNodeSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/leafs`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getDAG = async (teamSlug: string, nodeId: string): Promise<AnalysisDagSchemaI> => {
  return api
    .get(`/analyses/${nodeId}/dag`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysis = async (
  teamSlug: string,
  nodeId: string,
): Promise<AnalysisNodeSchemaI> => {
  return api
    .get(`/analyses/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisDetailed = async (
  teamSlug: string,
  nodeId: string,
): Promise<AnalysisNodeSchemaI> => {
  return api
    .get(`/analyses/${nodeId}?with_findings=true&with_scopes=true`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getFindings = async (teamSlug: string, nodeId: string): Promise<FindingSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/findings`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const getScopes = async (teamSlug: string, nodeId: string): Promise<ScopeSchemaI[]> => {
  return api
    .get(`/analyses/${nodeId}/scopes`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const updateFindings = async (
  teamSlug: string,
  nodeId: string,
  data: UpdateAnalysisNodeBody,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .patch(`/analyses/${nodeId}/findings`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const submitFindingFeedback = async (
  teamSlug: string,
  nodeId: string,
  findingId: string,
  data: FindingFeedbackBody,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisFindings(nodeId)];
  return api
    .post(`/analyses/${nodeId}/findings/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then(() => {
      return { toInvalidate };
    });
};

export const toggleVisibility = async (
  teamSlug: string,
  nodeId: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analyses(teamSlug), generateQueryKey.analysis(nodeId)];

  return api
    .patch(`/analyses/${nodeId}/visibility`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return {
        toInvalidate,
      };
    });
};

export const getAnalyses = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): Promise<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/analyses?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const forkAnalysis = async (
  teamSlug: string,
  analysisNodeId: string,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post(`/analyses/${analysisNodeId}/fork`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const mergeAnalysis = async (
  teamSlug: string,
  toAnalysisNodeId: string,
  fromAnalysisNodeId: string,
): Promise<{
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
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getDraft = async (teamSlug: string, analysisNodeId: string): Promise<DraftSchemaI> => {
  return api
    .get(`/analyses/${analysisNodeId}/draft`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const commitDraft = async (
  teamSlug: string,
  analysisNodeId: string,
): Promise<{
  id: string;
}> => {
  return api
    .post(
      `/analyses/${analysisNodeId}/draft/commit`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return { id: response.data.id };
    });
};

export const addStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  data: AddAnalysisFindingBody,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(`/analyses/${analysisNodeId}/draft/add`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then(() => {
      return { toInvalidate };
    });
};

export const deleteStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  findingId: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(
      `/analyses/${analysisNodeId}/draft/delete/${findingId}`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then(() => {
      return { toInvalidate };
    });
};

export const updateStagedFinding = async (
  teamSlug: string,
  analysisNodeId: string,
  findingId: string,
  data: AnalysisFindingBody,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisNodeId)];
  return api
    .post(`/analyses/${analysisNodeId}/draft/edit/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then(() => {
      return { toInvalidate };
    });
};
