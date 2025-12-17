"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  CreateAnalysisVersionFormValues,
  FindingFeedbackBody,
  UpdateAnalysisNodeBody,
} from "@/utils/schema";
import {
  AnalysisDagSchemaI,
  AnalysisNodeSchemaI,
  AnalysisStatusSchemaI,
  AnalysisVersionPaginationI,
  DraftFindingSchemaI,
  FindingSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysisVersion = async (
  teamSlug: string,
  data: CreateAnalysisVersionFormValues,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSIS_VERSIONS, teamSlug]];
  return api
    .post("/analysis-nodes", data, { headers: { "bevor-team-slug": teamSlug } })
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
    .get(`/analysis-nodes/${nodeId}/leafs`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getDAG = async (teamSlug: string, nodeId: string): Promise<AnalysisDagSchemaI> => {
  return api
    .get(`/analysis-nodes/${nodeId}/dag`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersion = async (
  teamSlug: string,
  nodeId: string,
): Promise<AnalysisNodeSchemaI> => {
  return api
    .get(`/analysis-nodes/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getScope = async (
  teamSlug: string,
  nodeId: string,
): Promise<AnalysisStatusSchemaI> => {
  return api
    .get(`/analysis-nodes/${nodeId}/scope`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getFindings = async (teamSlug: string, nodeId: string): Promise<FindingSchemaI[]> => {
  return api
    .get(`/analysis-nodes/${nodeId}/findings`, {
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
  const toInvalidate = [[QUERY_KEYS.ANALYSIS_VERSIONS, teamSlug]];
  return api
    .patch(`/analysis-nodes/${nodeId}/findings`, data, {
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
  const toInvalidate = [generateQueryKey.analysisVersionFindings(nodeId)];
  return api
    .post(`/analysis-nodes/${nodeId}/findings/${findingId}`, data, {
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
    .patch(`/analysis-node/${nodeId}/visibility`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return {
        toInvalidate,
      };
    });
};

export const getAnalysisVersions = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): Promise<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/analysis-nodes?${searchParams}`, {
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
  const toInvalidate = [[QUERY_KEYS.ANALYSIS_VERSIONS, teamSlug]];
  return api
    .post(
      `/analysis-nodes/${analysisNodeId}/fork`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getDraft = async (
  teamSlug: string,
  analysisNodeId: string,
): Promise<DraftFindingSchemaI[]> => {
  return api
    .get(`/analysis-nodes/${analysisNodeId}/draft`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
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
      `/analysis-nodes/${analysisNodeId}/draft/commit`,
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
  const toInvalidate = [generateQueryKey.analysisVersionDraft(analysisNodeId)];
  return api
    .post(`/analysis-nodes/${analysisNodeId}/draft/stage/add`, data, {
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
  const toInvalidate = [generateQueryKey.analysisVersionDraft(analysisNodeId)];
  return api
    .post(
      `/analysis-nodes/${analysisNodeId}/draft/stage/delete/${findingId}`,
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
  const toInvalidate = [generateQueryKey.analysisVersionDraft(analysisNodeId)];
  return api
    .post(`/analysis-nodes/${analysisNodeId}/draft/stage/edit/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then(() => {
      return { toInvalidate };
    });
};
