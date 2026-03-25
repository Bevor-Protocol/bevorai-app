"use server";

import { businessApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  InviteSchema,
  ProjectDetailedSchema,
  TeamDetailedSchema,
  UserDetailedSchema,
} from "@/types/api/responses/business";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey } from "@/utils/constants";
import { QueryKey } from "@tanstack/react-query";

export const get = async (): ApiResponse<UserDetailedSchema> => {
  return businessApi
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
  return businessApi
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

export const invites = async (): ApiResponse<InviteSchema[]> => {
  return businessApi
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

export const projects = async (): ApiResponse<Pagination<ProjectDetailedSchema>> => {
  return businessApi
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

export const teams = async (): ApiResponse<TeamDetailedSchema[]> => {
  return businessApi
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
