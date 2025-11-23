"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { CreateAnalysisThreadFormValues, CreateAnalysisVersionFormValues } from "@/utils/schema";
import {
  AnalysisMappingSchemaI,
  AnalysisPaginationI,
  AnalysisSchemaI,
  AnalysisStatusSchemaI,
  AnalysisVersionPaginationI,
  CodeMappingSchemaI,
  FindingSchemaI,
  RecentAnalysisSchemaI,
  TreeResponseI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = async (
  teamSlug: string,
  data: CreateAnalysisThreadFormValues,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return api
    .post("/analysis-threads", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const createAnalysisVersion = async (
  teamSlug: string,
  data: CreateAnalysisVersionFormValues,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSIS_VERSIONS, teamSlug]];
  return api
    .post("/analysis-versions", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getAnalysis = async (
  teamSlug: string,
  analysisId: string,
): Promise<AnalysisSchemaI> => {
  return api
    .get(`/analysis-threads/${analysisId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisRecentVersion = async (
  teamSlug: string,
  analysisId: string,
): Promise<RecentAnalysisSchemaI> => {
  return api
    .get(`/analysis-threads/${analysisId}/recent/analysis-version`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisRecentCodeVersion = async (
  teamSlug: string,
  analysisId: string,
): Promise<CodeMappingSchemaI | null> => {
  return api
    .get(`/analysis-threads/${analysisId}/recent/code-version`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.analysis_version;
    });
};

export const getStatus = async (
  teamSlug: string,
  analysisId: string,
): Promise<AnalysisStatusSchemaI> => {
  return api
    .get(`/analysis-versions/${analysisId}/status`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const submitFeedback = async (
  teamSlug: string,
  analysisId: string,
  data: {
    feedback?: string;
    verified?: boolean;
  },
): Promise<{ success: boolean }> => {
  return api
    .post(`/analysis-threads/${analysisId}/feedback`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalyses = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): Promise<AnalysisPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/analysis-threads?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersion = async (
  teamSlug: string,
  analysisVersionId: string,
): Promise<AnalysisMappingSchemaI> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getScope = async (
  teamSlug: string,
  analysisVersionId: string,
): Promise<TreeResponseI[]> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}/scope`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const getFindings = async (
  teamSlug: string,
  analysisVersionId: string,
): Promise<FindingSchemaI[]> => {
  return api
    .get(`/analysis-versions/${analysisVersionId}/findings`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const toggleVisibility = async (
  teamSlug: string,
  analysisId: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.analyses(teamSlug), generateQueryKey.analysis(analysisId)];

  return api
    .patch(
      `/analysis-threads/${analysisId}/visibility`,
      {},
      { headers: { "bevor-team-slug": teamSlug } },
    )
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
    .get(`/analysis-versions?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const forkAnalysis = async (
  teamSlug: string,
  codeId: string,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSIS_VERSIONS, teamSlug]];
  return api
    .post(`/analysis-versions/${codeId}/fork`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};
