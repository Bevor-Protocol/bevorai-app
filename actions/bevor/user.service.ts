"use server";

import api from "@/lib/api";
import { generateQueryKey } from "@/utils/constants";
import {
  ApiResponse,
  MemberInviteSchema,
  ProjectsPaginationI,
  TeamDetailedSchemaI,
  UserDetailedSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const get = async (): ApiResponse<UserDetailedSchemaI> => {
  return api
    .get("/user")
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

export const update = async (data: {
  username: string;
}): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.currentUser()];
  return api
    .patch("/user", data)
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

export const invites = async (): ApiResponse<MemberInviteSchema[]> => {
  return api
    .get("/user/invites")
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

export const projects = async (): ApiResponse<ProjectsPaginationI> => {
  return api
    .get("/user/projects")
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

export const teams = async (): ApiResponse<TeamDetailedSchemaI[]> => {
  return api
    .get("/user/teams")
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
