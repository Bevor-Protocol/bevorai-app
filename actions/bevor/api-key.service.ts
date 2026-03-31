"use server";

import { businessApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { AuthSchema } from "@/types/api/responses/business";
import { generateQueryKey } from "@/utils/constants";
import { KeyFormValues } from "@/utils/schema/key";
import { QueryKey } from "@tanstack/react-query";

export const listKeys = async (teamSlug: string): ApiResponse<AuthSchema[]> => {
  return businessApi
    .get("/auth", { headers: { "bevor-team-slug": teamSlug } })
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

export const createKey = async (
  teamSlug: string,
  data: KeyFormValues,
): ApiResponse<{ api_key: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return businessApi
    .post("/auth", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          api_key: response.data.api_key,
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

export const refreshKey = async (
  teamSlug: string,
  keyId: string,
): ApiResponse<{ api_key: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return businessApi
    .post(`/auth/${keyId}`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          api_key: response.data.api_key,
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

export const revokeKey = async (
  teamSlug: string,
  keyId: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.apiKeys(teamSlug)];
  return businessApi
    .delete(`/auth/${keyId}`, { headers: { "bevor-team-slug": teamSlug } })
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
