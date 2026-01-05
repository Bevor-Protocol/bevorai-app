"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import { ProjectFormValues } from "@/utils/schema";
import {
  ApiResponse,
  ProjectDetailedSchemaI,
  ProjectsPaginationI,
  RecentCodeVersionSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createProject = async (
  teamSlug: string,
  data: ProjectFormValues,
): ApiResponse<{
  project: ProjectDetailedSchemaI;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.PROJECTS]];
  if (data.github_repo_id) {
    toInvalidate.push([QUERY_KEYS.GITHUB_REPOSITORIES]);
  }
  return api
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
    [key: string]: string;
  },
): ApiResponse<ProjectsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
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
): ApiResponse<ProjectDetailedSchemaI> => {
  return api
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
  return api
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
): ApiResponse<{ project: ProjectDetailedSchemaI; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.project(projectSlug), generateQueryKey.allProjects()];
  return api
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

export const getRecentCode = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<RecentCodeVersionSchemaI> => {
  return api
    .get(`/projects/${projectSlug}/recent-code`, { headers: { "bevor-team-slug": teamSlug } })
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
