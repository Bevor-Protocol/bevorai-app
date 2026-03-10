"use server";

import api from "@/lib/api";
import { ApiResponse, TokenIssueResponse } from "@/utils/types";

export const validateToken = async (): ApiResponse<{ user_id: string }> => {
  return api
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
  return api
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
  return api
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
  return api
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
  console.log("ISSUING TOKEN WITH CLAIMS", claims);
  return api
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
