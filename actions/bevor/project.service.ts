"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import {
  CodeProjectDetailedSchemaI,
  CodeProjectsPaginationI,
  CreateProjectBody,
} from "@/utils/types";

export const createProject = async (teamId: string, data: CreateProjectBody): Promise<string> => {
  return api.post("/projects", data, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.id;
  });
};

export const getProjects = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<CodeProjectsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/projects?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getProject = async (
  teamId: string,
  projectId: string,
): Promise<CodeProjectDetailedSchemaI> => {
  return api
    .get(`/projects/${projectId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const deleteProject = async (teamId: string, projectId: string): Promise<boolean> => {
  return api
    .delete(`/projects/${projectId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const updateProject = async (
  teamId: string,
  projectId: string,
  data: { name?: string; description?: string; tags?: string[] },
): Promise<boolean> => {
  return api
    .patch(`/projects/${projectId}`, data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};
