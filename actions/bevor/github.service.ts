"use server";

import api from "@/lib/api";
import {
  ApiResponse,
  GithubInstallationsSchemaI,
  GithubRepoBranchesSchemaI,
  GithubRepositoriesSchemaI,
} from "@/utils/types";

export const handleCallback = async (data: {
  code: string;
  state: string;
  installation_id: string | null;
  setup_action: string | null;
}): ApiResponse<{ success: boolean; team_slug?: string }> => {
  return api
    .post("/github/callback", data)
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

export const getInstallationUrl = async (teamSlug?: string): ApiResponse<string> => {
  let url = "/github/urls/installation";
  if (teamSlug) {
    url += `?team_slug=${teamSlug}`;
  }

  return api
    .get(url)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.url,
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

export const getOauthUrl = async (teamSlug?: string): ApiResponse<string> => {
  // user access tokens can expire, and these are the only way to recover them.
  let url = "/github/urls/oauth";
  if (teamSlug) {
    url += `?team_slug=${teamSlug}`;
  }
  return api
    .get(url)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.url,
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

export const getInstallations = async (): ApiResponse<GithubInstallationsSchemaI> => {
  return api
    .get("/github/installations")
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

export const getRepositories = async (
  installationId: number,
  teamSlug?: string,
): ApiResponse<GithubRepositoriesSchemaI> => {
  let url = `/github/repositories/${installationId}`;
  if (teamSlug) {
    url += `?team_slug=${teamSlug}`;
  }
  return api
    .get(url)
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

export const getBranches = async (repoId: number): ApiResponse<GithubRepoBranchesSchemaI> => {
  return api
    .get(`/github/branches/${repoId}`)
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
