"use server";

import api from "@/lib/api";
import { ActivitySchemaI } from "@/utils/types";

export const getTeamActivities = async (teamSlug: string): Promise<ActivitySchemaI[]> => {
  return api.get("/activities", { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data.results;
  });
};
export const getProjectActivities = async (
  teamSlug: string,
  projectSlug: string,
): Promise<ActivitySchemaI[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("project_slug", projectSlug);
  return api
    .get(`/activities?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};
