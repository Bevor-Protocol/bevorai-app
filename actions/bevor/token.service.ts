"use server";

import { businessApi, graphApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { TokenIssueResponse } from "@/types/api/responses/business";

export const validateToken = async (): ApiResponse<{ user_id: string }> => {
  return businessApi
    .get("/token/validate")
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

export const refreshToken = async (refreshToken: string): ApiResponse<TokenIssueResponse> => {
  // does not require authorization. We'll look for session expiry and valid refresh tokens in the api.
  return businessApi
    .post("/token/refresh", { refresh_token: refreshToken }, { headers: { skip_token: true } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    });
};

export const revokeToken = async (
  refreshToken: string,
  source: string = "unknown",
): ApiResponse<boolean> => {
  console.log("[auth] revokeToken called", { source });
  return businessApi
    .post(
      "/token/revoke",
      { refresh_token: refreshToken },
      {
        headers: { skip_token: true, "x-bevor-revoke-source": source },
      },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.success,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      console.error("[auth] revokeToken failed", {
        source,
        requestId,
        code: error.response?.data?.code,
        message: error.response?.data?.message ?? error.message,
      });
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const revokeAllTokens = async (): ApiResponse<boolean> => {
  return businessApi
    .post("/token/revoke/all")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.boolean,
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

export const issueSSEToken = async (claims: {
  team_slug?: string;
  project_slug?: string;
  code_version_id?: string;
  analysis_node_id?: string;
}): ApiResponse<string> => {
  return businessApi
    .post("/events/auth", { ...claims })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.token,
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

export const getSigningToken = async (
  teamSlug: string,
  data: {
    parent_id?: string;
    project_id: string;
  },
): ApiResponse<string> => {
  return graphApi
    .post("/versions/signing-key", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.signing_key,
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
