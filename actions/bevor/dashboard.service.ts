"use server";

import api from "@/lib/api";
import {
  CodeProjectsPaginationI,
  MemberInviteSchema,
  TeamDetailedSchemaI,
  TeamOverviewSchemaI,
  UserDetailedSchemaI,
} from "@/utils/types";

/*
Dashboard-specific actions, that span teams
*/

export const getUser = async (): Promise<UserDetailedSchemaI | null> => {
  return api
    .get("/dashboard/user")
    .then((response) => {
      return response.data;
    })
    .catch(() => null);
};

export const updateUser = async (data: { username: string }): Promise<boolean> => {
  return api.post("/dashboard/user", data).then((response) => {
    return response.data.success;
  });
};

export const getInvites = async (): Promise<MemberInviteSchema[]> => {
  return api.get("/dashboard/invites").then((response) => {
    return response.data.results;
  });
};

export const getAllProjects = async (filters: {
  [key: string]: string;
}): Promise<CodeProjectsPaginationI> => {
  const searchParams = new URLSearchParams(filters);
  searchParams.set("page_size", filters.page_size ?? "9");

  return api.get(`/dashboard/projects?${searchParams.toString()}`).then((response) => {
    return response.data;
  });
};

export const getTeams = async (): Promise<TeamDetailedSchemaI[]> => {
  return api.get("/dashboard/teams").then((response) => {
    return response.data.results;
  });
};

export const getTeamsOverview = async (): Promise<TeamOverviewSchemaI[]> => {
  return api.get("/dashboard/teams/overview").then((response) => {
    return response.data.results;
  });
};
