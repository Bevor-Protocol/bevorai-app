"use server";

import { businessApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { ProjectFormValues } from "@/utils/schema";
import { QueryKey } from "@tanstack/react-query";

export const createProject = async (
  teamSlug: string,
  data: ProjectFormValues,
): ApiResponse<{
  project: ProjectDetailedSchema;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.PROJECTS]];
  if (data.github_repo_id) {
    toInvalidate.push([QUERY_KEYS.GITHUB_REPOSITORIES]);
  }
  return businessApi
    .post("/projects", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { project: response.data, toInvalidate },
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

export const getProjects = async (
  teamSlug: string,
  filters: {
    [key: string]: string | undefined;
  },
): ApiResponse<Pagination<ProjectDetailedSchema>> => {
  const searchParams = buildSearchParams(filters);

  return businessApi
    .get(`/projects?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
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

export const getProject = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<ProjectDetailedSchema> => {
  return businessApi
    .get(`/projects/${projectSlug}`, { headers: { "bevor-team-slug": teamSlug } })
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

export const deleteProject = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [[QUERY_KEYS.PROJECTS]];
  return businessApi
    .delete(`/projects/${projectSlug}`, { headers: { "bevor-team-slug": teamSlug } })
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

export const updateProject = async (
  teamSlug: string,
  projectSlug: string,
  data: ProjectFormValues,
): ApiResponse<{ project: ProjectDetailedSchema; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.project(projectSlug), generateQueryKey.allProjects()];
  return businessApi
    .patch(`/projects/${projectSlug}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { project: response.data, toInvalidate },
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
