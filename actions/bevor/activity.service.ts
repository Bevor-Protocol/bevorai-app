"use server";

import api from "@/lib/api";
import { ActivitySchemaI } from "@/utils/types";

export const getTeamActivities = async (teamId: string): Promise<ActivitySchemaI[]> => {
  return api.get("/activities", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};
export const getProjectActivities = async (
  teamId: string,
  projectId: string,
): Promise<ActivitySchemaI[]> => {
  return api
    .get(`/activities/${projectId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};
