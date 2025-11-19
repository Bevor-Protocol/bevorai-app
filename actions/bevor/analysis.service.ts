"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { CreateAnalysisVersionFormValues } from "@/utils/schema";
import {
  AnalysisPaginationI,
  AnalysisSchemaI,
  AnalysisStatusSchemaI,
  AnalysisVersionMappingSchemaI,
  AnalysisVersionPaginationI,
  CodeVersionMappingSchemaI,
  FindingSchemaI,
  TreeResponseI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = async (
  teamSlug: string,
  data: {
    project_id: string;
    name?: string;
    description?: string;
    is_public?: boolean;
  },
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
    .get(`/analyses/${analysisId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisRecentVersion = async (
  teamSlug: string,
  analysisId: string,
): Promise<AnalysisVersionMappingSchemaI | null> => {
  return api
    .get(`/analyses/${analysisId}/recent/analysis-version`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.analysis_version;
    });
};

export const getAnalysisRecentCodeVersion = async (
  teamSlug: string,
  analysisId: string,
): Promise<CodeVersionMappingSchemaI | null> => {
  return api
    .get(`/analyses/${analysisId}/recent/code-version`, {
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
    .post(`/analyses/${analysisId}/feedback`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalyses = async (
  teamSlug: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/analyses?${searchParams.toString()}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersion = async (
  teamSlug: string,
  analysisVersionId: string,
): Promise<AnalysisVersionMappingSchemaI> => {
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
    .patch(`/analyses/${analysisId}/visibility`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return {
        toInvalidate,
      };
    });
};

export const getAnalysisVersions = async (
  teamSlug: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<AnalysisVersionPaginationI> => {
  const searchParams = buildSearchParams(filters);
  return api
    .get(`/analysis-versions?${searchParams.toString()}`, {
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
