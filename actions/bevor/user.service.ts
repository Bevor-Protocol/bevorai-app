"use server";

import api from "@/lib/api";
import { generateQueryKey } from "@/utils/constants";
import {
  CreditSyncResponseI,
  MemberInviteSchema,
  ProjectsPaginationI,
  TeamDetailedSchemaI,
  UserDetailedSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const syncCredits = async (teamSlug: string): Promise<CreditSyncResponseI> => {
  return api
    .post("/auth/sync/credits", {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const get = async (): Promise<UserDetailedSchemaI> => {
  return api.get("/user").then((response) => {
    return response.data;
  });
};

export const update = async (data: { username: string }): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [generateQueryKey.currentUser()];
  return api.patch("/user", data).then(() => {
    return { toInvalidate };
  });
};

export const invites = async (): Promise<MemberInviteSchema[]> => {
  return api.get("/user/invites").then((response) => {
    return response.data.results;
  });
};

export const projects = async (): Promise<ProjectsPaginationI> => {
  return api.get("/user/projects").then((response) => {
    return response.data;
  });
};

export const teams = async (): Promise<TeamDetailedSchemaI[]> => {
  return api.get("/user/teams").then((response) => {
    return response.data.results;
  });
};
