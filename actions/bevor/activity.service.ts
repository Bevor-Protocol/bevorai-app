"use server";

import api from "@/lib/api";
import { ActivitySchemaI, ApiResponse } from "@/utils/types";

export const getTeamActivities = async (teamSlug: string): ApiResponse<ActivitySchemaI[]> => {
  return api
    .get("/activities", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return { ok: true as const, data: response.data.results, requestId };
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

export const getProjectActivities = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<ActivitySchemaI[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("project_slug", projectSlug);

  return api
    .get(`/activities?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return { ok: true as const, data: response.data.results, requestId };
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
