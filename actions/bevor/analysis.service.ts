"use server";

import { apiRequest, withRequestId } from "@/actions/base";
import { securityApi } from "@/lib/api";
import { AnalysesQueryParams, FindingsQueryParams } from "@/types/api/requests/security";
import {
  AnalysisDagSchema,
  AnalysisNodeIndex,
  AnalysisNodeSchema,
  DraftFindingSchema,
  DraftSchema,
  FindingSchema,
  ScopeSchema,
} from "@/types/api/responses/security";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import type { QueryParamsRecord } from "@/utils/query-params";
import { buildSearchParams } from "@/utils/query-params";
import {
  AddAnalysisFindingBody,
  AnalysisFindingBody,
  createAnalysisFormValues,
  FindingFeedbackBody,
  FindingUpdateBody,
} from "@/utils/schema";
import { QueryKey } from "@tanstack/react-query";

export const createAnalysis = apiRequest<
  [teamSlug: string, data: createAnalysisFormValues],
  { id: string; toInvalidate: QueryKey[] }
>(async (teamSlug, data) => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return securityApi
    .post("/analyses", data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) =>
      withRequestId(response, {
        id: response.data.id,
        toInvalidate,
      }),
    );
});

export const getDAG = apiRequest<[teamSlug: string, analysisId: string], AnalysisDagSchema>(
  async (teamSlug, analysisId) =>
    securityApi
      .get(`/analyses/${analysisId}/dag`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data)),
);

export const getAnalysis = apiRequest<[teamSlug: string, analysisId: string], AnalysisNodeSchema>(
  async (teamSlug, analysisId) =>
    securityApi
      .get(`/analyses/${analysisId}`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data)),
);

export const getAnalysisFindings = apiRequest<
  [teamSlug: string, analysisId: string],
  DraftFindingSchema[]
>(async (teamSlug, analysisId) =>
  securityApi
    .get(`/analyses/${analysisId}/findings`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.results)),
);

export const getFindings = apiRequest<
  [teamSlug: string, query: FindingsQueryParams],
  FindingSchema[]
>(async (teamSlug, query) => {
  const searchParams = buildSearchParams(query as unknown as { [key: string]: string });
  return securityApi
    .get(`/findings?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.results));
});

export const getScopes = apiRequest<[teamSlug: string, analysisId: string], ScopeSchema[]>(
  async (teamSlug, analysisId) =>
    securityApi
      .get(`/analyses/${analysisId}/scopes`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data.results)),
);

export const toggleVisibility = apiRequest<
  [teamSlug: string, analysisId: string],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId) => {
  const toInvalidate = [generateQueryKey.analyses(teamSlug), generateQueryKey.analysis(analysisId)];
  return securityApi
    .patch(`/analyses/${analysisId}/visibility`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, { toInvalidate }));
});

export const getAnalyses = apiRequest<
  [teamSlug: string, query: AnalysesQueryParams | QueryParamsRecord],
  Pagination<AnalysisNodeIndex>
>(async (teamSlug, query) => {
  const searchParams = buildSearchParams(query as unknown as { [key: string]: string });
  return securityApi
    .get(`/analyses?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data));
});

export const forkAnalysis = apiRequest<
  [teamSlug: string, analysisId: string],
  { id: string; toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId) => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return securityApi
    .post(
      `/analyses/${analysisId}/fork`,
      {},
      {
        headers: { "bevor-team-slug": teamSlug },
      },
    )
    .then((response) =>
      withRequestId(response, {
        id: response.data.id,
        toInvalidate,
      }),
    );
});

export const mergeAnalysis = apiRequest<
  [teamSlug: string, toAnalysisNodeId: string, fromAnalysisNodeId: string],
  { id: string; toInvalidate: QueryKey[] }
>(async (teamSlug, toAnalysisNodeId, fromAnalysisNodeId) => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES, teamSlug]];
  return securityApi
    .post(
      `/analyses/${toAnalysisNodeId}/merge`,
      { from_analysis_id: fromAnalysisNodeId },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) =>
      withRequestId(response, {
        id: response.data.id,
        toInvalidate,
      }),
    );
});

export const commitDraft = apiRequest<[teamSlug: string, analysisId: string], { id: string }>(
  async (teamSlug, analysisId) =>
    securityApi
      .post(`/drafts/${analysisId}/commit`, {}, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, { id: response.data.id })),
);

export const getFinding = apiRequest<[teamSlug: string, findingId: string], FindingSchema>(
  async (teamSlug, findingId) =>
    securityApi
      .get(`/findings/${findingId}`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data)),
);

export const updateFinding = apiRequest<
  [teamSlug: string, analysisId: string, findingId: string, body: FindingUpdateBody],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId, findingId, body) => {
  const toInvalidate = [generateQueryKey.analysis(analysisId)];
  return securityApi
    .patch(`/findings/${findingId}`, body, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, { toInvalidate }));
});

export const addStagedFinding = apiRequest<
  [teamSlug: string, analysisId: string, data: AddAnalysisFindingBody],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId, data) => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisId)];
  return securityApi
    .post(`/analyses/${analysisId}/findings`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, { toInvalidate }));
});

export const deleteStagedFinding = apiRequest<
  [teamSlug: string, analysisId: string, findingId: string],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId, findingId) => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisId)];
  return securityApi
    .delete(`/analyses/${analysisId}/findings/${findingId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, { toInvalidate }));
});

export const updateStagedFinding = apiRequest<
  [teamSlug: string, analysisId: string, findingId: string, data: AnalysisFindingBody],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, analysisId, findingId, data) => {
  const toInvalidate = [generateQueryKey.analysisDraft(analysisId)];
  return securityApi
    .patch(`/analyses/${analysisId}/findings/${findingId}`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, { toInvalidate }));
});

export const getDraft = apiRequest<[teamSlug: string, analysisId: string], DraftSchema>(
  async (teamSlug, analysisId) =>
    securityApi
      .get(`/drafts/${analysisId}`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data)),
);

export const submitFindingFeedback = apiRequest<
  [teamSlug: string, analysisId: string, findingId: string, data: FindingFeedbackBody],
  FindingSchema
>(async (teamSlug, _analysisId, findingId, data) =>
  securityApi
    .post(`/findings/${findingId}/feedback`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data)),
);

export const getKanban = apiRequest<[teamSlug: string, projectId: string], FindingSchema[]>(
  async (teamSlug, projectId) =>
    securityApi
      .get<{ results: FindingSchema[] }>(`/projects/${projectId}/kanban`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data.results)),
);
