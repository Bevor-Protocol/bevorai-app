"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  CreateProjectBody,
  ProjectDetailedSchemaI,
  ProjectsPaginationI,
  RecentCodeVersionSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const createProject = async (
  teamSlug: string,
  data: CreateProjectBody,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.PROJECTS]];
  return api
    .post("/projects", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getProjects = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): Promise<ProjectsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/projects?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getProject = async (
  teamSlug: string,
  projectSlug: string,
): Promise<ProjectDetailedSchemaI> => {
  return api
    .get(`/projects/${projectSlug}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const deleteProject = async (
  teamSlug: string,
  projectSlug: string,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [[QUERY_KEYS.PROJECTS]];
  return api
    .delete(`/projects/${projectSlug}`, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const updateProject = async (
  teamSlug: string,
  projectSlug: string,
  data: { name?: string; description?: string; tags?: string[] },
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.project(projectSlug)];
  return api
    .patch(`/projects/${projectSlug}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const getRecentCode = async (
  teamSlug: string,
  projectSlug: string,
): Promise<RecentCodeVersionSchemaI> => {
  return api
    .get(`/projects/${projectSlug}/recent-code`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
