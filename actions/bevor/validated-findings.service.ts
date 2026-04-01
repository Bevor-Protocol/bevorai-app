"use server";

import { businessApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { ValidatedFindingSchema } from "@/types/api/responses/business";
import { generateQueryKey } from "@/utils/constants";
import { QueryKey } from "@tanstack/react-query";

export const getValidatedFindings = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<ValidatedFindingSchema[]> => {
  return businessApi
    .get(`/projects/${projectSlug}/validated-findings`, {
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

export const addValidatedFinding = async (
  teamSlug: string,
  projectSlug: string,
  data: { finding_id: string; analysis_id: string },
): ApiResponse<{ record: ValidatedFindingSchema; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.validatedFindings(projectSlug)];
  return businessApi
    .post(`/projects/${projectSlug}/validated-findings`, data, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { record: response.data, toInvalidate },
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

export const updateValidatedFinding = async (
  teamSlug: string,
  projectSlug: string,
  validatedFindingId: string,
  data: { is_remediated: boolean },
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.validatedFindings(projectSlug)];
  return businessApi
    .patch(`/projects/${projectSlug}/validated-findings/${validatedFindingId}`, data, {
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

export const removeValidatedFinding = async (
  teamSlug: string,
  projectSlug: string,
  validatedFindingId: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.validatedFindings(projectSlug)];
  return businessApi
    .delete(`/projects/${projectSlug}/validated-findings/${validatedFindingId}`, {
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
