"use server";

import api from "@/lib/api";
import { CodeProjectSchema, CodeProjectsResponse, CreateProjectBody } from "@/utils/types";

export const createProject = async (data: CreateProjectBody): Promise<CodeProjectSchema> => {
  return api.post("/projects", data).then((response) => {
    return response.data;
  });
};

export const getProjects = async (filters: {
  [key: string]: string;
}): Promise<CodeProjectsResponse> => {
  const searchParams = new URLSearchParams(filters);
  searchParams.set("page_size", filters.page_size ?? "9");

  return api.get(`/projects?${searchParams.toString()}`).then((response) => {
    return response.data;
  });
};

export const getProject = async (projectId: string): Promise<CodeProjectSchema> => {
  return api.get(`/projects/${projectId}`).then((response) => {
    return response.data;
  });
};

export const getAllProjects = async (): Promise<CodeProjectSchema[]> => {
  return api.get("/projects/admin/all", { headers: { "skip-team": true } }).then((response) => {
    return response.data.results;
  });
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  return api.delete(`/projects/${projectId}`).then((response) => {
    return response.data.success;
  });
};

export const updateProject = async (
  projectId: string,
  data: { name?: string; description?: string; tags?: string },
): Promise<CodeProjectSchema> => {
  return api.patch(`/projects/${projectId}`, data).then((response) => {
    return response.data;
  });
};
